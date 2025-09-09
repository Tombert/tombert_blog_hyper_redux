---
{"publish":true,"title":"Recent Projects: State Store, Part 2","created":"2025-03-03T03:21:44-04:00","modified":"2025-09-09T19:28:22.750-04:00","tags":["technical"],"cssclasses":""}
---



So  [[Posts/March 2025/Recent Projects - State Store\|last time]]  I described how handled the `put` logic in the state store replacement in Kafka Streams.  If you haven't read that, then this post is probably going to be confusing, so you should probably read that first. 

# Get Logic. 

As I said in the last post, `put`s are relatively simple to optimize.  Since there isn't any response expected, we can treat the work as completely asynchronous, and that's what we did: the store puts the data into a blocking queue, and writes a value to the cache. 

`get`s are tricky, because they expect a response, and since Kafka Streams is block-heavy by design, there isn't an obvious way to fire and forget like we could with puts.  


If you remember, or initial version looked something like this: 

```java
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

This will pay a full latency cost for each item in the stream, which can get very expensive very quickly.  Round trips to PostgreSQL can take around two milliseconds. 

So should we give up now, and admit that this was a fool's errand in the first place? 

Probably, but there is a way to accomplish batching in synchronous systems: `CompletableFuture`s. 

For those that don't know, a `Future` in concurrent programming is effectively an object that works as a handle for a computation that will be completed in, well, the future. Clever name, isn't it? 

Anyway, `CompletableFuture`s give us a tool that we can use to exploit batching.  Let's modify our `get` function. 


```java

BlockingQueue<Pair<Bytes,CompletableFuture<Optional<Bytes>>> getQueue = new ArrayBlockingQueue<>(1_000); 


public Bytes get(Bytes key) {
    var cacheVal = cache.get(key); 
    
    if (cacheVal != null) {
        return cacheVal; 
    }
    
    var resFuture = new CompletableFuture<Optional<Bytes>>();
    
    getQueue.put(Pair.of(key, resFuture)); 
    
    var result = resFuture.get(); 
    return res.orElse(null); 
}

```

The `get` function will check to see if a value exists in the cache.  If it doesn't exist we creates a future, put it into a queue to be processed later, and block on the result.

`CompletableFuture`s get annoyed when you send `null` values, but Kafka Streams expect a `null` when the value doesn't exist, so we need to wrap our values in an `Optional`.

This of course won't do anything by itself, so let's build the consumer. 

```java
Thread.startVirtualThread(() -> {
   while(true) {
       Thread.sleep(1); 
       var items = new ArrayList<Pair<Bytes,CompletableFuture<Optional<Bytes>>>>();
       getQueue.drainTo(items, 1_000);
       var lookupMap = new ConcurrentHashMap<Bytes,CompletableFuture<Optional<Bytes>>>(); 
       items.stream().forEach(i -> {
           lookupMap.add(i.getKey(), i.getValue()); 
       }); 
       
       var questionString = "(" + items.stream().map(i -> "?").collect(Collectors.joining(",")) + ")";
       var query = "SELECT key, value FROM store WHERE key in " + questionString; 
       
       try (PreparedStatement pstmt = conn.prepareStatement(query)) {
           LongStream.range(0,items.size()).forEach(i -> {
	       pstmt.setBytes(i, items.get(i).getKey());
	   });
	   
	   var rs = pstmt.executeQuery();
	   
	   while(rs.next()){
	       var value = Optional.ofNullable(rs.getBytes("value"));
	       var key = rs.getBytes("key");
	       if (key != null) {
		   var wrappedKey = Bytes.wrap(key);
	           var retFuture = lookupMap.get(wrappedKey);
		   
		   retFuture.complete(value); 
		   lookupMap.remove(wrappedKey); 
	       } 	
	   }
	   lookupMap.forEach((key, value) -> {
	       value.complete(Optional.empty());
	   });
       }
   }
}); 
```

This is relatively straightforward. Instead of doing one-off queries, we instead batch using a `WHERE IN` clause, and pass in a set of keys that we want to look up.  Before we do that, we assign a mapping into a `HashMap`, since we cannot depend on things being returned in the correct order from PostgreSQL.

We loop through the results, and complete each `CompletableFuture` that we get back, and we remove it from the `HashMap` afterwards.  The reason we do that is because it's entirely possible that the key doesn't exist yet.  If we only complete the `Future`s that have a result, we risk having threads that are stuck waiting for a `null` value that will never arrive. 

As such, after we've finished looping over the SQL result, we need to loop over the remainder ofthe map and simply return back an empty optional to signal that we have nothing in the database. 

This, again, lets us amortize our results considerably.  Indexed queries in PostgreSQL are reasonably fast, and when we have the full thousand items in our lookup set, we can get a per-item cost of about 2-4 microseconds. 

# Conclusion

This seems like a good enough stopping point for now. There's plenty more to talk about, and I will soon enough. 

Next time we'll look into some extra trickery to even further reduce our strain on SQL. 



