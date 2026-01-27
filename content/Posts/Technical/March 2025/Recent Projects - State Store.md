---
{"publish":true,"title":"Recent Projects: State Store, Part 1","created":"2025-03-02T03:21:44-04:00","modified":"2025-09-09T20:10:05.840-04:00","tags":["technical"],"cssclasses":""}
---


My therapist has told me that I should challenge myself by writing a bit more. Historically, most of my longer-form writing ends up being comments on [Hacker News](https://news.ycombinator.com/threads?id=tombert), and I think that some of them could be converted into blog posts without a lot of effort, but for whatever reason it never occurs for me to do so. 

Anyway, I see no reason not to treat this blog more or less as a "journal", where I can just write about stuff that I think is interesting.  Don't expect any amazing insight upon reading this, this is just a dumping ground for stuff that I think is neat, or stuff I've been working on. 

# Context.

My job involves a lot of [Kafka Streams](https://kafka.apache.org/documentation/streams/).  Kafka Streams is, in a kind of hand-wavey way, a [MapReduce](https://en.wikipedia.org/wiki/MapReduce) framework, specifically for, as you probably guessed, streaming data from Kafka.  It gives you the typical aggregations like `map` and `filter` and `groupBy`, and even some more interesting stuff like `join`, which lets you glue together different streams together on a key, roughly analogous to a SQL `JOIN`. 

The `join`ing is particularly frustrating problem.  Effectively all joining functions on streams boil down to something along the lines of: 


$$
\begin{aligned}
    &store \in k \mapsto v\\\\
    & \\\\
    &Thread_1: \\\\
    &\quad for (i \in firstStream): \\\\
    &\quad\quad if \left(i \in store\right):\\\\
    &\quad\quad\quad emit (thirdStream, (i, store[i.key])) \\\\
    &\quad\quad\quad store \setminus \lbrace i \rbrace\\\\
    &\quad\quad else: \\\\
    &\quad\quad\quad store \cup \lbrace i.key \mapsto i.value \rbrace \\\\
    & \\\\
    & \\\\
    &Thread_2: \\\\
    &\quad for (i \in secondStream): \\\\
    &\quad\quad if \left(i \in store\right):\\\\
    &\quad\quad\quad emit (thirdStream, (i, store[i.key])) \\\\
    &\quad\quad\quad store \setminus \lbrace i \rbrace\\\\
    &\quad\quad else: \\\\
    &\quad\quad\quad store \cup \lbrace i.key \mapsto i.value \rbrace \\\\
\end{aligned}
$$

To those of you who don't like mathematical notation, this roughly translates to: 
1. Create a thread-safe map.
2. For each element of the stream check if it's a member of that store.
3. If not, add the element to the store.
4. If it is, emit the pairing of the items in the store into a third stream, then delete the element. 

I think smart people call this a Cartesian Product but I'm not nearly smart enough to know that. 

There's an obvious problem with this: We might not have a pair for a long time, potentially making $store$ grow faster than it can be consumed. This can end up eating all of our memory, which could lead to issues, particularly in memory-constrained environments. 

As far as I'm aware, there isn't really a way to solve this problem.  There are ways of making this less of a problem, but the algorithm still ends up looking like this. 

In order to avoid eating all your memory, the way most systems do this (including Kafka Streams) is to write the join store to the disk.  

## RocksDB

[RocksDB](https://rocksdb.org/) is effectively a disk-based hash map...mostly. 

It absolutely does write to the disk, but it can be *extremely* difficult to tune the memory settings to avoid the RAM-eating problem we had in the first place. 

Additionally, RocksDB stores in Kafka Streams are *local* to the writing process.  This matters because if data is needed between two or more nodes, data must be duplicated.  Duplicating data can be fine depending on the size, but if your project involves processing terabytes of data (as ours is), duplicating across multiple nodes becomes a fairly expensive problem, especially if you're doing something on the "Cloud", where you're paying per-gigabyte for storage. 

Initially on this project, the goal was to simply tune RocksDB to fix the memory problem, and utilize compression to try and cut down on the disk costs.  This worked, but never as well as we were hoping, so it brought us back to the drawing board. 


## PostgreSQL


Kafka Streams actually has an [API](https://kafka.apache.org/25/javadoc/org/apache/kafka/streams/state/KeyValueStore.html) for creating custom state stores for this exact purpose, so some research was done for this. 

We were already using PostgreSQL throughout our application, and it has a few advantages in this: 

- It's (comparatively) cheap in Cloud applications compared to large SSDs.
- It has the ability to do more elaborate queries on the data if we so desire. 
- It's centralized, giving us the ability to share data across nodes. 

It also has a few disadvantages. 

- Being centralized means a network hop from our processor to the database, considerably increasing latency.
- Even disregarding latency (which you shouldn't), individual queries in PostgreSQL are much slower than something like RocksDB. 


# Getting Started.
 
My initial prototype was a naive implementation. 


```java
public void put(Bytes key, Bytes value) {
      try (PreparedStatement pstmt = conn.prepareStatement("INSERT INTO Store (key, value) VALUES (?, ?)")) {
            pstmt.setBytes(1, key.get());
            pstmt.setBytes(2, value.get());
	    pstmt.executeStatement();
      }
}

public Bytes get(Bytes key) {
      try (PreparedStatement pstmt = conn.prepareStatement("SELECT value FROM Store WHERE key = ?")) {
	    pstmt.setBytes(1, key.get());
            try (ResultSet rs = pstmt.executeQuery()){
	        if (rs.next()) {
                    byte[] valueData = rs.getBytes("value");
		    return Bytes.wrap(valueData);
		}
	    }
      }
}
```

(There's a lot more to it than this but these are two of the more interesting bits to focus on)

This did "work", by some definitions of the word, but it was several orders of magnitude slower than the original RocksDB version, too low for our requirements. 

This is when I realized something:

## Kafka Streams is Frustratingly Designed.

Despite the fact that Kafka Streams does provide an interface to create your own state store, it is really not designed for it. 

What I mean by this is that everything about Kafka Streams' design assumes that lookups and inserts are effectively "free", or at least inexpensive.  This is a reasonable enough assumption for something like RocksDB, where it runs in-process, never hits a network, and has fancy heuristics to keep a lot of data in-memory, so most lookups are optimistic. 

We cannot make any of those assumptions with PostgreSQL. We don't know where data is going to live, we don't know how it's going to be organized, data is guaranteed to be written to a disk, and JDBC will block until it's done. There are ways of making PostgreSQL faster, but there are physics issues that will force you to deal with latency no matter how clever you are.  

Suppose we have a billion items coming on a stream, and lets assume that our average latency of 2 milliseconds per-item.  

$$
0.002_{seconds/items} * 1,000,000,000_{items} = 2,000,000
$$

That's two million seconds to process everything!  That ends up being a bit more than three weeks to process everything, compared to about seven hours with the old RocksDB version.  

This of course is a worst-case. We can get this down considerably by adding some concurrency. Let's start with the puts, since they're a bit easier, since we don't care about the return values. 


```java 

public static BlockingQueue<Pair<Bytes, Bytes>> putQueue = new ArrayBlockingQueue<>(NUM_THREADS); 


LongStream.range(0, NUM_THREADS).forEach(_i ->{
    Thread.startVirtual(() -> {
        while (true) {
	    try {
	    var value = putQueue.take(); 
	    
            try (PreparedStatement pstmt = conn.prepareStatement("INSERT INTO Store (key, value) VALUES (?, ?)")) {
                pstmt.setBytes(1, value.getKey.get());
                pstmt.setBytes(2, value.getValue.get());
	        pstmt.executeStatement();
            }
	    } catch (InterruptionException e) {
	       throw new RuntimeException(e);
	    }
	}
    });
});



public void put(Bytes key, Bytes value) {
    putQueue.put(Pair.of(key, value)); 
}

```

(They're not perfect, but I really like `BlockingQueue`s in Java.)

In this code, we farm out our SQL to multiple worker threads, and we can get considerably better performance than the first naive example.  In my case, adding ten threads ended up making it around four times faster, though I suspect that your mileage may vary. Of course, this still has the same latency problem as before; each trip to SQL still cost about two milliseconds, we just added concurrency so that we could pay some of the cost simultaneously. 

However, now that we're queuing, there's no reason we actually *can* solve this problem, at least slightly by batching.  `BlockingQueue`s actually make this relatively straightforward. 


```java
public static BlockingQueue<Pair<Bytes, Bytes>> putQueue = new ArrayBlockingQueue<>(MAX_ENQUEUED_SIZE); 
public static ConcurrentHashMap<Bytes, Bytes> cache = new ConcurrentHashMap<>(); 

LongStream.range(0, NUM_THREADS).forEach(_i ->{
    Thread.startVirtual(() -> {
        while (true) {
	    Thread.sleep(1); 
	    var buffer = new ArrayList<Pair<Bytes,Bytes>>(); 
	    putQueue.drainTo(buffer, MAX_QUERY_SIZE);
	    var valuesQuery = buffer.stream().map(i ->{
	        return "(?,?)";
	    }).collect(Collectors.joining(" "));
	    
	    var query = "INSERT INTO Store (key, value) VALUES " + valuesQuery; 
	    
            try (PreparedStatement pstmt = conn.prepareStatement(query)) {
	        LongStream.range(0,buffer.size()).forEach(i -> {
		   pstmt.setBytes(2 * i + 1, buffer.get(i).getKey().get()); 
		   pstmt.setBytes(2 * i + 2, buffer.get(i).getValue().get()); 
	        });
	        pstmt.executeStatement();
		buffer.stream().forEach(i-> {
		   cache.remove(i.getKey());
		});
            }
	}
    });
});

public void put(Bytes key, Bytes value) {
    cache.put(key, value);
    putQueue.put(Pair.of(key, value)); 
}
```

It's possible that data can linger in the queue for a long time, we insert into a cache before enqueing. This gives us the ability to do a cheap lookup for the value if it is requested before it's written to PostgreSQL.  We don't want this to grow infinitely, so we trash the item after it's done. 

This nice thing about this is that we can amortize the latency; going to and from SQL cost roughly the same whether the query has one item or a thousand, meaning that with a max batch size of one thousand, we can optimistically get the per-item latency cost down to somewhere between two and four microseconds. Of course, that's optimistic, and we don't always get optimistic. We are also potentially introducing an millisecond of extra latency by adding the `Thread.sleep(1)` in our listening loop.  In practice (at least for heavy loads) this doesn't matter; we're adding an extra millisecond for a thousand items. 

Of course, this is just half of the problem.  `put`s are simple to make asynchronous; they don't have a return value, so the calling thread doesn't strictly *have* to wait most of the time. 

That's honestly the more interesting problem, but it would require another post about this same length, and so next time, we will discuss how we implement `get`s.





