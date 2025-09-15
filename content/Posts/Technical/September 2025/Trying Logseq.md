---
{"publish":true,"created":"2025-09-12T22:01:18.353-04:00","modified":"2025-09-14T23:23:01.904-04:00","cssclasses":""}
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


# Annoyances

The first thing that I found irritating about it is that it's not easy to change the font.  I use the Comic Mono font (described [[Posts/Technical/March 2025/My Comic Font Adventure\|here]]).  With Obsidian, changing the font to it was about ten seconds of effort; I go to the settings and change the font.  It's how pretty much every program does things. 

You *can* change the font, though.  You just have to muck with CSS.  Here's what I had to do: 

`<LOGSEQ ROOT>/logseq/custom.css`
```css
@font-face {
  font-family: "Comic Mono";
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url("https://cdn.jsdelivr.net/fontsource/fonts/comic-mono@latest/latin-400-normal.woff2") format("woff2");
}

@font-face {
  font-family: "Comic Mono";
  font-style: normal;
  font-weight: 700;
  font-display: swap;
  src: url("https://cdn.jsdelivr.net/fontsource/fonts/comic-mono@latest/latin-700-normal.woff2") format("woff2");
}

body {
  font-family: "Comic Mono", monospace !important;
}

code, pre {
  font-family: "Comic Mono", monospace !important;
}
```


Additionally, as far as I can tell, there is no way to split the screen.  The advice I have seen has been to open two instances and put them side by side but that's not a solution,  it's a workaround and not a good one. 

You can at least get a "mini window" by shift-clicking on your link, which might be good enough if all you're planning on doing is dragging and dropping blocks, but since I tend to prefer to have multiple splits open in order to look at multiple files at a time. I am sure that I'm going to be told I'm using it wrong and I should write some elaborate query or something, but I just found it annoying. 

Obsidian has a ton of plugins, so I was hoping that Logseq would have something comparable to fix all this.  Sadly, this isn't the case.  

The first thing I looked for was the ability to enable Vim keystrokes. When I found that there wasn't something built into the platform, I thought that there might be a plugin to enable it.  There is [logseq-plugin-vim-shortcuts](https://github.com/vipzhicheng/logseq-plugin-vim-shortcuts), but it isn't actually usable for editing text, just navigating around the blocks.  

While this isn't a total dealbreaker, it is disappointing; I use Vim keystrokes pretty much everywhere and it's hard for me to go back and forth.  

Even more frustrating is that the iOS port of Logseq doesn't have plugin support at all, which means that if I have issues with the iOS version, I am just stuck with them. 

In fairness, Logseq has more tooling built in.  There is already very robust TODO support that is comparable to the Tasks plugin for Obsidian, and the desktop version also comes with Git support.  

There is also the issue of static site generation.  There does exist an official [static-site generator plugin](https://github.com/logseq/publish-spa), it doesn't lend itself well to long-form content like you'd have as a blog.  Logseq really only has support for bullets; even if you hide the bullets in the app, they're still in the saved markdown files. 

This isn't really a "problem", it's a notes app after all, but as this blog is rendered using [[Posts/Technical/September 2025/Transitioning to Obsidian For This Blog\|Quartz]], this would mean I would be required to still have Obsidian installed in order to write posts for this blog.  

Performance is also decidedly worse than Obsidian.  I have a couple thousand notes in Obsidian, and I ported them over ([with some AI assistance](https://openai.com/index/introducing-codex/)), trying my very best to follow the idioms for Logseq that I read on their website and various forums.   This load seems perfectly fine on my laptop, even with the graph view and even with fairly elaborate queries.

This same load makes Logseq lag, even outside of the graph.  Queries of similar complexity can take several seconds to load.  The graph view really stutters, and since the graph view is more important in Logseq than Obsidian (due to the aggregating nature of the tags), this is actually something that's irritating. 

And this is with a fairly beefy laptop.  I suspect a crappier laptop would really struggle with this.  

# Conclusion. 

I *want* to like it. Genuinely.  It's open source, it's cross platform, it's written in Clojure.  Every instinct inside me says I should transition to this away from Obsidian, but I just can't.  Every time I would start getting proficient with one of Logseq's idiosyncrasies, I would find some hard limitation that, in my mind, is just objectively worse. 

I almost certainly could code my own plugins to fix some of my issues, and I haven't really ruled that out, but ultimately I think these plugins would just make Logseq closer to Obsidian, and at that point...why not just use Obsidian? 

I am going to try it for a few weeks. I have been able to more or less adjust to a lot of it, so I need to see if I'm more productive with it than Obsidian, or if I grow to like it more.  We'll see. 



# Update

~~I have been trying it for a bit, but I have hit a hard blocker; the [Mermaid](https://mermaid.js.org/) support is somewhere between non-existent and terrible. This is a total non-starter for me.  I use Mermaid pretty liberally.  I am officially going back to Obsidian permanently.~~

Turns out that the [Fenced Code](https://github.com/xyhp915/logseq-fenced-code-plus) plugin has perfectly competent Mermaid support. The test is back on! 