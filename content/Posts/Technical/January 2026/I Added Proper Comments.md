---
{"publish":true,"title":"I Added Proper Comments","description":"How I added anonymous, nested comments to this Quartz/Obsidian blog using Cloudflare Workers (Rust+WASM) and Turnstile, with source code.","created":"2026-01-27T00:21:44-04:00","modified":"2026-01-29T01:16:55.882-05:00","tags":["technical"],"cssclasses":""}
---


You might remember a few months ago I [[Transitioning to Obsidian For This Blog \| transitioned this blog to Quartz to be used with Obsidian]]. I have been pretty happy with this decision, I think it's a very usable interface and I find the Obsidian editor pretty easy to use. Just kidding, I know you don't remember, no one reads this blog. 

One complaint I have with Quartz, however, is that its only [officially-supported commenting system](https://quartz.jzhao.xyz/features/comments) is [Giscus](https://giscus.app/).  Giscus works by proxying things through Github Discussions.  

There's an issue with this: [no one wants to link their Github account to my blog](https://news.ycombinator.com/item?id=46751138), and there isn't a way to get Giscus with Quartz to allow anonymous comments. 

So with a generous amount of help from [Codex](https://openai.com/codex/), I hacked together a comment system with [Cloudflare Workers](https://workers.cloudflare.com/) with Rust and WASM, and using [Cloudflare Turnstile](https://www.cloudflare.com/application-services/products/turnstile/) to minimize botting. 

It's not terribly technically complicated, so I don't feel compelled to do any kind of detailed writeup on it, particularly since a lot of was vibe-coded anyway, but it supports Hacker News/Reddit-style nested comments, and I have a few ideas of ways to improve it, but as it stands it works well enough. Importantly, it does *not* require any account, and while you are welcome to provide an email it is not required. 


Source code is readily available [on Sourcehut](https://git.sr.ht/~tombert/Kommentator).  I provide no guarantees for anything but feel free to extend or make pull requests. 
