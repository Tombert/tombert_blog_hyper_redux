---
{"publish":true,"title":"Microbenchmarks: HashMap, ConcurrentHashMap, and Guava Caches","created":"2025-03-05T09:21:44-04:00","modified":"2025-09-09T20:13:31.260-04:00","tags":["technical"],"cssclasses":""}
---


> UPDATE: According to a comment on [Hacker News](https://news.ycombinator.com/item?id=43274675#43275392) It appears that my testing here was a bit flawed, particularly at the tail end, since I reused the maps between runs. Additionally, there is apparently a bit more variability that you have to consider when doing this outside of just timestamps, and they recommended I look into JMH.  
> 
> For more accurate benchmarks, skip this post and read [[Posts/Technical/March 2025/Microbenchmarks - JMH and Corrections\|this]] one instead. 


I've actually been having a surprising amount of fun playing with these microbenchmarks to challenge my assumptions, and they don't really hurt anything to write and publish, so why not keep up the momentum? 

I almost never use the regular Java [HashMap](https://docs.oracle.com/javase/8/docs/api/java/util/HashMap.html), and instead always defaulted to the [ConcurrentHashMap](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/concurrent/ConcurrentHashMap.html) instead, even for single-threaded stuff. My reasoning has always been that it's good to have automatic thread-safety "for free", it implements the [Map](https://docs.oracle.com/en/java/javase/17/docs/api/java.base/java/util/Map.html) interface, and this way if I want to later make something multithreaded, it should be one less thing I have to worry about. 

I also always figured that the synchronization for it shouldn't be too expensive, since if only one thread is accessing it, there shouldn't be any lock contention.  

I realized a few days ago that I have never really tested that assumption.  It *sounds* true, it *might* be true, but it's also relatively easy to know for sure. 

# HashMap

Our test will be pretty simple: insert 100 million [UUIDs](https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/util/UUID.html) into a map, and then access those 100 million `UUID`s later, and see how long it takes.

The basic setup looks something like this: 


```java

public static Integer numItems = 100_000_000;


public static Pair<Duration, Duration> mapTest(Map<UUID, UUID> myMap, List<UUID> inputIds) {
	var putStartTime = Duration.ofNanos(System.nanoTime());
	inputIds.forEach(i -> {
	    myMap.put(i, i);
	});
	var putEndTime = Duration.ofNanos(System.nanoTime());
	var putTotalTime = putEndTime.minus(putStartTime);

	var getStartTime = Duration.ofNanos(System.nanoTime());
	inputIds.forEach(i -> {
	    var t = myMap.get(i);
	});
	var getEndTime = Duration.ofNanos(System.nanoTime());
	var getTotalTime = getEndTime.minus(getStartTime);

	myMap.clear();

	return Pair.of(putTotalTime, getTotalTime);
}


public static void main(String[] args) throws InterruptedException {
	var inputIds =  LongStream.range(0, numItems).mapToObj(i -> UUID.randomUUID()).toList();
	var regularMap = new HashMap<UUID,UUID>();

	var regularHashMapRes = mapTest(regularMap, inputIds);
	
	System.out.println("Hashmap Put Time: " + regularHashMapRes.getLeft().toMillis() + "ms, Get Time: " + regularHashMapRes.getRight().toMillis() + "ms, total: " + regularHashMapRes.getLeft().plus(regularHashMapRes.getRight()).toMillis() + "ms");

}

```

We use the Apache Commons [Pair](https://commons.apache.org/proper/commons-lang/apidocs/org/apache/commons/lang3/tuple/Pair.html) object, simply because I'm too lazy to reinvent it for the hundredth time.  I have no idea how much overhead it adds, but I'll use it for all my tests so we can factor it out. 

Anyway, running it we get this: 

```
Hashmap Put Time: 27729ms, Get Time: 11673ms, total: 39402ms
```

About thirty-nine seconds to do everything, with twenty-eight seconds for the `put` and eleven seconds for the `get`. 

Now that we have our control, let's move onto the more interesting stuff. 


# ConcurrentHashMap

Since `ConcurrentHashMap` implements the `Map` interface, we don't actually have to change all that much. We simply edit our `main` function like this: 

```java
public static void main(String[] args) throws InterruptedException {
	var inputIds =  LongStream.range(0, numItems).mapToObj(i -> UUID.randomUUID()).toList();
	var concurrentMap = new ConcurrentHashMap<UUID,UUID>();

	var concurrentHashMapRes = mapTest(concurrentMap, inputIds);
	System.out.println("ConcurrentHashmap Put Time: " + concurrentHashMapRes.getLeft().toMillis() + "ms, Get Time: " + concurrentHashMapRes.getRight().toMillis() + "ms, total:" + concurrentHashMapRes.getLeft().plus(concurrentHashMapRes.getRight()).toMillis() + "ms");
}

```

Running this, I get: 

```
ConcurrentHashmap Put Time: 33006ms, Get Time: 11544ms, total:44550ms
```

Interesting.  `ConcurrentHashMap` is about ten percent slower than a regular map.  

I genuinely thought the performance would be equivalent in a single-threaded task.  You don't have to worry about any lock contention if you only have one thread, and I had figured that Java was smart enough to optimize that away.  

I ran this several times, and `ConcurrentHashMap` is consistently about ten percent slower than regular `HashMap`. I guess this is why I write these benchmarks!


# Guava

After I wrote this test, I was going to write up this blog and publish it, but it also occured to me that I also use Guava [Caches](https://github.com/google/guava/wiki/CachesExplained) pretty liberally, and they're more or less a replacement for `ConcurrentHashMap`.  Might as well test them while I'm at it. 

Annoyingly, Guava Caches do *not* implement the `Map` interface, so I have to rewrite the processing function:

```java
public static Pair<Duration, Duration> guavaTest(Cache<UUID,UUID> cache, List<UUID> inputIds) {
        var putStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            cache.put(i, i);
        });
        var putEndTime = Duration.ofNanos(System.nanoTime());
        var putTotalTime = putEndTime.minus(putStartTime);

        var getStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            var t = cache.getIfPresent(i);
        });
        var getEndTime = Duration.ofNanos(System.nanoTime());
        var getTotalTime = getEndTime.minus(getStartTime);

        cache.invalidateAll();
        return Pair.of(putTotalTime, getTotalTime);
    }
```

This should be roughly the same as what I had with the `Map`s.  Then we need to modify our `main`: 

```java
public static void main(String[] args) throws InterruptedException {
	var inputIds =  LongStream.range(0, numItems).mapToObj(i -> UUID.randomUUID()).toList();
	Cache<UUID,UUID> guavaMap = CacheBuilder.newBuilder().concurrencyLevel(numThreads).build();
	var guavaRes = guavaTest(guavaMap, inputIds);
	
	 System.out.println("Guava Cache Put Time: " + guavaRes.getLeft().toMillis() + "ms, Get Time: " + guavaRes.getRight().toMillis() + "ms, total:" + guavaRes.getLeft().plus(guavaRes.getRight()).toMillis() + "ms");

}
```

Upon running this, we get: 

```
Guava Cache Put Time: 45393ms, Get Time: 24593ms, total:69987ms
```

Wow, Guava Caches are about *half* the speed of regular `HashMap`s and about thirty-five percent slower than `ConcurrentHashMap`! I had no idea how much overhead these added. Obviously Caches give you a lot more than just a vanilla `HashMap`, so I'm not suggesting you get rid of them, but I guess you should only use them when you actually need those features. Again, good to check your assumptions. 

# Locking?

After I wrote these tests, I was really curious how much overhead a vanilla lock or `synchronized` inherently adds to the processing.  

Let's modify our test to find out!

```java
public synchronized static Pair<Duration, Duration> mapTestSync(Map<UUID, UUID> myMap, List<UUID> inputIds) {
        var putStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            myMap.put(i, i);
        });
        var putEndTime = Duration.ofNanos(System.nanoTime());
        var putTotalTime = putEndTime.minus(putStartTime);

        var getStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            var t = myMap.get(i);
        });
        var getEndTime = Duration.ofNanos(System.nanoTime());
        var getTotalTime = getEndTime.minus(getStartTime);

        myMap.clear();

        return Pair.of(putTotalTime, getTotalTime);
    }

    public static Pair<Duration, Duration> mapTestLock(Map<UUID, UUID> myMap, List<UUID> inputIds) {
        lock.lock();
        try {
            var putStartTime = Duration.ofNanos(System.nanoTime());
            inputIds.forEach(i -> {
                myMap.put(i, i);
            });
            var putEndTime = Duration.ofNanos(System.nanoTime());
            var putTotalTime = putEndTime.minus(putStartTime);

            var getStartTime = Duration.ofNanos(System.nanoTime());
            inputIds.forEach(i -> {
                var t = myMap.get(i);
            });
            var getEndTime = Duration.ofNanos(System.nanoTime());
            var getTotalTime = getEndTime.minus(getStartTime);

            myMap.clear();

            return Pair.of(putTotalTime, getTotalTime);
        } finally {
            lock.unlock();
        }
    }
    
public static void main(String[] args) throws InterruptedException { 
	var lockMap = new HashMap<UUID,UUID>();
	var syncMap = new HashMap<UUID,UUID>();
	
	var lockHashMapRes = mapTestLock(lockMap, inputIds);
        var syncHashMapRes = mapTestSync(syncMap, inputIds);
	
	 System.out.println("Locked Hashmap Put Time: " + lockHashMapRes.getLeft().toMillis() + "ms, Get Time: " + lockHashMapRes.getRight().toMillis() + "ms, total:" + lockHashMapRes.getLeft().plus(lockHashMapRes.getRight()).toMillis() + "ms");
	
	System.out.println("Synchronized Hashmap Put Time: " + syncHashMapRes.getLeft().toMillis() + "ms, Get Time: " + syncHashMapRes.getRight().toMillis() + "ms, total:" + syncHashMapRes.getLeft().plus(syncHashMapRes.getRight()).toMillis() + "ms");

}
```

When running this we get: 

```
Locked Hashmap Put Time: 26700ms, Get Time: 10894ms, total:37594ms
Synchronized Hashmap Put Time: 24709ms, Get Time: 11890ms, total:36600ms
```

So now I'm really confused; it doesn't appear that adding even relatively naive locking significantly affects the performance of `HashMap`.  

I haven't been able to figure out why `ConcurrentHashMap` is slower than my lock versions; surely they would be using more advanced stuff than what I'm doing.  I don't know, if anyone knows please reach out to me. 

# Concurrency

Ok, so I've been testing single-threaded performance, but maybe that's not a completely fair test; these kinds of data structures *are* designed for multithreaded code, so just to be thorough, let's write some multithreaded code. 

Since regular `HashMap` doesn't claim to be thread-safe, we won't test that, but we can test the other four constructions. We need to modify our `main` function and add some extra variables. 

```java
public static ReentrantLock lock = new ReentrantLock();
public static Integer numItems = 100_000_000;
public static Integer numThreads = 20;
public static Integer partSize = numItems / numThreads;

public static CountDownLatch concurrentLatch = new CountDownLatch(numThreads);
public static CountDownLatch syncMapLatch = new CountDownLatch(numThreads);
public static CountDownLatch lockLatch = new CountDownLatch(numThreads);
public static CountDownLatch guavaLatch = new CountDownLatch(numThreads);

public static void main(String[] args) throws InterruptedException {

	var inputIds =  LongStream.range(0, numItems).mapToObj(i -> UUID.randomUUID()).toList();
	var concurrentMap = new ConcurrentHashMap<UUID,UUID>();
	var regularMap = new HashMap<UUID,UUID>();
	var lockMap = new HashMap<UUID,UUID>();
	var syncMap = new HashMap<UUID,UUID>();

	Cache<UUID,UUID> guavaMap = CacheBuilder.newBuilder().concurrencyLevel(numThreads).build();


	var concurrentCourseStartTime = Duration.ofNanos(System.nanoTime());
	Lists.partition(inputIds, partSize).forEach(part -> {
	    new Thread(() -> {
		var res = mapTest(concurrentMap, part);
		concurrentMapTotalPut.addAndGet(res.getLeft().toMillis());
		concurrentMapTotalGet.addAndGet(res.getRight().toMillis());
		concurrentLatch.countDown();
	    }).start();
	});
	concurrentLatch.await();
	var concurrentCourseEndTime = Duration.ofNanos(System.nanoTime());
	var concurrentCourseTotal = Duration.ofNanos(System.nanoTime());

	var lockCourseStartTime = Duration.ofNanos(System.nanoTime());
	Lists.partition(inputIds, partSize).forEach(part -> {
	    new Thread(() -> {
		var res = mapTestLock(lockMap, part);
		lockMapTotalPut.addAndGet(res.getLeft().toMillis());
		lockMapTotalGet.addAndGet(res.getRight().toMillis());
		lockLatch.countDown();
	    }).start();
	});

	lockLatch.await();
	var lockCourseEndTime = Duration.ofNanos(System.nanoTime());
	var lockCourseTotal = lockCourseEndTime.minus(lockCourseStartTime);

	var syncCourseStartTime = Duration.ofNanos(System.nanoTime());
	Lists.partition(inputIds, partSize).forEach(part -> {
	    new Thread(() -> {
		var res = mapTestSync(syncMap, part);
		syncMapTotalPut.addAndGet(res.getLeft().toMillis());
		syncMapTotalGet.addAndGet(res.getRight().toMillis());
		syncMapLatch.countDown();
	    }).start();
	});
	syncMapLatch.await();
	var syncCourseEndTime = Duration.ofNanos(System.nanoTime());
	var syncCourseTotal = syncCourseEndTime.minus(syncCourseStartTime);

	var guavaCourseStartTime = Duration.ofNanos(System.nanoTime());
	Lists.partition(inputIds, partSize).forEach(part -> {
	    new Thread(() -> {
		var res = guavaTest(guavaMap, part);
		guavaTotalPut.addAndGet(res.getLeft().toMillis());
		guavaTotalGet.addAndGet(res.getRight().toMillis());
		guavaLatch.countDown();
	    }).start();
	});
	guavaLatch.await();
	var guavaCourseEndTime = Duration.ofNanos(System.nanoTime());
	var guavaCourseTotal = guavaCourseEndTime.minus(guavaCourseStartTime);
	
	System.out.println("============ Multithreaded ============");
	System.out.println("ConcurrentHashMap Total Time: " + concurrentCourseTotal.toMillis() + "ms");
	System.out.println("Sync Total Time: " + syncCourseTotal.toMillis() + "ms");
	System.out.println("Locked Total Time: " + lockCourseTotal.toMillis() + "ms");
	System.out.println("Guava Total Time: " + guavaCourseTotal.toMillis() + "ms");

}

```

Wow, that's a mouthful! 

Basically we use `CountDownLatch`es to know *when* the threads are done processing the total.

(Also, how awesome are those `Duration` objects?  They make it so much easier to do your time-unit conversions!)

When we kick this off, we get the following results: 

```java
ConcurrentHashMap Total Time: 13261ms
Sync Total Time: 19408ms
Locked Total Time: 20477ms
Guava Total Time: 19612ms
```

Ok, so now things make sense.  `ConcurrentHashMap` appears to be considerably faster when there's any kind of thread contention, and Guava isn't nearly as depressingly slow when you add multiple threads. 


# Conclusion

I guess if I learned anything, it's that if I know my map isn't going to be used across multiple threads, it's probably better to stick with a regular `HashMap`, and I should *avoid* Guava for single-threaded tasks, unless I need the other features from it.

To be clear, take these results with a grain of salt; outside of tightloops, your choice of Map probably *isn't* your bottleneck.  If your application is very disk or network-heavy, then you will get a much higher return-on-investment by figuring out how to reduce IO activity than micro-optimizing your choice of map. Still, I think it's useful to have these numbers just to build an intuition on when using these tools makes sense. 

This was kind of a fun test to write; got some results I wasn't expecting, and that's the fun of this stuff. 


As usual, here's the complete code file, please let me know if you see any mistakes:

```java
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import com.google.common.collect.Lists;
import org.apache.commons.lang3.tuple.Pair;

import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.LongStream;

public class Main {

    public static ReentrantLock lock = new ReentrantLock();
    public static Integer numItems = 100_000_000;
    public static Integer numThreads = 20;
    public static Integer partSize = numItems / numThreads;

    public static CountDownLatch concurrentLatch = new CountDownLatch(numThreads);
    public static CountDownLatch syncMapLatch = new CountDownLatch(numThreads);
    public static CountDownLatch lockLatch = new CountDownLatch(numThreads);
    public static CountDownLatch guavaLatch = new CountDownLatch(numThreads);

    public static Pair<Duration, Duration> guavaTest(Cache<UUID,UUID> cache, List<UUID> inputIds) {
        var putStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            cache.put(i, i);
        });
        var putEndTime = Duration.ofNanos(System.nanoTime());
        var putTotalTime = putEndTime.minus(putStartTime);

        var getStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            var t = cache.getIfPresent(i);
        });
        var getEndTime = Duration.ofNanos(System.nanoTime());
        var getTotalTime = getEndTime.minus(getStartTime);

        cache.invalidateAll();
        return Pair.of(putTotalTime, getTotalTime);

    }

    public static Pair<Duration, Duration> mapTest(Map<UUID, UUID> myMap, List<UUID> inputIds) {
        var putStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            myMap.put(i, i);
        });
        var putEndTime = Duration.ofNanos(System.nanoTime());
        var putTotalTime = putEndTime.minus(putStartTime);

        var getStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            var t = myMap.get(i);
        });
        var getEndTime = Duration.ofNanos(System.nanoTime());
        var getTotalTime = getEndTime.minus(getStartTime);

        myMap.clear();

        return Pair.of(putTotalTime, getTotalTime);
    }

    public synchronized static Pair<Duration, Duration> mapTestSync(Map<UUID, UUID> myMap, List<UUID> inputIds) {
        var putStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            myMap.put(i, i);
        });
        var putEndTime = Duration.ofNanos(System.nanoTime());
        var putTotalTime = putEndTime.minus(putStartTime);

        var getStartTime = Duration.ofNanos(System.nanoTime());
        inputIds.forEach(i -> {
            var t = myMap.get(i);
        });
        var getEndTime = Duration.ofNanos(System.nanoTime());
        var getTotalTime = getEndTime.minus(getStartTime);

        myMap.clear();

        return Pair.of(putTotalTime, getTotalTime);
    }

    public static Pair<Duration, Duration> mapTestLock(Map<UUID, UUID> myMap, List<UUID> inputIds) {
        lock.lock();
        try {
            var putStartTime = Duration.ofNanos(System.nanoTime());
            inputIds.forEach(i -> {
                myMap.put(i, i);
            });
            var putEndTime = Duration.ofNanos(System.nanoTime());
            var putTotalTime = putEndTime.minus(putStartTime);

            var getStartTime = Duration.ofNanos(System.nanoTime());
            inputIds.forEach(i -> {
                var t = myMap.get(i);
            });
            var getEndTime = Duration.ofNanos(System.nanoTime());
            var getTotalTime = getEndTime.minus(getStartTime);

            myMap.clear();

            return Pair.of(putTotalTime, getTotalTime);
        } finally {
            lock.unlock();
        }
    }

    public static void main(String[] args) throws InterruptedException {
        var inputIds =  LongStream.range(0, numItems).mapToObj(i -> UUID.randomUUID()).toList();
        var concurrentMap = new ConcurrentHashMap<UUID,UUID>();
        var regularMap = new HashMap<UUID,UUID>();
        var lockMap = new HashMap<UUID,UUID>();
        var syncMap = new HashMap<UUID,UUID>();

        Cache<UUID,UUID> guavaMap = CacheBuilder.newBuilder().concurrencyLevel(numThreads).build();

        var guavaRes = guavaTest(guavaMap, inputIds);
        var regularHashMapRes = mapTest(regularMap, inputIds);
        var lockHashMapRes = mapTestLock(lockMap, inputIds);
        var syncHashMapRes = mapTestSync(syncMap, inputIds);
        var concurrentHashMapRes = mapTest(concurrentMap, inputIds);

        var concurrentCourseStartTime = Duration.ofNanos(System.nanoTime());
        Lists.partition(inputIds, partSize).forEach(part -> {
            new Thread(() -> {
                var res = mapTest(concurrentMap, part);
                concurrentLatch.countDown();
            }).start();
        });
        concurrentLatch.await();
        var concurrentCourseEndTime = Duration.ofNanos(System.nanoTime());
        var concurrentCourseTotal = concurrentCourseEndTime.minus(concurrentCourseStartTime);

        var lockCourseStartTime = Duration.ofNanos(System.nanoTime());
        Lists.partition(inputIds, partSize).forEach(part -> {
            new Thread(() -> {
                var res = mapTestLock(lockMap, part);
                lockLatch.countDown();
            }).start();
        });

        lockLatch.await();
        var lockCourseEndTime = Duration.ofNanos(System.nanoTime());
        var lockCourseTotal = lockCourseEndTime.minus(lockCourseStartTime);

        var syncCourseStartTime = Duration.ofNanos(System.nanoTime());
        Lists.partition(inputIds, partSize).forEach(part -> {
            new Thread(() -> {
                var res = mapTestSync(syncMap, part);
                syncMapLatch.countDown();
            }).start();
        });
        syncMapLatch.await();
        var syncCourseEndTime = Duration.ofNanos(System.nanoTime());
        var syncCourseTotal = syncCourseEndTime.minus(syncCourseStartTime);

        var guavaCourseStartTime = Duration.ofNanos(System.nanoTime());
        Lists.partition(inputIds, partSize).forEach(part -> {
            new Thread(() -> {
                var res = guavaTest(guavaMap, part);

                guavaLatch.countDown();
            }).start();
        });
        guavaLatch.await();
        var guavaCourseEndTime = Duration.ofNanos(System.nanoTime());
        var guavaCourseTotal = guavaCourseEndTime.minus(guavaCourseStartTime);

        System.out.println("============ Single Threaded ============");
        System.out.println("Hashmap Put Time: " + regularHashMapRes.getLeft().toMillis() + "ms, Get Time: " + regularHashMapRes.getRight().toMillis() + "ms, total: " + (regularHashMapRes.getLeft().toMillis() + regularHashMapRes.getRight().toMillis()) + "ms");
        System.out.println("ConcurrentHashmap Put Time: " + concurrentHashMapRes.getLeft().toMillis() + "ms, Get Time: " + concurrentHashMapRes.getRight().toMillis() + "ms, total:" + concurrentHashMapRes.getLeft().plus(concurrentHashMapRes.getRight()).toMillis() + "ms");
        System.out.println("Guava Cache Put Time: " + guavaRes.getLeft().toMillis() + "ms, Get Time: " + guavaRes.getRight().toMillis() + "ms, total:" + guavaRes.getLeft().plus(guavaRes.getRight()).toMillis() + "ms");
        System.out.println("Locked Hashmap Put Time: " + lockHashMapRes.getLeft().toMillis() + "ms, Get Time: " + lockHashMapRes.getRight().toMillis() + "ms, total:" + lockHashMapRes.getLeft().plus(lockHashMapRes.getRight()).toMillis() + "ms");
        System.out.println("Synchronized Hashmap Put Time: " + syncHashMapRes.getLeft().toMillis() + "ms, Get Time: " + syncHashMapRes.getRight().toMillis() + "ms, total:" + syncHashMapRes.getLeft().plus(syncHashMapRes.getRight()).toMillis() + "ms");
        
        System.out.println("============ Multithreaded ============");
        System.out.println("ConcurrentHashMap Total Time: " + concurrentCourseTotal.toMillis() + "ms");
        System.out.println("Sync Total Time: " + syncCourseTotal.toMillis() + "ms");
        System.out.println("Locked Total Time: " + lockCourseTotal.toMillis() + "ms");
        System.out.println("Guava Total Time: " + guavaCourseTotal.toMillis() + "ms");

    }
}
```

And the hardware specs for the computer this was tested on: 

```
Operating System: NixOS Unstable
RAM: 64GB LPDDR5 6400 MT/s
Processor: AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics
JVM: jdk21 package in Nixpkgs
```
