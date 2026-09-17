---
{"publish":true,"title":"Microsoft Office on Linux","created":"2026-09-17T11:22:44-04:00","modified":"2026-09-17T13:59:31.558-04:00","tags":["technical"],"cssclasses":""}
---


*TL;DR: MS Office 365 works on Linux now! [Click here!](https://github.com/Tombert/office365_flake)*

I've always had incomprehensibly bad handwriting, so I started typing my homework the moment my mom purchased a laser printer when I was twelve.  My parents never got around to buying me a copy of Microsoft Office, so after my free trial ran out I searched around and eventually found OpenOffice. I ended up liking it considerably more than Office.  This had the advantage of making it easier to move to Linux when I was seventeen. 

Then in my early twenties I discovered LaTeX and Markdown and Pandoc and started writing my documents with those tools in Vim, and I haven't used WYSIWYG editors since. Yeah, I know, I'm one of "those people". 

I say all this to emphasize that for whatever reason, I am not the target audience for Microsoft Office. I've never liked the software, and even as a child I thought it was overpriced.  Even within Windows-land (if you're into that kind of thing) there are free/cheap office suites that seem to work fine for most people, and certainly worked fine for me throughout middle and high school. 

For whatever reason, though, a lot of people still use Microsoft Office, and will still use this as their excuse for not switching to Linux. 

------

It's [no](https://news.ycombinator.com/item?id=49704623) [secret](https://news.ycombinator.com/item?id=47507776) [that](https://news.ycombinator.com/item?id=49177795) [I](https://news.ycombinator.com/item?id=46699110) [do](https://news.ycombinator.com/item?id=46351428) [not](https://news.ycombinator.com/item?id=45852933) [like](https://news.ycombinator.com/item?id=45601144) [Microsoft](https://news.ycombinator.com/item?id=45559803) products, particularly Windows. I think that, as a corporation, Microsoft has taken something that was genuinely impressive (the Windows NT kernel), and managed to simultaneously fuck it up while also letting it stagnate.  There *was* a time that there an argument that Windows NT was best operating system available.  That time is not now; most of the features that were impressive in Windows NT have been replicated and/or succeeded in Linux and BSD. 


That said, I do understand why people stick with it.  If your workflow depends on an application or applications that only runs on Windows, it is a pretty tough sell to drop everything you know, relearn everything, and switch for something like a "kernel" you don't really understand.  This is why I've never agreed with the ["no tux, no bux" mantra](https://www.reddit.com/r/linux_gaming/comments/18heeze/thoughts_on_no_tux_no_buxx/).  

For those who are not chronically online, the "no tux no bux" sentiment is that "we won't give money to companies who don't write native Linux software".  It's a noble idea, but I think ultimately futile.  People form strong relationships with proper nouns.  They don't want something "just as good as Program X", they just want Program X. Telling someone that they won't be able to use their favorite program on Linux gives the same energy as the ["we have X at home"](https://knowyourmeme.com/memes/we-have-food-at-home) meme.  If you want people to dump Windows, I think you ultimately need to support most of the Windows software people depend on.

Valve clearly understands this, and has done some unbelievably impressive work with [Proton](https://en.wikipedia.org/wiki/Proton_%28software%29) on top of the already-very-impressive work of the [Wine](https://www.winehq.org/) project.  Proton has gotten so good that I don't even bother checking compatibility before purchasing Windows games.  I'm just confident it will work without much headache, and I'm generally right. 

Wine has undergone [a lot of improvements lately](https://byteiota.com/wine-11-ntsync-kernel-rewrite-678-gaming-performance-gains/), and finally has native Wayland support, which really helps with UIs feeling "natural", compared to the old X11 style. 

I have been going through another bout of unemployment (to the surprise of nobody), and I pay too much for the fancy Claude Max membership, so I figured that it might be worth seeing if I have Fable play around with this this for a few hours, it might be able to get Microsoft Office working.

Now, before someone asks, I am aware of the web version of Microsoft Office, and yes I know that works fine on Linux.  I am not enough of a user of Office to notice the differences, but people have told me that web version is vastly inferior to the desktop version, which has historically not worked on Linux since office 2007. 

I am also aware of stuff like [WinBoat](https://winboat.app/). It's neat software, and it works fine, but it's ultimately just virtualization.  Given how [expensive DRAM has become](https://en.wikipedia.org/wiki/2025%E2%80%93present_global_memory_supply_shortage), telling people they need to dedicate extra memory to run an *additional* operating system on top of their existing one just so they can use Linux more has always seemed like a tough sell to me.  Not to mention, the goal for me is to *get rid* of Windows, not just hide it.  

It took more than a few hours, but it works! It's available [here](https://github.com/Tombert/office365_flake)!

-------

A few gotchas/details for those interested.  

- I used and abused the [Nix](https://nixos.org/) package manager for this.  It should work on virtually any Linux distro, not just NixOS, but you will need to install it. 
	- There is a reason I did this, and it's not just because I like Nix: Nix Flakes allow you to specify your environment very specifically, and it makes it much easier to reproduce stuff across computers.  I can't promise it will work on *your* computer, but I do think it's more likely than if I had done some ad-hoc scripts.  Docker might work, but then I'm stuck figuring out how to do do GUI forwarding with it that I've never really been able to do consistently. 

- This "sort of" works for X11, but it's kind of glitchy.  The right-click menu, for example, does not work properly. 
- I tested this with Sway and KDE Plasma, and it works fine on those.  It probably will work fine on Gnome or any other Wayland desktop, but I haven't tested on those yet. 
- You need to make an account and buy a license from Microsoft's website since I couldn't get the "buy the membership from within the app" flow working.  I just bought a month in my browser and was able to log in from there.  It wasn't hard, though mildly annoying. 
- This *is not* a cracked version.  If someone from Microsoft is reading this and wants to sue me, I should be clear that *this requires a legitimate account from Microsoft's website*. This doesn't bypass any kind of account requirement, this is not warez, and if you want to use this then you need to pay your ten pieces of silver to our Microsoft overlords. 
- I had to use a *very* bleeding edge version of GE-Proton in order to get the DPI scaling for the UI working correctly. 