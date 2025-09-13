---
{"publish":true,"created":"2025-09-12T22:01:18.353-04:00","modified":"2025-09-12T22:56:27.418-04:00","cssclasses":""}
---

As I've mentioned in [[Posts/Technical/September 2025/Transitioning to Obsidian For This Blog\|in my previous post]], I am a huge fan of the [Obsidian](https://obsidian.md) note software.  I don't need to reiterate all the points here, but suffice to say that Obsidian works well for what I need it for. 

The one complaint I have with Obsidian, and it's something I understand well enough but still don't like, is that it is not open source.  

It *is* free, ([even for business purposes](https://obsidian.md/blog/free-for-work/)), and I actually pay for the professional license to support the project, but I prefer to use open-source stuff when possible. Proprietary software always has a real concern that the project will be abandoned, or the license will change, or they'll start selling all my data, whereas with FOSS I can always fork when the project becomes abandoned [like I did with `riak_core`](https://github.com/Tombert/riak_core). 

Searching for open source clones of Obsidian, the thing that keeps coming up is [Logseq](https://logseq.com/), so I figured I'd check it out. 

I played with it for a few days, and tried very hard to actually *learn* it, and decided to compile my thoughts here. 

# The Gimmick

Logseq, superficially, looks like a clone of Obsidian, but looks are deceiving. 

Like Obsidian, Logseq uses `[[mediawiki]]` links everywhere, but the philosophy around the software is very different.  

With Obsidian, the goal for these links are a means for page creation.  There is a graph, but ultimately it really is like a regular wiki: you are effectively building your own domain-specific Wikipedia. 

Logseq's philosophy works differently.  Instead of creating tons of pages for everything, the "unit" of information is the "block", which effectively a "level" for a typical "bullet-style" outline.  

You are expected to write nearly everything in the "journal" page for the day.  When you want the note to be aggregated or compiled, instead of making a "page", you tag your block with the topic.  When you eventually decide to click on the topic, a page will be created (like Obsidian) and all the blocks that have been tagged will display and be aggregated in the page.  The pages can add data later. 

Ultimately, everything devolves into an outline. Whether or not this is a good thing depends on how you like to compile information.  Personally, I tend to use outlines for all my notes, so this wasn't really that annoying to me but I did read that some people didn't like it. 


I will admit that I didn't initially like this "block-centric" way of working. The pages in Obsidian always seemed like the appropriate level of granularity, and I wasn't partial to the idea of dumping all my ideas into one spot, but it kind of grew on me. 

Sure, you *can* just use links, but due to the block being the "atom" of info in Logseq, you can *also* just drag the block into the page once it's created. You can also edit the pages around there aggregations, so it's ultimately not *that* different from Obsidian if you use it that way, but it's different enough to be confusing. 


# Plugins

Obsidian has a ton of plugins, so I was hoping that Logseq would have something comparable.  Sadly, this isn't the case.  

The first thing I looked for was the ability to enable Vim keystrokes. When I found that there wasn't something built into the platform, I thought that there might be a plugin to enable it.  There is [logseq-plugin-vim-shortcuts](https://github.com/vipzhicheng/logseq-plugin-vim-shortcuts), but it isn't actually usable for editing text, just navigating around the blocks.  

While this isn't a total dealbreaker, it is disappointing; I use Vim keystrokes pretty much everywhere and it's hard for me to go back and forth.  

Even more frustrating is that the iOS port of Logseq doesn't have plugin support at all.  

In fairness, Logseq has more tooling built in.  There is already very robust TODO support that is comparable to the Tasks plugin for Obsidian, and the desktop version also comes with Git support.  


# Conclusion. 

I don't think I'm going to keep using Logseq.  While I did grow to kind of like its philosophy, I never really got over the "this would be easier in Obsidian" feeling.  

It's certainly worth checking out, if it's something that interests you.  Just not for me. 









