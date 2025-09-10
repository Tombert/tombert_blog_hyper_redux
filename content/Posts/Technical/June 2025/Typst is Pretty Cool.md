---
{"publish":true,"title":"Typst is Pretty Cool","created":"2025-06-30T02:21:44-04:00","modified":"2025-09-10T01:03:39.793-04:00","tags":["technical"],"cssclasses":""}
---


I am starting a Masters program tomorrow, and the first assignment looks to be written one.  

When I was doing my undergrad, I managed to avoid using Microsoft Office entirely by writing in [Markdown](https://daringfireball.net/projects/markdown/) and using [Pandoc](https://pandoc.org/) to compile to [LaTeX](https://www.latex-project.org/), which would then be compiled into PDF. 

This sounds complicated, but it really isn't, it was generally a command like this: 

```bash
pandoc input.md -o output.pdf --citeproc --bibliography=references.bib 
```

I would then use something like a [Nix Flake](https://wiki.nixos.org/wiki/Flakes) so I can simply type `nix build` and get a PDF.  

I know a lot of people wouldn't like this, but I love it.  I find Markdown to be an overall very pleasant way to format text.  I can do everything in Vim and I can get the nice pretty LaTeX rendering. 


# Issues

## Hard to do Custom Formatting

If you can fit your document into the standard Pandoc template, it works great, and you will likely get a very nice document without many problems. 

The issues pop up if you need atypical formatting.  If you start needing multiple columns, or need control of your page breaks, or want to have text wrap around pictures, you end up having to drop into a lot of arbitrary LaTeX and it gets messy. 

That's actually both a strength and a weakness of the entire Pandoc system I use: it has a tight integration with the underlying LaTeX.  This isn't inherently a "bad" thing, but mixing and matching gets messy, and you end up having to mess around with `.sty` files if you want to do weird formatting. 

## Lack of Macros 

LaTeX has a fairly robust macro system, but Pandoc really doesn't. This isn't a huge deal but it's a little annoying.  You *can* use LaTeX macros if necessary but it breaks down into the previous point. 

## Compile Times

It's hardly a secret that LaTeX is slow to compile, and Pandoc does nothing to speed that up. For example, I wrote some slides for [Lambda Days 2025](https://www.lambdadays.org/lambdadays2025) recently.  There were 54 slides with simple pause transitions between the bullet points.

Compiling with Pandoc: 

```zsh
➜  lambda_days_2025 git:(devel) ✗ time nix build
warning: Git tree '/home/tombert/lambda_days_2025' is dirty
[1/0/1 built, 0.0 MiB DL] building Presentation-Build (buildPhase):     /var/cache/fontconfig
nix build  2.87s user 0.81s system 4% cpu 1:19.44 total
```
More than a whole minute to compile everything! 

This might be due to the fact that [sometimes LaTeX needs to compile the same file three times](https://tex.stackexchange.com/questions/53235/why-does-latex-bibtex-need-three-passes-to-clear-up-all-warnings), so it's possible that Pandoc is doing this but it's still endlessly annoying. 

# Typst

I just assumed that this was something I'd have to live with, and I had kind of accepted it, but then on Hacker News I saw something about [Typst](https://typst.app/) and I figured that it was worth a shot.  It looked interesting and it has a direct package on Nix, so I installed it and started playing with it. 


## Syntax

The Typst formatting language is different but very similar to Markdown, and while I think I still prefer Markdown, it's not really "worse" in any kind of objective sense.  
If I wanted to write a markdown document with some headers and subheaders in Markdown, I would do something like this: 

```markdown
# First Heading

Here is some text

## Sub Heading

Even more text

# Second Heading

More Stuff. 
```

To do the equivalent with Typst you would write:

```typst
= First Heading

Here is some text

== Sub Heading

Even more text

= Second Heading

More Stuff. 
```

As you can see, it's roughly equivalent to the Markdown version, simply replacing the `#` with `=`. 

Most of the changes are like that.  If there's a way to do it in Markdown, you can probably do the same thing with Typst with just a different character.  It works fine

## Formatting

The thing that made Typst initially compelling is the custom formatting options. 

Typst appears to give formatting options with grids and lets you nest recursive stuff.  I've heard that [ConTeXt](https://en.wikipedia.org/wiki/ConTeXt) gives you that stuff but I couldn't be bothered to learn it. Don't know why I'm bringing it up really, forget I said anything. 

Suppose you need a title page for your document.  I can be done pretty easily like this: 

```typst
#set page(header: none, footer: none)
#align(horizon + center)[
  #text(size: 24pt)[Typst Test]
  #text(size: 18pt)[Thomas Gebert]
  #text(size: 14pt)[June 2025]
]
#pagebreak()
```

Fairly straightforward.  If you then want to do something like multi-columns, you can then do something like this: 

```typst
#set page(columns: 2, height: 150pt)

Right. Marty, will we ever see you again? Well, aren't you going up to the lake tonight, you've been planning it for two weeks.
```
(Text provided by [Delorean Ipsum](https://satoristudio.net/delorean-ipsum/)

As you can see, pretty easy, and declarative.  


## Compilation Speed


All of this is good, but does it solve my biggest issue, the compilation time? 

Short answer: Yes. *Yes*.  It solves it. 

Most documents render so quickly that you can consider it "effectively instant", whichis extremely bizarre if you're used to TeX.  The first time I ran the compilation I genuinely thought I did something wrong because it didn't seem possible to get a PDF that fast. 

And these are *from scratch* renders.  Another feature Typst has over LaTeX is incremental compilation, which is even faster and is amazing. 


I wanted to quantify how much faster Typst is over LaTeX, so I came up with a benchmark with two roughly equivalent documents, compiled on my laptop. 

Here's the LaTeX document: 

```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{pgffor}
\usepackage[margin=1in]{geometry}

\begin{document}

\foreach \i in {0,...,99999} {
  \[
    \sum_{k=300}^{n} k = \frac{4 \cdot \i \cdot \left( \frac{n(n+1)}{2} \right) \cdot (3 + 1)}{3}
  \]
}
\end{document}
```

And here's the Typst: 

```typst
#for i in range(0, 100000) [
    sum_(k=300)^n k = (4 (#i) ((n(n+1)) / 2) times (3 + 1) )/3 $
]
```

Unfortunately, LaTeX actually won't let you compile this! There's a limit to how big of a document LaTeX will let you render, and it's beyond that, and annoyingly when I got the numbers small enough then the size didn't matter that much. 

Here's the Typst numbers though: 

```zsh
[nix-shell:~/latex_bench]$ time typst compile typst.typ 
real    0m15.973s
user    0m15.082s
sys     0m1.590s
```

This document is 926 pages long and it rendered in about sixteen seconds.  I think that's pretty good already, but keep in mind, this is a from-scratch compilation, which you realistically wouldn't do very often, because you can use incremental compilation for most things. 

# Conclusion

I will probably be revisiting the topic of Typst in future posts.  I just wanted to write down some initial thoughts. 

Typst is very cool, and I plan on using it for awhile, just to get a better feel for it. 
