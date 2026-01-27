---
{"publish":true,"created":"2025-09-12T19:01:55.955-04:00","modified":"2025-09-12T19:05:23.017-04:00","cssclasses":""}
---

I have over four hundred blu-ray discs that I rip and put on my server. 

I needed to transcode all these videos into something more compressed, but it was too slow with the single computer I was using.  My solution? Distribute it! 

This project uses Docker Swarm with RabbitMQ and Nvidia Jetson Nanos to distribute and encode across any number of Jetsons in hardware and move to folders.  The code is written in Clojure and uses Java NIO aggressively. 


# Implementations

https://gitlab.com/tombert/distributed-transcode