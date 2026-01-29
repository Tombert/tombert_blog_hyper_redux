---
{"publish":true,"title":"Vibe Coding, the Future, and Virtual Interns","description":"Reflecting on building a comments system with AI assistance, the speed and tradeoffs, and how coding may shift toward managing virtual interns.","created":"2026-01-28T09:22:44-04:00","modified":"2026-01-29T01:10:40.178-05:00","tags":["personal"],"cssclasses":""}
---




So yesterday  [[Posts/Technical/2026/01 January/I Added Proper Comments\|I wrote a post about adding comments to this blog]] . The TL;DR of the post comes down to "I hacked together a basic comment section using CloudFlare Workers"

Though of course, it might be a bit of a lie to say "I" hacked it together though, at least at the time of writing it.  It's my blog, and I have the code, but unsurprisingly in 2026, I used a ["vibe coding"](https://openai.com/codex/) tool to write it.  

Codex wrote the code, it modified the Quartz template, it even ran the deployments and migrations to CloudFlare.  I mostly told it what to do and sat by while the computer got to have all the fun. 

![[Attachments/Pasted image 20260128194255.png]]

On the one hand, this is cool as fuck.  Like, objectively so.  To get something close to parity to what I have now, it would have likely taken me around five or six hours (in total). The Codex-generated one was in a working state in about forty-five minutes. It is insanely cool. 

I did have to rewrite a good chunk of the code since it started doing a lot of extra calls to SQL that weren't necessary, and I ended up having to rewrite some of the notifications, but even after that the total effort was less than two hours.  

Hell, in some ways it's *better* than what I would have written.  I've never really enjoyed doing frontend work, so if I had done this by hand, it would likely look considerably uglier, but since making it look "pretty" basically boils down to telling Codex "make this look a bit prettier and try and match the theme", there's basically no reason *not* to do it. 


-------

"The New Normal".  I fucking hate that phrase.  It's a phrase that usually doesn't really mean anything; the world is always changing, there's no such thing as "normal", or if there is it is always "new".   Usually the people who say it are conservative idiots who don't like progressive values getting traction, which is probably a large contributor to my distaste for the term. 



However, the phrase is not without utility; sometimes the world really *does* change in a way that is so categorically different that it's worth declaring some delineation. Commercial flights made it possible to go anywhere in the world in hours instead of days (or months).  The transistor allowed for calculations billions of times faster than a person could be hand. The internet enabled near-instant sharing of information to anyone on the planet.  

And now computers can write code pretty well. Not great, but pretty well, and we no longer can pretend that it doesn't.  

-----

I bring this up because AI is getting good enough that employers will, sooner or later, start *requiring* us to use AI everywhere. People writing code manually will likely end up being pretty niche, like people who still write and read assembly code now: still existent but rarer.

This isn't meant to fear-monger, because honestly I'm not afraid, at least not in any existential sense.  I think most working software engineers will be fine, and I'm generally pro-automation wherever possible. 




While doing the vibe coded work was certainly faster than if I had written it entirely by hand, it certainly wasn't as *fun*. Instead of being deeply involved with the code, manually testing everything, and knowing what every function and line of code does, I am effectively a makeshift project manager babysitting a virtual intern. 

This is often the way of progress; there were probably plenty of people who liked crunching numbers manually, but it's not like we stopped developing the personal computer just to make them happier. 

Still, I'd be lying if I said that I didn't feel like something is lost.  Programming is something I've generally been pretty good at and something I've generally enjoyed, and increasingly it seems like the world is going to shift over to a higher level, with my job morphing into prompting Codex or Claude and fixing the occasional bug or optimization. 



--------

I dunno.  I can't *not* vibe code now.  I know too much, I can't pretend that these tools aren't useful. I guess it just feels like the end of an era. 

Endings are often "sad", but they're not always "bad".  At least that's what I tell myself. 








