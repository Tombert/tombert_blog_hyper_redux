---
{"publish":true,"title":"Microbenchmarks: BlockingQueues","description":"A quick, flawed comparison of ArrayBlockingQueue vs LinkedBlockingQueue under virtual vs platform threads, with a pointer to the corrected JMH post.","created":"2025-03-04T09:21:44-04:00","modified":"2026-01-29T01:17:23.020-05:00","tags":["technical"],"cssclasses":""}
---


> These benchmarks are flawed because the JVM is a bit weird.  Skip this post and read [[Posts/Technical/March 2025/Microbenchmarks - JMH and Corrections\|this]] one instead. 



This will be a relatively short post, but after my [[Posts/Technical/March 2025/Microbenchmarks - Java Locks vs. Atomics\|benchmarking post]] with locks, I became a bit curious about the performance of [BlockingQueues](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/BlockingQueue.html).

# `BlockingQueue`

`BlockingQueues` offer a thread-safe way of communicating between threads, using a queue abstraction. The can be bounded to apply backpressure and make sure data doesn't fill up your memory immediately, and are safe to use across any number of threads. 

The "blocking" part of it comes from the fact that you are able (but not required) to block on both the `put` and the `take`.  The `put` will block when there's too many items in the queue, and the `take` will block until it can get an item from a queue. 

In a sort of hand-wavey way, BlockingQueues are sort of analogous to [CSP channels](https://en.wikipedia.org/wiki/Communicating_sequential_processes). This isn't strictly true because they can be buffered, and because there's no way to wait on multiple channels at the same time, but they still can work well for synchronization in applications that can be structured in a message-passing style. 

There are two main types of blocking queues: [LinkedBlockingQueue](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/LinkedBlockingQueue.html) and [ArrayBlockingQueue](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/ArrayBlockingQueue.html). 

# The Test

Conventional wisdom says that `ArrayBlockingQueue` should be faster, simply because arrays tend to be faster than linked lists, but I've learned not to trust conventional wisdom for this kind of thing.

```java
import java.time.Duration;
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.stream.LongStream;

public class Main {
    public static Integer QUEUE_SIZE = 100000;
    public static Long NUM_PRODUCER_THREADS = 10L;
    public static Long NUM_CONSUMER_THREADS = 50L;
    public static Integer NUM_MESSAGES = 100_000_000;
    public static BlockingQueue<Long> linkedQueue = new LinkedBlockingQueue<>(QUEUE_SIZE);
    public static BlockingQueue<Long> arrayQueue = new ArrayBlockingQueue<>(QUEUE_SIZE);
    public static CountDownLatch linkedLatch = new CountDownLatch(NUM_MESSAGES);
    public static CountDownLatch arrayLatch = new CountDownLatch(NUM_MESSAGES);

    public static void doThreadStuff(BlockingQueue<Long> queue, CountDownLatch latch) {
        LongStream.range(0, NUM_PRODUCER_THREADS).forEach(i ->{
           Thread.startVirtualThread( () -> {
                for (var j = 0; j < NUM_MESSAGES; j++){
                    try {
                        queue.put(i);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
            });
        });

        LongStream.range(0, NUM_CONSUMER_THREADS).forEach(i -> {
            Thread.startVirtualThread( () -> {
                while (true) {
                    try {
                        var _thing = queue.take();
                        latch.countDown();
                        if (latch.getCount() <= 0){
                            break;
                        }
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
            });
        });

    }

    public static void main(String[] args) throws InterruptedException {
        System.out.println("Starting");

        var arrayStartTime = Duration.ofNanos(System.nanoTime());
        doThreadStuff(arrayQueue, arrayLatch);
        arrayLatch.await();
        var arrayEndTime = Duration.ofNanos(System.nanoTime());
        var arrayTotalTime = arrayEndTime.minus(arrayStartTime);

        var linkedStartTime = Duration.ofNanos(System.nanoTime());
        doThreadStuff(linkedQueue, linkedLatch);
        linkedLatch.await();
        var linkedEndTime = Duration.ofNanos(System.nanoTime());
        var linkedTotalTime = linkedEndTime.minus(linkedStartTime);

        System.out.println("Total Time For Linked: " + linkedTotalTime.toMillis() + "ms.");
        System.out.println("Total Time For Array: " + arrayTotalTime.toMillis() + "ms.");

    }
}

```


We spin up ten threads to put stuff into the queue, and fifty threads to consume.  The consumer thread is a relatively simple `while(true)` loop to wait for items to come. 

We again use `CountDownLatch` as a means of blocking the main thread until our producer and consumer threads are done.  

Running this gives me these results (computer specs at the end of the post): 

```
Total Time For Linked: 18054ms.
Total Time For Array: 7240ms.
```
 
# Regular Threads

Nothing too surprising, the `ArrayBlockingQueue` is roughly twice the speed. 

But these are virtual threads, let's modify our function to use platform threads: 

```java
public static void doThreadStuff(BlockingQueue<Long> queue, CountDownLatch latch) {
        LongStream.range(0, NUM_PRODUCER_THREADS).forEach(i ->{
           var t = new Thread(() -> {
                for (var j = 0; j < NUM_MESSAGES; j++){
                    try {
                        queue.put(i);
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
            });
           t.start();
        });

        LongStream.range(0, NUM_CONSUMER_THREADS).forEach(i -> {
            var t = new Thread(() -> {
                while (true) {
                    try {
                        var _thing = queue.take();
                        latch.countDown();
                        if (latch.getCount() <= 0){
                            break;
                        }
                    } catch (InterruptedException e) {
                        throw new RuntimeException(e);
                    }
                }
            });
           t.start();
        });
    }
```


When running this, the results become considerably more interesting: 

```
Total Time For Linked: 5923ms.
Total Time For Array: 6842ms.
```

`ArrayBlockingQueue` is slower now! It's roughly the same speed, and if we run this again: 

```
Total Time For Linked: 6501ms.
Total Time For Array: 6453ms.
```

For reasons that I don't fully understand yet, when using vanilla platform threads, `ArrayBlockingQueue`s operate at roughly the same speed as `LinkedBlockingQueue`s.  

Doing some digging, I *think* it's because `BlockingQueue`s are using `ReentrantLock`s, which seem to be specially designed for virtual threads, but that's honestly just a guess. 

# Conclusion 

Anyway, shorter post this time, it was just to post a result that I thought was interesting. I want to get into the habit of doing this more often. 


System used for testing: 


```
Operating System: NixOS Unstable, updated this morning.
RAM: 64GB LPDDR5 6400 MT/s
Processor: AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics
JVM: jdk21 package in Nixpkgs
```
