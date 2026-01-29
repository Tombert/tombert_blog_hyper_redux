---
{"publish":true,"title":"Microbenchmarks: Java Locks vs Atomic","description":"Naive timing of synchronized, ReentrantLock, and AtomicLong (virtual and platform threads); AtomicLong was fastest; later superseded by JMH corrections.","created":"2025-03-04T03:21:44-04:00","modified":"2026-01-29T01:17:25.989-05:00","tags":["technical"],"cssclasses":""}
---



> These benchmarks are flawed because the JVM is a bit weird.  Skip this post and read [[Posts/Technical/March 2025/Microbenchmarks - JMH and Corrections\|this]] one instead. 


I have to confess that I absolutely hate mutexes. I find them hard to reason about, hard to optimize, and easy to create bugs that are hard to debug later. But whether or not I like it, they can be a necessary evil when you're stuck writing Java.

A large chunk of concurrency theory boils down to "What do we do if two threads need to modify data at the same time?" There's obviously *more* than that, but if you pick up any book on concurrency theory, it's likely that at least a third of it boils down to different types of [mutual exclusion](https://en.wikipedia.org/wiki/Mutual_exclusion). 

There's a lot of folk wisdom for these things, but not a lot of actual numbers to play with.  Since I have trust issues, I figured I'd write the tests myself. 


# `synchronized`

Java has a lot of concurrency tools, and they're generally pretty good.  I think the most common way of doing mutual exclusion in Java is the `synchronized` keyword, so let's create our test case. 

```java
public static int NUM_ITERATIONS = 10000;
public static int NUM_THREADS = 10000;
public static Long synchronizedCounter = 0L;
public static CountDownLatch synchronizedCountdown = new CountDownLatch(NUM_THREADS);
    
public synchronized static void incrementWithSynchronized()  {
    synchronizedCounter = synchronizedCounter + 1;
}
    
public static void main(String[] args) throws InterruptedException {
	LongStream.range(0, NUM_THREADS).forEach(i -> {
	   Thread.startVirtualThread(() -> {
		for (var j = 0; j < NUM_ITERATIONS; j++) {
		    incrementWithSynchronized();
		}
		synchronizedCountdown.countDown();
	    });
	});
	
	synchronizedCountdown.await();
	var synchronizedEndTime = Duration.ofNanos(System.nanoTime());
	var synchronizedTotalTime = synchronizedEndTime.minus(synchronizedStartTime);
	
	System.out.println("Total time for synchronized: " + synchronizedTotalTime.toMillis() + "ms, counter: " + synchronizedCounter);
	
	
}
```

We create ten thousand virtual threads. The number of platform threads is likely to be variable to your computer and operating system, so if you want better control you are free to change this to "real" threads, though the numbers didn't really change when I did that. 

Since threads are by definition started in the background, we need some way to block until all of them have finished running, and we use a [CountDownLatch](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/CountDownLatch.html).  I am not sure of what locking mechanism is used in `CountDownLatch` but I'll use it in all of our implementations as a control. 

Running this on my laptop, I get: 

```
Total time for synchronized: 3727ms, counter: 100000000
```

Now that we have our control, we can play with some some of the other concurrency tools.

# `ReentrantLock`

Java 8 introduce a metric ton of tools for concurrency management, [ReentrantLock](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/locks/ReentrantLock.html) being one of them. 

To those who don't know, Reentrant Locks are locks that can be requested multiple times by the same thread without additional blocking.  If thread A requests a lock, and it already happens, then it's a no-op.  However, if thread B requests a lock, it will wait until A surrenders it.  

I've never really understood *why* Java added these locks, because `synchronized` was already reentrant, but if it's there we might as well test it. 

```java
public static ReentrantLock r = new ReentrantLock();
public static CountDownLatch lockCountdown = new CountDownLatch(NUM_THREADS);
public static Long lockCounter = 0L;

public static void incrementReentrant() {
	r.lock();
	try {
	    lockCounter = lockCounter + 1;
	} finally {
	    r.unlock();
	}
}

public static void main(String[] args) throws InterruptedException {
	var lockStartTime = Duration.ofNanos(System.nanoTime());
	LongStream.range(0, NUM_THREADS).forEach(i -> {
	    Thread.startVirtualThread(() -> {
		for (var j = 0; j < NUM_ITERATIONS; j++) {
		    incrementReentrant();
		}
		lockCountdown.countDown();
	    });
	});

	lockCountdown.await();
	var lockEndTime = Duration.ofNanos(System.nanoTime());
	var lockTotalTime = lockEndTime.minus(lockStartTime);
	System.out.println("Total time for lock: " + lockTotalTime.toMillis() + "ms, counter: " + lockCounter);
}
```

On my laptop, we get this as the result: 

```
Total time for lock: 2142ms, counter: 100000000
```

Interesting! Compared to the three seconds we got from `synchronized`, we only have two when using `ReentrantLock`, so roughly 30% faster.  

This took me completely by surprise when I wrote it.  I figured that it would be roughly the same speed as `synchronized`, or slightly slower since `synchronized` is a first class feature. I absolutely did *not* think that `ReentrantLock` would actually be *faster*. Crazy stuff.  

(Before someone says anything, I tried both the fair and unfair varients of `ReentrantLock`, and it didn't make a significant difference). 

# AtomicLong

[AtomicLong](https://docs.oracle.com/javase/8/docs/api/java/util/concurrent/atomic/AtomicLong.html) is actually the reason I wanted to run this test. 

I've always *heard* that this is the fastest way of doing a counter in Java, since it supposedly uses hardware-assisted [Compare-and-Swap](https://en.wikipedia.org/wiki/Compare-and-swap) instead of locks.  I've always been skeptical that it would make a significant difference in performance, but I've always used it anyway simply because it's built-in to Java and it's easier to use than using locks. 

The code is roughly the same: 

```java

public static AtomicLong atomicCounter = new AtomicLong(0L);
public static CountDownLatch atomicCountdown = new CountDownLatch(NUM_THREADS);

public static void main(String[] args) throws InterruptedException {
	var atomicStartTime = Duration.ofNanos(System.nanoTime());
	LongStream.range(0, NUM_THREADS).forEach(i -> {
	    Thread.startVirtualThread(() -> {
		for (var j = 0; j < NUM_ITERATIONS; j++) {
		    atomicCounter.incrementAndGet();
		}
		atomicCountdown.countDown();
	    });
	});

	atomicCountdown.await();
	var atomicEndTime = Duration.ofNanos(System.nanoTime());
	var atomicTotalTime = atomicEndTime.minus(atomicStartTime);
	System.out.println("Total time for atomic: " + atomicTotalTime.toMillis() + "ms, counter: " + atomicCounter.get());

}

```
Before I give you the results, isn't this nicer? I don't have to handle any synchronization manually, it's handled automatically with `incrementAndGet()`. 

On my laptop, these are the results: 

```
Total time for atomic: 998ms, counter: 100000000
```

I can't say I'm surprised; this is what everyone has told me.  I guess common knowledge is confirmed. 


# Conclusion

What can we glean from this? 

I think there's value in testing our preconceptions.  Sometimes we get interesting results, like in the case with `ReentrantLock`, and sometimes we simply confirm something we already knew. 

Obviously, these microbenchmarks can be misleading.  Programs tend to be more complex than simply incrementing numbers; there's likely lower-hanging fruit bottlenecks than your choice of lock. It's tough to say how applicable these tests actually are to anything "useful", but I think it's still good to have these numbers just to inform our coding decisions later.  


Here's the final code.  Feel free to audit and tell me if I made any mistakes. 

```java
package mutexvsatomic;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.LongStream;

public class Main {
    public static int NUM_ITERATIONS = 10000;
    public static int NUM_THREADS = 10000;
    public static Long synchronizedCounter = 0L;
    public static Long lockCounter = 0L;
    public static AtomicLong atomicCounter = new AtomicLong(0L);
    public static CountDownLatch synchronizedCountdown = new CountDownLatch(NUM_THREADS);
    public static CountDownLatch lockCountdown = new CountDownLatch(NUM_THREADS);
    public static CountDownLatch atomicCountdown = new CountDownLatch(NUM_THREADS);

    public synchronized static void incrementWithSynchronized()  {
        synchronizedCounter = synchronizedCounter + 1;
    }

    public static void incrementReentrant() {
        var r = new ReentrantLock();
        r.lock();
        try {
            lockCounter = lockCounter + 1;
        } finally {
            r.unlock();
        }

    }

    public static void main(String[] args) throws InterruptedException {

        var synchronizedStartTime = Duration.ofNanos(System.nanoTime());
        LongStream.range(0, NUM_THREADS).forEach(i -> {
           Thread.startVirtualThread(() -> {
                for (var j = 0; j < NUM_ITERATIONS; j++) {
                    incrementWithSynchronized();
                }
                synchronizedCountdown.countDown();
            });
        });



        synchronizedCountdown.await();
        var synchronizedEndTime = Duration.ofNanos(System.nanoTime());
        var synchronizedTotalTime = synchronizedEndTime.minus(synchronizedStartTime);

        var lockStartTime = Duration.ofNanos(System.nanoTime());
        LongStream.range(0, NUM_THREADS).forEach(i -> {
            Thread.startVirtualThread(() -> {
                for (var j = 0; j < NUM_ITERATIONS; j++) {
                    incrementReentrant();
                }
                lockCountdown.countDown();
            });
        });

        lockCountdown.await();
        var lockEndTime = Duration.ofNanos(System.nanoTime());
        var lockTotalTime = lockEndTime.minus(lockStartTime);
        
        var atomicStartTime = Duration.ofNanos(System.nanoTime());
        LongStream.range(0, NUM_THREADS).forEach(i -> {
            Thread.startVirtualThread(() -> {
                for (var j = 0; j < NUM_ITERATIONS; j++) {
                    atomicCounter.incrementAndGet();
                }
                atomicCountdown.countDown();
            });
        });

        atomicCountdown.await();
        var atomicEndTime = Duration.ofNanos(System.nanoTime());
        var atomicTotalTime = atomicEndTime.minus(atomicStartTime);

        System.out.println("Total time for synchronized: " + synchronizedTotalTime.toMillis() + "ms, counter: " + synchronizedCounter);
        System.out.println("Total time for atomic: " + atomicTotalTime.toMillis() + "ms, counter: " + atomicCounter.get());
        System.out.println("Total time for lock: " + lockTotalTime.toMillis() + "ms, counter: " + lockCounter);
    }
}
```

# Update

Someone on [Hacker News](https://news.ycombinator.com/user?id=charleslmunger) mentioned that the ReentrantLock results could be because ReentrantLock is based on a framework that's specifically aware of virtual threads. 

Just to see how it is affected, I rewrote the tests to use vanilla platform threads. 

```java
package mutexvsatomic;

import java.time.Duration;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.atomic.AtomicLong;
import java.util.concurrent.locks.ReentrantLock;
import java.util.stream.LongStream;

public class Main {
    public static int NUM_ITERATIONS = 10000;
    public static int NUM_THREADS = 200;
    public static Long synchronizedCounter = 0L;
    public static Long lockCounter = 0L;
    public static AtomicLong atomicCounter = new AtomicLong(0L);
    public static CountDownLatch synchronizedCountdown = new CountDownLatch(NUM_THREADS);
    public static CountDownLatch lockCountdown = new CountDownLatch(NUM_THREADS);
    public static CountDownLatch atomicCountdown = new CountDownLatch(NUM_THREADS);
    public static ReentrantLock r = new ReentrantLock();
    public synchronized static void incrementWithSynchronized()  {
        synchronizedCounter = synchronizedCounter + 1;
    }

    public static void incrementReentrant() {

        r.lock();
        try {
            lockCounter = lockCounter + 1;
        } finally {
            r.unlock();
        }

    }

    public static void main(String[] args) throws InterruptedException {

        var synchronizedStartTime = Duration.ofNanos(System.nanoTime());
        LongStream.range(0, NUM_THREADS).forEach(i -> {
           var t = new Thread(() -> {
                for (var j = 0; j < NUM_ITERATIONS; j++) {
                    incrementWithSynchronized();
                }
                synchronizedCountdown.countDown();
            });
           t.start();
        });



        synchronizedCountdown.await();
        var synchronizedEndTime = Duration.ofNanos(System.nanoTime());
        var synchronizedTotalTime = synchronizedEndTime.minus(synchronizedStartTime);

        var lockStartTime = Duration.ofNanos(System.nanoTime());
        LongStream.range(0, NUM_THREADS).forEach(i -> {
            var t = new Thread(() -> {
                for (var j = 0; j < NUM_ITERATIONS; j++) {
                    incrementReentrant();
                }
                lockCountdown.countDown();
            });
            t.start();
        });

        lockCountdown.await();
        var lockEndTime = Duration.ofNanos(System.nanoTime());
        var lockTotalTime = lockEndTime.minus(lockStartTime);

        var atomicStartTime = Duration.ofNanos(System.nanoTime());
        LongStream.range(0, NUM_THREADS).forEach(i -> {
            var t = new Thread(() -> {
                for (var j = 0; j < NUM_ITERATIONS; j++) {
                    atomicCounter.incrementAndGet();
                }
                atomicCountdown.countDown();
            });
            t.start();
        });

        atomicCountdown.await();
        var atomicEndTime = Duration.ofNanos(System.nanoTime());
        var atomicTotalTime = atomicEndTime.minus(atomicStartTime);

        System.out.println("Total time for synchronized: " + synchronizedTotalTime.toMillis() + "ms, counter: " + synchronizedCounter);
        System.out.println("Total time for atomic: " + atomicTotalTime.toMillis() + "ms, counter: " + atomicCounter.get());
        System.out.println("Total time for lock: " + lockTotalTime.toMillis() + "ms, counter: " + lockCounter);
    }
}
```


These are the updated results I got on my laptop: 

```
Total time for synchronized: 202ms, counter: 2000000
Total time for atomic: 27ms, counter: 2000000
Total time for lock: 58ms, counter: 2000000
```

So even without virtual threads, the `ReentrantLock` is faster, and now I'm even more confused!

I also realized that I didn't mention what kind of computer I'm using (I'm still getting used to blogging), or my JVM, so here are the specs:

```
Operating System: NixOS Unstable, updated this morning.
RAM: 64GB LPDDR5 6400 MT/s
Processor: AMD Ryzen 7 PRO 7840U w/ Radeon 780M Graphics
JVM: jdk21 package in Nixpkgs
```

Your mileage may vary if any of those variables are different.  
