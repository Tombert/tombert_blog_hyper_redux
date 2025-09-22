---
{"publish":true,"title":"Transitioning to Obsidian For This Blog","created":"2025-09-09T00:21:44-04:00","modified":"2025-09-22T19:51:31.151-04:00","tags":["technical"],"cssclasses":""}
---


So to my zero readers, you probably noticed that these pages looks pretty different. 

I am a pretty avid user of the [Obsidian](https://obsidian.md/) note software.  I think the interface is clean and responsive, it works on all my devices, it's free, the Vim plugin is pretty intuitive, and I actually think that the [MediaWiki](https://en.wikipedia.org/wiki/MediaWiki) style actually works pretty well for notes. 

It also has an extremely robust [plugin ecosystem](https://obsidian.md/plugins).  I use the [Tasks](https://github.com/obsidian-tasks-group/obsidian-tasks) to do my [GTD](https://en.wikipedia.org/wiki/Getting_Things_Done) dogma. I use [Obsidian Git](https://github.com/Vinzent03/obsidian-git) plugin to sync between computers. I use [DataView](https://blacksmithgu.github.io/obsidian-dataview/) plugin to make aggregations and dashboards. 

I have thoroughly drunk the Obsidian Kool-Aid, and I have been curious if there was any way to make a wiki-style blog. 


# What We Had Before

For the last few years, I have used the [Hugo](https://gohugo.io/) static site generator, and there's nothing "wrong" with it really.  It's very fast, it generates fairly nice HTML, and it's not too hard to configure. 

The biggest issue I had with Hugo was how..."unconnected" things feel.  If I want to reference other pages, you have to actively find a link for it, and if you ever rename anything, you have to manually find all the references and actively change them, which is error-prone and annoying. 

This also made it hard for me to do anything on my phone.  If I wanted to make a fix to fix something on my blog, I would have to open up my laptop, find the issue in NeoVim, manually rebuild, and redeploy. Obviously this isn’t the end of the world, but it would be annoying because if I wasn’t at home I would have to wait until I had access to my laptop. 

I also didn't find it very straightforward to do anything involving elaborate queries, though that might just be due to me being an idiot.  

# Quartz

Obsidian has a paid [Publish](https://obsidian.md/publish) service, and I've used it, and it's very good, but I think it's a bit overpriced for what you get. $8/month is enough to buy actual web hosting, or gigs of cloud storage and I don't think I can justify it considering how little traffic this blog actually gets. 

Open source to the rescue! [Quartz](https://quartz.jzhao.xyz/) is a tool that takes an Obsidian Vault and converts it into a static website, while preserving the links, hierarchy and graph that you would expect in Obsidian.  It even has a fairly decent search built in...a lot better than the [[Posts/Technical/March 2025/Making a Shitty 'Search Engine' in Hugo\|shitty one that I made for Hugo]]. 

It works pretty well. I think it looks pretty enough and I can keep using the same vault that I use for everything else.

## Quartz-Syncer

Quartz is cool, but it has a few missing features. 

First, it's actually somewhat detached from the actual Obsidian application; you need to keep shit separated.  I understand that part of this is to make it so that it works in other applications, but I don't want to use other applications. 

You can fairly easily just point Quartz to your vault, so it's not the end of the world, but this brings me to my second complaint:  you have to convert the *entire* vault (or at least everything in the `content` folder) to the static site.   By itself, that's a complete non-starter for me; I use Obsidian for my personal and work notes.  There's lots of stuff in there that I don't really want to publish the the outside 

Last, Obsidian queries simply don't work, meaning that dashboards won't render and I'll be sad.  


Fortunately, there's a solution to all these problems: [Quartz-Syncer](https://saberzero1.github.io/quartz-syncer-docs/).  

Quartz-Syncer does everything I want.  It's integrated directly as an application plugin.  It allows me to specify and omit folders, and it can render DataView queries in the background, allowing me to make my lovely dashboards. 

 

This actually is kind of important for a blog.  If you look at the [[index\|home page]], it uses a DataView query to list out the posts in reverse order by date, which wouldn't be possible with regular Quartz.  


It also appears to work perfectly fine on the iPhone Obsidian app, meaning I can do major edits to the blog on my phone. I can make my edits and push, and Cloudflare Pages handles the building. It’s a beautiful thing.

# Conclusion

I think Quartz is pretty cool.  

I opted to do a straight port from the Hugo stuff for now, but I have plans for how I can use the Wiki features in a blog format. Stay tuned. 

# Update

I already have managed to do some interesting stuff. 

Due to the easy file hierarchy integration, it is easy to simple add folders and notes to build out a site menu with features.  I added a few pages for my public speaking and my personal projects and snippets. I was able to link to the pages with the regular linking syntax.  It was about as intuitive as using Obsidian…I think I’m in love. 

I think I got all the links wired up correctly and the images moved over. If you spot a dead link, please do not hesitate to [[Contact\|contact]] me so I can fix it. 