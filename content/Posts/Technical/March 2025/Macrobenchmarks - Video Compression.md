---
{"publish":true,"title":"Macrobenchmarks: Video Compression","created":"2025-03-13T09:21:44-04:00","modified":"2025-09-10T01:03:39.801-04:00","tags":["technical"],"cssclasses":""}
---


I have a pretty large collection of Blu-ray movies, about four hundred at my last count. I also have around forty complete series on DVD and Blu-ray. 

I like Blu-ray because the quality, even for 1080p, is generally very good.  It turns out that 25-50 gigs is actually a lot of space, so the studios don't compress a lot, and the colors and details look great. Seriously, if you get a chance, play a Blu-ray and compare it to the same movie on a streaming service.  I almost guarantee that the Blu-ray will look better, or if nothing else it will look a bit more saturated. 

I also am always paranoid that companies will take my movies away from me. This isn't really theoretical, [Max removed a ton of its animated content](https://www.cbr.com/infinity-train-team-blindsided-hbo-max-purge/) in 2022. Since these shows never got a Blu-ray release, the only way you can watch some of these shows is via piracy, which of course is wrong and I would never recommend that you download a VPN and a torrent client and go to one of the many readily available and easy to use piracy websites.  That would be unprofessional. 


Anyway, Blu-rays are a bit unwieldy, so I use the software [MakeMKV](https://www.makemkv.com/) to rip the movie off the disk, move them to my storage server, and stream them with [Jellyfin](https://jellyfin.org/). It's a pain in the ass but it's worth it. 

Nowadays, my storage server has so much room (288TB) that I don't bother compressing the movies at all, but I used to, and I would always use the H264 codec because it was still pretty compressed and it was supported nearly everywhere, but I was always curious how much of a difference you'd get with other codecs. 

# The Setup

I'll have the full specs of the server on the bottom, but for now know that we're running NixOS Unstable. I installed the `ffmpegFull` package, just because that is pretty up to date and should have all the codecs without me having to manually compile anything. 

I copied my rip of "Fight Club", and cropped it to the first 20 minutes just so I don't have to wait forever for the comparisons.  This is pretty easy with `ffmpeg`: 

```bash
ffmpeg -i fight_club.mkv -c:v copy  -c:a copy -t 1200 raw.mkv
```

I just copied the codec for video and audio and tell it to stop after the first twenty minutes. I'll use a similar setup for the different codecs. 

# H264

Probably the most common compression used even still, and not without good reason.  For a long time, it was the very best available for the size-to-quality ratio. 

We can compress it like this: 

```bash
ffmpeg -i fight_club.mkv -c:v h264 -c:a copy -crf 20 -t 1200 h264.mkv
```

This ended up taking roughly eight minutes to encode, but the final result was $2018741244$ bytes, or almost exactly two gigabytes. 

# H265

The successor to H264, and it's supposed to be considerably better.  We run it with:

```bash
ffmpeg -i fight_club.mkv -c:v libx265 -c:a copy -crf 20 -t 1200 h265.mkv
```

This took about thirteen minutes to encode, and the final result was $1389154325$ bytes, about $1.4$ gigabytes. 

# AV1

AV1 is the new hotness, since it's supposed to be competitive with H265, but can be implemented and used royalty-free.  I figured that it's worth seeing how that one stacks up as well.  

There are two popular implementations of AV1 for `ffmpeg`: `libaom-av1` and `libsvtav1`. `libaom-av1` is the reference implementation from the specification designers, but it's so slow that I couldn't really use it.  When I tried running it, it would have taken almost thirty hours to complete, and this is just a dumb test that I don't really want to wait around for long periods of time to finish. 

Fortunately, `libsvtav1` is considerably faster.  We ran it with: 

```bash
ffmpeg -i fight_club.mkv -c:v libsvtav1  -c:a copy -crf 20 -t 1200 av1.mkv
```

This finished in a shockingly fast *two minutes*, with a file size of $1193593424$, or about $1.2$ gigabytes. I don't know if this is doing some kind of fancy hardware acceleration that I'm unaware of, but it was really fast. 

That took me by surprise.  Not only was it slightly more compressed than H265, but it was also around five times faster to encode. 

# Results

I didn't measure this with any kind of objectivity, but all three of the encodings look effectively identical to me in VLC, as in they all look excellent.  The final results are as follows

| Codec       | Encoding time (seconds) | File Size (bytes) |
| ----------- | -----------             | ------            |
| H264        | $485$                   | $2018741244$      |
| H265        | $771$                   | $1389154325$      |
| AV1         | $130$                   | $1193593424$      |


# Conclusion

While I probably won't start compressing my Blu-ray archive any time soon, I am still glad I performed this test, if only to inform my decisions in this domain in the future. It does seem that there's a considerable savings by moving to the more modern codecs. If and when I need to encode video in the future, and I probably will, I'll likely use AV1 as a result of these tests. 

As usual, if you see any mistakes in my testing please don't hesitate to let me know.

Computer used: 

```
Operating System: NixOS Unstable
CPU: AMD Ryzen 9 6900HX with Radeon Graphics
RAM: 64 GB DDR5 4800 MT/s
JVM: jdk21 package in Nixpkgs
```
