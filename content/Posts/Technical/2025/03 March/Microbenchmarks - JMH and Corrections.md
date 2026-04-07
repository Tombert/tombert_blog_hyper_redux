---
{"publish":true,"title":"Microbenchmarks: JMH and Corrections","description":"Correcting earlier Java microbenchmarks using JMH; results across HashMap/ConcurrentHashMap/Guava/Caffeine and locks vs synchronized, plus caveats.","created":"2025-03-06T09:21:44-04:00","modified":"2026-04-07T19:37:35.802-04:00","tags":["technical","benchmark"],"cssclasses":""}
---


I will admit that I'm still learning the best way to benchmark Java.  I posted my last post to [Hacker News](https://news.ycombinator.com/item?id=43274675) last night, and I was given some very good constructive feedback. 

Of the two people that posted, both mentioned some mistakes in my benchmarking methodology. They linked a [post](https://web.archive.org/web/20110513090823/http://www.ibm.com/developerworks/java/library/j-jtp02225/index.html) by Brian Goetz (who wrote *the* book on [Java concurrency](https://a.co/d/9SdcCsD)), which mentioned a few things that I didn't take into account.  

First, the JVM is a bit weird in its "warm up".  Java will interpret for the first few iterations of a program to figure out an optimal path, and use that information to compile native code. It's not a bad system, especially on something like a web server where the same functions might be called thousands of times, but does mean that the naive nanosecond benchmarking I was doing might be misleading. 

I also made the mistake of reusing objects between runs.  I thought this would be ok because I called the `clear()` method between tests, but apparently there can be effects that linger even after the `clear()` method is run. 

Another thing I didn't take into account is that there is the potential for dead code elimination.  This means that if the JVM determines if an object is never really used, it might not even run it to save the cycles.  Again, not a dumb idea, it makes sense, we want the fastest code possible most of the time, but it means that testing can give us unclear and inconsistent results. 

I'm very glad I got this feedback; I certainly don't want to spread misinformation on the internet (there's enough of that already), and being corrected on these things is the only way I'm going to get better.  I'm going to keep my previous posts about this up, but I will be making an edit to the top of them linking to this post so that people can see the mistakes in my testing methodology. 

# So how *do* we benchmark Java? 

It appears that the standard Java benchmarking tool is the " Java Microbenchmark Harness", which everyone calls [JMH](https://github.com/openjdk/jmh).  

JMH automates most of the "best practices" in regards to microbenchmarking Java. It avoids a lot of common pitfalls, such as warmup and multiple threads. 

It avoids the warmup issues by simply running five iterations (or more if you configure it) of your benchmark and throwing those results away, and then running five iterations of your code and recording the results.  This should reduce or eliminate warmup issues, and make our results a lot more consistent. 

It's also good at resetting the state between iterations of the test. This helps avoid and kind of special optimizations that the JVM might be doing between runs.  Again, the goal is *consistent* testing so we can more accurately get an idea of the cost of our code. 

It also gives you a lot of niceties, like being able to specify `@Param` on variables. For example: 

```java
@Param({"100", "1000", "10000"}) 
public int numInsertions;

@Param({"100", "1000", "10000"}) 
public int anotherParameter;
```

JMH is smart enough to run through all the permutations of these, on a per-test level. This can of course lead to a combinatorial explosion, but it also is an easy way to do a full factorial test of all relevant variables. 

I'm not going to go into detail on the entirety of JMH, there are plenty of resources that explain how to use it better than I could.  That said, I did want to correct my mistakes from yesterday so I hacked something together that should hopefully be a bit more accurate.  Here's the full spec: 

```java
package org.jmh;

import com.github.benmanes.caffeine.cache.Caffeine;
import com.google.common.cache.Cache;
import com.google.common.cache.CacheBuilder;
import org.openjdk.jmh.annotations.*;

import java.util.HashMap;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

@BenchmarkMode(Mode.AverageTime)
@OutputTimeUnit(TimeUnit.MICROSECONDS)
public class JMHWrapper2
{
    @State(Scope.Benchmark)
    public static class SharedData {
        List<UUID> keys;

        @Param({"100", "1000", "10000"})
        public int numInsertions;

        @Setup(Level.Trial)
        public void setup() {
            keys = IntStream.range(0, numInsertions)
                    .mapToObj(i -> UUID.randomUUID())
                    .collect(Collectors.toList());
        }
    }

    @State(Scope.Thread)
    public static class MapState {
        ConcurrentHashMap<UUID, UUID> concurrentMap;
        HashMap<UUID, UUID> regularHashMap;
        HashMap<UUID, UUID> lockMap;
        HashMap<UUID, UUID> syncMap;
        Cache<UUID, UUID> guavaMap;
        com.github.benmanes.caffeine.cache.Cache<UUID,UUID> caffeineMap;
        ReentrantLock lock;


        @Setup(Level.Iteration) 
        public void setup(SharedData sharedData) {
            concurrentMap = new ConcurrentHashMap<>(sharedData.numInsertions);
            regularHashMap = new HashMap<>(sharedData.numInsertions);
            lockMap = new HashMap<>(sharedData.numInsertions);
            syncMap = new HashMap<>();
            guavaMap = CacheBuilder.newBuilder().build();
            caffeineMap = Caffeine.newBuilder().build( );
            lock = new ReentrantLock();
        }
    }

    public void updateMapLock(MapState state, SharedData data) {
        state.lock.lock();
        try {
            for (var key : data.keys) {
                state.lockMap.put(key, key);
            }
        } finally {
            state.lock.unlock();
        }
    }

    public synchronized void updateMapSync(MapState state, SharedData data) {
        for (var key : data.keys) {
            state.syncMap.put(key, key);
        }
    }

    @Benchmark
    public void lockHashMapSingleThread(MapState state, SharedData data) {
        updateMapLock(state, data);
    }



    @Benchmark
    @Threads(20)
    public void lockHashMapMultiThread(MapState state, SharedData data) {
        updateMapLock(state, data);
    }


    @Benchmark
    public void syncHashMapSingleThread(MapState state, SharedData data) {
        updateMapSync(state, data);
    }

    @Benchmark
    @Threads(20)
    public void syncHashMapMultiThread(MapState state, SharedData data) {
        updateMapSync(state, data);
    }



    @Benchmark
    public void regularHashMapSingleThread(MapState state, SharedData data) {
        for (UUID key: data.keys) {
            state.regularHashMap.put(key, key);
        }
    }

    @Benchmark
    public void concurrentHashMapSingleThread(MapState state, SharedData data) {
        for (UUID key : data.keys) {
            state.concurrentMap.put(key, key);
        }
    }

    @Benchmark
    @Threads(20)
    public void concurrentHashMapMultiThread(MapState state, SharedData data) {
        for (UUID key : data.keys) {
            state.concurrentMap.put(key, key);
        }
    }

    @Benchmark
    public void guavaMapSingleThread(MapState state, SharedData data) {
        for (UUID key : data.keys) {
            state.guavaMap.put(key, key);
        }
    }

    @Benchmark
    @Threads(20)
    public void guavaMapMultiThread(MapState state, SharedData data) {
        for (UUID key : data.keys) {
            state.guavaMap.put(key, key);
        }
    }

    @Benchmark
    public void caffeineSingleThread(MapState state, SharedData data) {
        for (UUID key : data.keys) {
            state.caffeineMap.put(key, key);
        }
    }

    @Benchmark
    @Threads(20)
    public void caffeineMultiThread(MapState state, SharedData data) {
        for (UUID key : data.keys) {
            state.caffeineMap.put(key, key);
        }
    }
}
```

It was also recommended that I try out [Caffeine Caches](https://github.com/ben-manes/caffeine) (which are more or less a newer reimplementation of Guava Caches) and it was pretty trivial to tack this onto the tests, so I figured I'd throw that in there just as a new data point to play with. 

JMH tests can take a long time to run, and I didn't want it to occupy my laptop for the entire time, so I SCP'd the project over to my server and let it live in a `tmux` session in the background. As usual, the specs used for testing will be at the bottom of this post. 

```bash
./gradlew jmh
```

Four and a half hours later, we got these results: 

```
Benchmark                                  (numInsertions)  Mode  Cnt     Score    Error  Units
JMHWrapper2.caffeineMultiThread                        100  avgt   25     4.259 ±  0.090  us/op
JMHWrapper2.caffeineMultiThread                       1000  avgt   25    45.265 ±  0.928  us/op
JMHWrapper2.caffeineMultiThread                      10000  avgt   25   607.349 ± 19.524  us/op
JMHWrapper2.caffeineSingleThread                       100  avgt   25     1.331 ±  0.018  us/op
JMHWrapper2.caffeineSingleThread                      1000  avgt   25    15.110 ±  0.335  us/op
JMHWrapper2.caffeineSingleThread                     10000  avgt   25   178.049 ±  1.740  us/op
JMHWrapper2.concurrentHashMapMultiThread               100  avgt   25     4.097 ±  0.109  us/op
JMHWrapper2.concurrentHashMapMultiThread              1000  avgt   25    43.658 ±  0.884  us/op
JMHWrapper2.concurrentHashMapMultiThread             10000  avgt   25   572.413 ± 13.332  us/op
JMHWrapper2.concurrentHashMapSingleThread              100  avgt   25     1.227 ±  0.031  us/op
JMHWrapper2.concurrentHashMapSingleThread             1000  avgt   25    14.089 ±  0.120  us/op
JMHWrapper2.concurrentHashMapSingleThread            10000  avgt   25   161.523 ±  6.629  us/op
JMHWrapper2.guavaMapMultiThread                        100  avgt   25     7.330 ±  0.074  us/op
JMHWrapper2.guavaMapMultiThread                       1000  avgt   25    84.835 ±  0.719  us/op
JMHWrapper2.guavaMapMultiThread                      10000  avgt   25  1324.662 ± 24.936  us/op
JMHWrapper2.guavaMapSingleThread                       100  avgt   25     2.423 ±  0.025  us/op
JMHWrapper2.guavaMapSingleThread                      1000  avgt   25    26.817 ±  0.272  us/op
JMHWrapper2.guavaMapSingleThread                     10000  avgt   25   394.505 ±  7.817  us/op
JMHWrapper2.lockHashMapMultiThread                     100  avgt   25     2.898 ±  0.040  us/op
JMHWrapper2.lockHashMapMultiThread                    1000  avgt   25    30.695 ±  0.457  us/op
JMHWrapper2.lockHashMapMultiThread                   10000  avgt   25   455.686 ±  9.996  us/op
JMHWrapper2.lockHashMapSingleThread                    100  avgt   25     0.742 ±  0.014  us/op
JMHWrapper2.lockHashMapSingleThread                   1000  avgt   25     8.676 ±  0.471  us/op
JMHWrapper2.lockHashMapSingleThread                  10000  avgt   25   119.546 ±  3.720  us/op
JMHWrapper2.regularHashMapSingleThread                 100  avgt   25     0.822 ±  0.115  us/op
JMHWrapper2.regularHashMapSingleThread                1000  avgt   25     8.715 ±  0.597  us/op
JMHWrapper2.regularHashMapSingleThread               10000  avgt   25   116.956 ±  2.528  us/op
JMHWrapper2.syncHashMapMultiThread                     100  avgt   25     2.266 ±  0.390  us/op
JMHWrapper2.syncHashMapMultiThread                    1000  avgt   25    27.093 ±  0.682  us/op
JMHWrapper2.syncHashMapMultiThread                   10000  avgt   25   423.149 ±  6.888  us/op
JMHWrapper2.syncHashMapSingleThread                    100  avgt   25     0.685 ±  0.023  us/op
JMHWrapper2.syncHashMapSingleThread                   1000  avgt   25     7.888 ±  0.249  us/op
JMHWrapper2.syncHashMapSingleThread                  10000  avgt   25   131.329 ± 23.662  us/op
```

So the results aren't much different than what my timer-based benchmarks gave me before, but I have more faith in the results of the JMH test compared to my ad-hoc stuff.  If nothing else, they work hard to keep things more consistent, so we have better controls. 

Keep in mind the units: Microseconds per operation, *not* operations per microsecond, so lower numbers are better. 

Some takeaways: 

- I was quite impressed with Caffeine, in both single-threaded and multi-threaded it's about twice the speed of the equivalent Guava Cache, and since the API is roughly identical, I see no reason not to use it in place of Guava Caches. It appears to be strictly better, you should use it. 
- It doesn't appear that there was a significant performance difference the `synchronized` and `ReentrantLock` in these tests, which makes enough sense but is contrary to my first ad-hoc tests I wrote comparing to `AtomicLong`.  Again, I trust the JMH results considerably more than my original ones. 

- Keep in mind, we're effectively measuring the "bulk inserts", so we're measuring how long it takes to run the entire loop, not individual inserts. If you want the amortized per-item insert cost, just divide the microseconds-per-operation by the `numInsertions` variable.  
	- Interestestingly, it seems to *not* be linear in cost jumping from $1000$ items versus $10,000$, particularly with the regular hashmaps.  I'm not completely sure why that's the case, I've always thought that HashMaps were supposed to be $O(1)$ for `put`, but I think it must be getting a lot of hash collisions when you add $10,000$ items. 

You might have noticed, I did *not* test the `get` for any of these. I didn't "forget" to do this, but these tests already took more than four hours to run, and adding a separate `get` test for each map would have doubled the amount of time.  I still think my results are representative: `put` was consistently more expensive in my last test. I might write another test with `get` later, but not today. 


# Conclusion. 

While these results are interesting, I've learned to take these microbenchmarks with an extremely large grain of salt. A lot of the time, the choice of your hash map really doesn't matter, and moreover it's entirely possible I missed something in my testing. There are just a lot of variables to worry about with something as complex as the JVM, and it's very easy to miss something, or test the wrong thing, or fall into optimization pitfalls. 

Still, I find these results interesting. As I said in my first post, my goal is to simply check my assumptions on this stuff.  There's a lot of folk wisdom in software engineering, but there's no reason not to test it. 

As always, if anyone sees a mistake, please reach out, I want to learn more about this stuff and I want to get better with it.


Computer I used for this:

```
Operating System: NixOS Unstable
CPU: AMD Ryzen 9 6900HX with Radeon Graphics
RAM: 64 GB DDR5 4800 MT/s
JVM: jdk21 package in Nixpkgs
```

