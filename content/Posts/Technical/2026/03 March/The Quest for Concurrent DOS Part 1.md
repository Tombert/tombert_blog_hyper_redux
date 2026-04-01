---
{"publish":true,"title":"The Quest for Concurrent DOS: Part 1","created":"2026-03-31T06:22:44-04:00","modified":"2026-03-31T20:13:34.006-04:00","tags":["technical"],"cssclasses":""}
---




About ten years ago, I watched this video by Lazy Game Reviews: 

![](https://www.youtube.com/watch?v=hJNaAG2BXow)


This was the first time I had ever heard of Digital Research as a company, and upon hearing about them, I became fascinated with their history. There is an alternate universe where Bill Gates languished in obscurity, and Gary Kildall became a household name and one of the richest humans to ever live. Hell, maybe he'd even [hang around better people](https://www.nytimes.com/2019/10/12/business/jeffrey-epstein-bill-gates.html). 



Digital research ended up making a lot of interesting things. They had some early success with the [PL/M](https://en.wikipedia.org/wiki/PL/M) programming language and the [CP/M](https://en.wikipedia.org/wiki/CP/M) operating system, the latter of which works and feels kind of like a "proto-DOS". 

After their debacle with IBM, Digital Research didn't just go away, and they kept innovating on a lot of products throughout the 1980's, and many of them were very cool.  For example, their DOS clone [DR-DOS](https://en.wikipedia.org/wiki/DR-DOS) was in most ways better than MS-DOS. They had a graphical operating system that saw limited success on the PC and considerably more success on the Atari ST called [GEM](https://en.wikipedia.org/wiki/GEM_(desktop_environment)) which was significantly more advanced and better designed than Windows 1 and Windows 2, and there were oodles of other neat things they worked on. 

Digital Research ended kind of tragically, but I love looking through their history and playing with their old stuff. 

# DOS and Its Competitors

Honestly, DOS is only nominally an "operating system" by modern standards. It provides almost nothing outside of an allocator, filesystem, and a program launcher. Perhaps, then, it is unsurprising that there were a number of DOS clones.  Most people are aware of modern things like [FreeDOS](https://www.freedos.org/), but even in the 80's there were already clones available for purchase like the aforementioned DR-DOS, but also stuff like [PTS-DOS](https://en.wikipedia.org/wiki/PTS-DOS) and [ROM-DOS](https://en.wikipedia.org/wiki/Datalight#ROM-DOS). Even Microsoft themselves (in partnership with IBM) started making their own DOS clone, which eventually materialized into [OS/2](https://en.wikipedia.org/wiki/OS/2). 

DR-DOS in particular is interesting, because it was so objectively better that [Microsoft had to purposefully sabotage it so it wouldn't be used with Windows](https://www.geoffchappell.com/notes/windows/archive/aard/index.htm), and even the Microsoft executives [acknowledged it was better than MS-DOS](https://www.theregister.com/1999/11/05/drdos_is_terrific_says_ms/).  

These are all interesting in their own right, but the DOS clone that captured my attention shortly after watching the LGR video was [Concurrent DOS](https://en.wikipedia.org/wiki/Multiuser_DOS#Concurrent_DOS). 

Normal MS-DOS is famously single-tasking.  A computer running MS-DOS can run exactly one process at a time.  There were workarounds like [DOS Shell](https://en.wikipedia.org/wiki/DOS_Shell#Shortcomings), which could launch multiple tasks but only run a single at a time and parked other tasks by moving the memory to the disk.  

However, unlike most other DOS implementations, Concurrent DOS was exactly what it sounded like: it was a DOS-compatible operating system that provided multitasking.  A single user could run multiple programs at once on the same computer via the use of multiple DOS shells, or they could use a single IBM PC as a server and allow dumb terminals to connect to it, and in theory allowing companies to avoid paying for multiple computers. 


# Multitasking 101

There are two main forms of multitasking that modern computers utilize: Preemptive and [Cooperative](https://en.wikipedia.org/wiki/Cooperative_multitasking). 

Cooperative multitasking is what older versions of Windows (like Windows 3.1) and macOS used and is generally regarded as simpler. A process will exclusively use the CPU until that process  explicitly yields control.  This can provide good performance, since you can avoid tasks being interrupted midway through, but has a potential to cause freezes if the program never yields control.   

Preemptive multitasking is what most modern operating systems use.  With this framework, each task is given a designated amount of time to execute (called "time-slicing"). After that time has passed, the process is paused, and the operating system will then move onto the next process and repeat.  This is generally more stable and leads to fewer freezes because we are not depending on any individual program to voluntarily give up control, but it comes at a cost of potentially having expensive interruptions (called "context switches"). 

This is a simplification, and there are advantages to both, but preemptive multitasking is generally considered more advanced and more desirable, hence why every major operating system today uses it. 

Concurrent DOS had full preemptive multitasking, even in the mid-80's, running vanilla MS-DOS programs. This is actually more impressive than it might sound;  DOS programs *assume* a single-tasking operating system, so they don't make any attempt to play nicely with other programs.  Programs will purposefully utilize all the RAM and CPU that is available to them since they don't think that they're sharing with anyone. The use of preemptive multitasking ensures that no one process hogs the entire CPU or starves the other processes.  

Using Concurrent DOS (and its successors) feels almost anachronistic.  The commands are typical DOS commands, but the outer interface feels almost like `tmux` or `screen`.  In fact, in general it feels like it lives old-school Unix and DOS.  It's interesting to speculate the "What if?" universe where Concurrent DOS became the standard...how much longer would the DOS-style have lived on if there were multitasking available? 


# My Interest

I played with an archived copy of Concurrent DOS in a virtual machine several years ago, and I thought it was pretty cool.  I did have some issues getting some graphical applications to work, and I'm not sure if that was the fault of the operating system or my incompetence, but I suspect if I had been alive in the 1980's I would have powered through and figured out how to play my games. 

Digital Research did the thing that tech corporations do and got acquired by other companies, which then got acquired by other companies, which get acquired by other companies, etc.  Digital Research was acquired by Novell, who took some of their stuff but also licensed out DR-DOS to Caldera and Concurrent DOS to several other companies to adapt and maintain.  [Liam Proven has an excellent article talking about what happened](https://www.theregister.com/2022/08/04/the_many_derivatives_of_cpm/) that I highly recommend reading.  

After Microsoft [open sourced DOS](https://github.com/microsoft/ms-dos) a couple years ago, I wanted to see if there had been anything similar happening to any of the Digital Research operating systems only to be shocked that the state of ownership for Concurrent DOS and Multiuser DOS is very nebulous. 

I think that Concurrent DOS (and really everything from Digital Research) is an important part of computing history, and I think that we should do what we can to acquire and preserve the source code for these things when possible.  I realized that the best case scenario is that the remaining Concurrent DOS source code lives on some server at a big heartless corporation, and the more likely scenario is that it lives on some random person's aging hard drive and the code is currently just one stray cosmic ray away from being corrupted and lost forever.  


Even in the already-niche world of retro computing circles, Digital Research stuff is pretty niche, and even within circles that care about Digital Research, Concurrent/Multiuser DOS is pretty niche.  A niche of a niche of a niche. Despite Digital Research's indisputable historical importance, there simply hasn't been the coordinated preservation effort that you see with video games, music, or movies. 

And after thinking about this, I came to a realization: no one else is going to save this code. If not me, then who? 

With a combination of obligation and delusions of grandeur, I decided I was going to find who owned the rights to Concurrent DOS, and either convince them to release the source code themselves, or let me buy the rights to it so that I can release it. 



# OpenText 

My first thought was to simply follow the acquisitions. I assumed corporation acquisitions work more or less like those fish-eating-fish charts I would see in my school. 

![[Attachments/Pasted image 20260329220017.png]] 
(Courtesy [Creative Commons](https://openverse.org/image/0e342c05-d687-4bbc-8168-25c5964db518?q=Fish+eating+fish+eating+fish&p=1))


Digital Research was eventually acquired by Novell.  Novell eventually sold DR-DOS to Caldera. Caldera appears to have later renamed the software to "OpenDOS".  

The Concurrent DOS lineage is a bit more complicated.  It didn't appear that Novell sold Concurrent DOS or Multiuser DOS to Caldera in 1994; Caldera certainly never released any successors to it. This is further evidenced by the fact that Novell also separately licensed Multiuser DOS to three separate companies to expand and improve:  DataPac Australasia, Concurrent Controls, Inc., and Intelligent Micro Software. 

I figured it might be best to first reach out the the core licensor, so I went looking for Novell's website, only to find out that Novell was acquired by Attachmate in 2011.  Three years later, Attachmate was acquired by Micro Focus (who I only remembered for making shitty antivirus software).  Finally, Micro Focus was acquired by a company called OpenText.  I had never heard of OpenText, but apparently they're one of those Borg-like assimilators that seems to [acquire a million things and then live in the background](https://en.wikipedia.org/wiki/OpenText#Acquisitions_and_divestitures). 

It seemed worth a shot to reach out to them, but their [contact page](https://www.opentext.com/contact) seems to be only for sales.  When I tried calling the number, I got a sales representative who had no idea what the hell I was talking about. I thought I might have already hit a wall.  It's not like big corporations advertise the phone number for their legal departments, and I didn't really have the money to buy my way in with a customer support account. 

However, after a few random searches with different permutations of "intellectual" "property" "ip" and "OpenText", I eventually found their [trademark page](https://www.opentext.com/about/trademark-and-logo-usage), with the email address `ipadmin@opentext.com`. 

I sent them the following email: 

> Hi! 
> 
> I have been looking into purchasing the rights to the source code to the Digital Research Concurrent DOS operating system. 
> 
> Digging around acquisition history, it looks like OpenText might own the rights to Digital Research's IPs. Can someone at least confirm if OpenText owns the rights?



I thought it might be a long shot, but after three days I was shocked to get this response: 

> Dear Mr. MY NAME, 
> 
> Open Text does not own those rights. That business was sold by Novell in the mid-1990s to Caldera.

When I received this email, I was surprised for two reasons.  First, they misspelled their own company name by adding an extra space in OpenText.  Second, this was contrary to what my research seemed to indicate. Every bit of information I could find seemed to indicate that Novell still owned the rights to Concurrent DOS before they were purchased by Attachmate.  

Either the OpenText representative was wrong, or the info I found prior was wrong. Regardless, OpenText seemed like a dead end. 

# Caldera

Because OpenText outright told me that Caldera owned the rights, that seemed like as good an excuse to pursue that direction. 

Caldera appears to be a defunct company, but I did find the LinkedIn for the founder (I don't want to directly link it here because I don't want to invite a ton of spam, but it's not hard to find).  

I sent him a message, and to this day he hasn't gotten back to me.  I'm not upset with him for this; he probably has one of those "life" things I keep hearing about.  


Back to the drawing board.  


# Citrix

The next logical step to me was to reach out the three companies that Novell licensed Concurrent DOS was licensed to. 


Concurrent Controls appears to be completely defunct, and I had trouble finding much information about anyone involved with the company, so that was a dead end.  

Intelligent Micro Software also appeared to be equally dead.  As far as I could tell, it was purchased by some holdings thing that that worked in an entirely different field from software.  Probably a dead end. 


That left DataPac Australasia, which had been [acquired by Citrix in 1997](https://mergr.com/company/datapac-australasia-pty).  Citrix is still around, so I thought I might be able to find a similar email to what I had found for OpenText. 

They do not.  Instead, I found a sales number, which had me navigate through several menus *and wait on hold for ten fucking minutes*, only to be told that they have stopped phone support and to please use their website.  After that Kafkaesque nightmare, I eventually found their live support/sales chat.  

Like every big corporation has been doing in the last year, Citrix has moved their support to start using some shitty sycophantic LLM system that is very eager to please, but doesn't know what the hell it's doing.   Here's a bit of a trick to start talking to a human: just type curse words.  A lot of the time for chatbots, there's a simple profanity filter that triggers the "irate customer" flow, and that upgrades to a human.  I just typed "fuck" to the bot until it gave me the "we are connecting you to a representative" text.  Give a small salute for small victories. 

Eventually I got a human on the chat.  I asked him if there's any way I could be put in touch with Citrix's legal department, because I want to ask about the rights and potential acquisition of Concurrent DOS or Multiuser DOS, since it looks like Datapac was acquired by Citrix.  

I'm sure the guy is normally a competent and nice person, but the customer support representatives are not really trained for some weirdo looking to purchase the rights to abandoned forty year old software.  Clearly this is a deficit of the customer support training and should be remedied immediately. 

The guy puts me on hold for about five minutes, thanks me for my patience, and then puts me on hold for another five minutes.  

Eventually he tells me that I should call one of the local Citrix vendors, and they'll be able to help.  

I respond that it seems unlikely a local reseller is going to know anything about the rights to Digital Research's software or have much insight into getting ahold of Citrix's legal department, but the representative was very insistant that it would.  This was beyond his element and while that's obviously not his fault, continued talking to him would not be fruitful. 


----------------------------

I guess I might as well try the resellers. 


I found a [page from Citrix](https://www.citrix.com/buy/partnerlocator/results.html?partnertypes=CSN&levels=CSN-PLATINUM) that tells me where I can find something in my area.  I put in New York, and ten businesses showed up with their corresponding phone numbers. 

I called all ten numbers. Five of them simply could "not be completed as dialed", presumably because they were dead numbers.  Two of them gave me a "this location is no longer operating" message, without a redirect number.  The remaining three went straight to voicemail.  I left messages, knowing full well that even if a human did listen to it, they would probably not be able to get ahold of anyone at Citrix that could actually help me. 

Another dead end.  

-----------------------

I found another company called "CXANZ", which appears to more or less be Citrix's Australia and New Zealand branch. Since the original Datapac company was Australian, it seemed like it was worth a shot, with basically the same email I sent to OpenText earlier. 

A few days later, I got this response: 

> CXANZ is the representative of Citrix in Australia but we are not able to assist with this request.  You might be able to reach out to Cloud Software Group ([https://www.cloud.com/contact-us](https://www.cloud.com/contact-us)) who might be able to provide guidance.

Damn.  I tried that Cloud.com contact page, but no dice on that either. 

Citrix is dead to me. 


# Exasperation


Well, what now? Every lead I could find had been thoroughly exhausted.  A person with any semblance of sanity would certainly stop at this point, realizing that they had spent way too much fucking time trying to find out the rights to forty year old software that clearly no one cares about anymore.  

But I can't shake this tingling feeling.  What was that company I blew off again?  Intelligent Micro Software I think?  What was their deal? It looks like they maintained a version of Concurrent DOS called "REAL/32", a 32-bit variant of the software.  Neat!


After doing some basic digging, it looks like they were purchased in 2002 by a company called Itera Ltd. 

Itera appears to have diversified into a lot of different companies, but now they focused on exactly one thing: Kitchen remodeling.  I was not expecting kitchen remodeling.  Who the hell pivots from a cushy software job to real work that involves using both hands *and* feet? 

Maybe I got something wrong.  That's probably it.  It's probably a name that's just used by two different companies.  The kitchen remodelers are probably a dead end. Just a coincidence. 

But I've already exhausted every lead I could think of, and I rarely pass up an opportunity to annoy strangers, so what the hell, I'll look into it. 

I find the offical website for their kitchen service, but it appears to be dead. Just some broken page with a book in its background. 

![[Attachments/Pasted image 20260329235236.png]]

Well shit, that's not useful.  Did this site ever work? Wayback Machine might be worth a shot.  

I go to archive.org and try the site, and go back to 2021, and I am greeted with a delightfully Web 1.0 page.  


![[Attachments/Pasted image 20260329235541.png]]

Well, there's a `Contact us` page, and there's an email address there.  I've come this far, might as well pull this last thread. 

I send this email: 

> Hi! 
>
> I hope you are doing well today. 
> 
> I have been trying to find out who might have the rights to the source code of Concurrent/Multiuser DOS. I am interested in purchasing the rights from you if that person is you. 
> 
> If I have the right person (finding this email wasn't easy!), please let me know!


About forty-five minutes later, I get a response: 

> Hello Thomas
>
> Well done for tracking me down.
>
> I do own rights to Real/32 which was based on concurrent dos/multiuser dos.
>
> I still have the source code etc.
> What is your interest in it?


Holy shit.  



# Intelligent Micro Software

The guy (whom I will pseudonym "Bill") turned out to be a pretty cool and likeable guy. 

Bill's story was interesting; he started his career in IT in the early 80's, working primarily with [CBasic](https://en.wikipedia.org/wiki/CBASIC) and writing financial management software for Concurrent DOS. 

Bill had already been using REAL/32 in 2002, so when the Intelligent Micro Software started facing financial difficulties, Bill purchased the company and thus also the rights to REAL/32. 

In 2008, predicting the economy might take a tumble, Bill decided pivot to careers to something he felt would be more creative: kitchen remodeling.   That is certainly a unique pivot, and from what I can tell the kitchen remodeling business has worked out quite well for him. 

We ended up discussing a lot of interesting stuff, actually. 


For example, if you read about REAL/32, you'll likely find information about REAL/NG.  

REAL/NG was nominally a successor to REAL/32, and reading the details it sort of looks like the holy grail of DOS.  It was going to add symmetric multiprocessing, run on top of Linux, thousands of virtual consoles, while retaining complete compatibility with REAL/32. 

I asked about REAL/NG, and Bill got back to me with this: 

> I think I may have the source code for Real/NG. It never became a sellable product. The guys working on it said jokingly that the "NG" stood for "Never Going happen".
> ... 
> I found a lot of the dealers were installing the same copy of Real/32 on different servers, piracy. They were waiting for Real/NG to be released.


So it looks like it might have been, at least in part, vaporware. Too bad.  


Eventually Bill offered to sell me a hard drive with a fully maxed out REAL/32 with a bunch of goodies in there for \$450 (for his time).  It's admittedly more than I wanted to pay, especially since he only said that he would "look" for the source code and as such the only guarantee would be binaries. It also felt like it might be a scam, \$450 seemed like a lot of cash to send an old hard drive.  Still, I also felt that if I didn't agree to this he'd simply stop responding to me, so I against my better judgement I agreed. 

He said he wouldn't be at his "PC Office" for three more weeks, so I am stuck waiting. 


----------------------------------


And that's where we are right now.  I feel I am very, *very* close, but right now I'm still waiting for a hard disk to arrive.  

I am hoping that everything with Bill pans out, but I have to be prepared for the potentiality that it doesn't.  He could ghost me, or he could decide he doesn't want to send the source code after all. 


With the help of of some email correspondence with [Liam Prover](https://www.theregister.com/Author/Liam-Proven/) (who has been very helpful in this), I have been reaching out to a few more leads.  

I'm not giving up on this: the source for Concurrent DOS will be found.  



------------------


NOTE: I have purposefully omitted some proper nouns here to avoid calling attention to people who clearly don't want attention being called to them (else they would have been easier to find!). Sorry if this kills the narrative for you, just trying to be a decent human. 


