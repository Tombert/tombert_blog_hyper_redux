---
{"publish":true,"title":"Stop Pushing AI Generated Code to Git","created":"2026-04-05T06:22:44-04:00","modified":"2026-04-06T00:14:01.226-04:00","tags":["technical","rant","PSA"],"cssclasses":""}
---



I am not a luddite.  I use Claude Code like everyone does.  It's a good tool, you should use it. Not like you'll have a choice in that, given that every job posting now requires AI proficiency. 

But you should stop posting the emitted code to GitHub

# You wouldn't commit a binary.

Rewind the clock back to 2020, a more innocent time. 

If you wrote a program in C and compiled it with `gcc`, you would not commit `a.out` and push it to the regular Git history.  If you did this, people would rightfully make fun of you; the point of things like Git is to preserve *human effort*, with the implicit understanding that the human effort is the most expensive part of the process. 


This is the same with AI generated code.  If you are not *directly* and *manually* modifying the emitted source code from Claude or Codex then there is no value in committing the code.  It's not significantly different than commiting and pushing a binary from `gcc`. 

Instead, consider pushing the prompt to GitHub and allowing people to reuse it. 

# What if I don't just don't just have one big prompt, and it's more conversational? 

Upload the entire conversation, except with any personal information redacted. 

Claude Code has `/export` available ot share the conversation. *This* is the human labor that you want to preserve. 


# How do you deploy my site without commiting to Git? 

The same way you deploy a static binary to your server.  Upload the emitted binary to the server somehow, either manually or via Continuous Integration. 


For example, have CI run through your committed conversation, and have build artifacts then get sent to your appropriate srever. 

# But AI is non-deterministic! 

Be honest with yourself, are you *actually* thoroughly checking every line of emitted code that Claude gives you?  I am sure that some of you can honestly say "yes" to that question, and *maybe* those people can justify committing the emitted code.  

Most people don't do that.  They tell Claude to write the code based on some specification, test it to make sure it seems ok, and then commit it.  Given that, then the emitted code is *already* non-deterministic, or at least has potential timebombs.  

If you are worried that you're going to deploy code that isn't thoroughly vetted, then I am afraid I have to tell you that *you already are*. 

If your prompts are non-deterministic, *make it deterministic*.  Write tests that the AI can run to sanity check the emitted binaries.  Make the prompt so specific as to not leave any ambiguity.  Use one of the thousands of free guides on how to use Claude instead of just free wheeling it.  You know, the stuff you were *supposed* to be doing anyway. 


# Ok Boomer, you just don't understand AI and you want things to go to the past and ....

No, I am not a luddite here.  I think we *should* be using these tools.  You can't *not* use them at this point. They are indisputably useful, and I'm fine with things that can automate the tedious parts of code. 

I'm arguing that what's currently happening is people trying to shoehorn the modern high-level way of thinking into legacy low-level thinking.  We're polluting GitHub and GitLab and SourceHut with millions of lines of code that literally *zero humans understand*. 

I don't have a problem with people not understanding every line of emitted code; I certainly don't understand everything about the emitting binaries from `gcc`.  I'm arguing that the generated code from Claude *is not the interesting part* and *does not need to be preserved in Git histories*. 





