---
{"publish":true,"created":"2025-09-10T01:03:39.858-04:00","modified":"2025-09-10T01:03:39.862-04:00","cssclasses":""}
---


Referenced in: [[Posts/Technical/March 2025/Overengineering the Swaybar]]

- I wanted to have a customizable information bar for my Sway config. 
- It needed to be modular and allow for asynchronous events so that events wouldn't block each other. 
- It ended up with me creating my own scheduling framework in Clojure, and then Rust. 

# Implementations

- [Original Clojure Version](https://github.com/tombert/swanbar)

- [Better Rust Version](https://github.com/Tombert/rs-swanbar)

