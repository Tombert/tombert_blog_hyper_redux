---
{"publish":true,"title":"My Complicated Feelings Around Haskell","created":"2026-10-07T11:22:44-04:00","modified":"2026-10-08T17:40:39.542-04:00","published":"2026-10-07T11:22:44-04:00","tags":["technical"],"cssclasses":"","date":"2026-10-07T11:22:44-04:00","draft":false,"math":false,"displayMode":false,"\n```haskell\ndata Person  = Person  { name ":"String, age :: Int }","data Company = Company { name ":"String, employees :: [Person] }","\ngreet ":"Person -> String","greet p = \"Hi, \" <> p.name\n\nlabel ":"Company -> String","label c = c.name\n```\n\nThis is much better, though despite me knowing this, I am actually still doing it the Lens way, because Lens itself gives you a lot of niceties with regards to composition and the like. \n\n```haskell\n{-# LANGUAGE TemplateHaskell, FunctionalDependencies, FlexibleInstances #-}\n\nimport Control.Lens\n\ndata Contact = Email String | Phone String deriving Show\n\ndata Person  = Person  { _personName ":"String, _personContact :: Contact } deriving Show","data Company = Company { _companyName ":"String, _companyStaff :: [Person] } deriving Show","\nmakePrisms ''Contact   -- _Email, _Phone\nmakeFields ''Person    -- name, contact\nmakeFields ''Company   -- name (shared), staff\n\nacme ":"Company","acme = Company \"Acme\" [Person \"Alice\" (Email \"alice@acme.com\"), Person \"Bob\" (Phone \"555-0100\")]\n\nmain ":"IO ()","\n```haskell\nchunkedG ":"Monad m => Int -> Producer a m r -> Producer [a] m r"}
---


A few weeks ago I built [a thing to index my filesystem to search within files](https://git.brucewillis.sexy/~tombert/fs_index) in Rust.  

Rust is a language that I'm  a little surprised I like; my career has been pretty removed from the "systems" work, and I've grown very dependent on garbage collection as a concept.  I've written enough C to be dangerous, and generally I have hated managing memory, particularly for anything involving multiple threads. 

But surprisingly, Rust makes this process pretty transparent, even for things that *feel* high-level, like Node.js-style concurrency in [Tokio](https://tokio.rs/), and it's *fun* to write fast, high-performance code as a result. The borrow-checker handles a large percentage of footguns that you get involving memory, and while it can be a little irritating to handle the weirdness with Pinning and Traits, it's generally pretty fun. 

Rust is unique for another reason, in that it is a successful industry-friendly language that is also being [thoroughly studied in academia](https://plv.mpi-sws.org/rustbelt/popl18/), which got my thinking of *the* academic programming language: Haskell. 

Haskell was actually one of the first programming languages I learned, or rather it was on of the first languages that I *started* learning.   I've always been a big math dork and heard about Haskell pretty early on, and even as a teenager I did get some programs compiling, but I didn't really "learn" it.  I didn't really understand typeclasses or monads or applicatives or any of the shit that makes Haskell the go-to academic programming programming language, but I stuck with it and more or less "know" it now. 

I hadn't touched Haskell in a number of years, and I have been curious to try it out again, so I decided to port over my [filesystem indexer to Haskell](https://git.brucewillis.sexy/~tombert/indexer_hs).  I wanted to see how much the language changed. 

# Build Environment

One of the primary reason I stopped writing Haskell years ago came out of how much I actively disliked the [`cabal` build system](https://stackoverflow.com/questions/50925938/what-is-cabal-hell).  I still have nightmares about wasting two days dealing with weird dependency errors I didn't (and still don't) really understand, with a manager who refused to help me. 

There is a lot of opaque weirdness with Cabal's build system.  Dependencies will depend on very specific versions of GHC and very specific versions of libraries, which might conflict with other libraries you have, with limited ability to work around it.  I would always end up having to do a bunch of bullshit to work around it and it never felt good in the process. 

About a year after I was laid off from that job, FP Complete released the [Stack](https://docs.haskellstack.org/en/stable/) build software.  This still used Cabal under the covers, but it at least locked in dependency versions and GHC builds so there was a lot less of the "Cabal Hell" that we were used to.  

Stack certainly helped a lot, but it was a bit after my time and I hadn't used it much.  Admittedly the fact that it still used Cabal was ultimately a turn-off.  

I am a big fan of [[eGPUs on NixOS|NixOS]], and have been using it as my primary operating system for several years now, so I was delighted to find that it's relatively straightforward to do the [entire build in a Nix Flake](https://git.brucewillis.sexy/~tombert/indexer_hs/tree/master/item/flake.nix), and this is *so much better*.  Seriously, I have no desire to ever go back to a bunch of bullshit YAML or `.cabal` files that I don't really understand.  


# Language Annoyances

I've become a lot more educated with type systems and category theory, and now I more or less "get" Haskell, only to realize that *I do not have fun writing the language*.  It's not that it's "too hard" for me now, I just genuinely think that the platform itself is poorly designed. 

For example, isn't it kind of weird that strings are so broken that pretty much every project begins with `{-# LANGUAGE OverloadedStrings #-}` to load a compiler extension?  If we can all agree that they're broken then why not, you know, *fix it permanently*. 

This is a recurring pattern; instead of fixing the language/platform, they put the onus onto everyone to load in a bunch of compiler compiler extensions at the beginning. This is at the beginning of the filesystem indexing stuff.  

![[Attachments/Pasted image 20261008143809.png]]

This is annoying, but I suppose that it's at least not "difficult", so I can put up with.  

This at least fixed one of my biggest complaints with Haskell, which is its [inability to have two objects with the same name](https://stackoverflow.com/questions/17478599/name-conflicts-in-haskell-records).  Previously, you would have to do a workaround with Template Haskell and Lens, but it led to all your objects looking like `data Thing = Thing {_thingName :: Int}`.  This would then allow you to select objects like `myThing ^. name` which admittedly has always worked fine for me but also always felt a little hackey. 

Nowadays all you have to do is put `{-# LANGUAGE DuplicateRecordFields, OverloadedRecordDot, NoFieldSelectors #-}` at the top of your file, and you get a pretty familiar `.` notation that pretty much every other language has: 

```haskell
data Person  = Person  { name :: String, age :: Int }
data Company = Company { name :: String, employees :: [Person] }

greet :: Person -> String
greet p = "Hi, " <> p.name

label :: Company -> String
label c = c.name
```

This is much better, though despite me knowing this, I am actually still doing it the Lens way, because Lens itself gives you a lot of niceties with regards to composition and the like. 

```haskell
{-# LANGUAGE TemplateHaskell, FunctionalDependencies, FlexibleInstances #-}

import Control.Lens

data Contact = Email String | Phone String deriving Show

data Person  = Person  { _personName :: String, _personContact :: Contact } deriving Show
data Company = Company { _companyName :: String, _companyStaff :: [Person] } deriving Show

makePrisms ''Contact   -- _Email, _Phone
makeFields ''Person    -- name, contact
makeFields ''Company   -- name (shared), staff

acme :: Company
acme = Company "Acme" [Person "Alice" (Email "alice@acme.com"), Person "Bob" (Phone "555-0100")]

main :: IO ()
main = do
  print (acme ^. name)                                  -- "Acme"
  print (acme ^.. staff . traverse . name)              -- ["Alice","Bob"]
  print (acme ^.. staff . traverse . contact . _Email)  -- ["alice@acme.com"]
  print (acme & staff . traverse . contact . _Phone .~ "redacted")
```

(forgive me for using Claude to generate this example, I didn't feel like writing something this simple from scratch) 

Isn't this kind of neat? We effectively have abstracted the entire concept of *accessing shit*, and by doing that we can *compose*  access.  This also allows us to do stuff like `_Email`, enables to unpack Algebraic Data Types in a point-free sense instead of having to do annoying `case` unpacking.   You can read through this in the famous [Lens tutorial](https://hackage.haskell.org/package/lens-tutorial-1.0.5/docs/Control-Lens-Tutorial.html) if you want to know more, but suffice to say I like them. 

![[Attachments/Pasted image 20261008155050.png]]



This is what makes me have a bit of hatred but also an annoying amount of begrudging respect for the language.  A lot of the time Haskell will be objectively broken, and the community figures out a way to fix it in a way that was *better* than the way that they would have done it before. 

This is true of a lot of things; I bitched about `OverloadedStrings` earlier, but I have to admit that what it does it *kind of cool*; by using it we can transparently use different types of strings depending on what the project calls for (e.g. either a `ByteString` or the default linked list).  Dunno, maybe I should just learn to appreciate and embrace the compiler extensions. 

# Streaming


Haskell's default ["Lazy IO" ](https://stackoverflow.com/questions/5892653/whats-so-bad-about-lazy-i-o) is considered evil, for good reasons.  I'm sure there are engineering reasons as to why it's like this, but for example it will do things like close a file before it's even opened it due to the weirdness of Haskell's lazy evaluation. 

I had heard that the [Pipes](https://github.com/Gabriella439/pipes) was the streaming library for the true math geeks out there, and effectively what streaming on Haskell was "supposed to be", and it looked neat enough, so I gave it a shot. 


Pipes feels a *lot* like the Clojure [Transducers](https://clojure.org/reference/transducers), to a point where I think one might have inspired the other (but I can't be bothered to look).   Like Transducers, Pipes is very big on the "define processors in a way that doesn't necessarily care about upstream or downstream data".  In practice, this ends up feeling not entirely dissimilar to stuff like Apache Spark or any other MapReduce framework, especially since most of the time you're still using the normal tried-and-true [Prelude functions](https://hackage.haskell.org/package/pipes-4.3.16/docs/Pipes-Prelude.html), and only bother doing the "Pipey" thing when you have a usecase that doesn't fit.  

I will admit that reading through the tutorial was a bit intimidating, but stuff more or less clicked for me after playing around with it for awhile.  The use of custom operators in *any* library pisses me the fuck off, but fortunately with pipes you can usually just get away with `>->` to compose different processors.   

I'm still learning the best practices for when things should be put into the `Producer` and `Consumer`, since I don't find that to be obvious all the time.  For example, for what I'm doing I need to eventually batch things into chunks to send to ElasticSearch.  People on the internet have told me that this needs to be done on the `Producer` side because otherwise it doesn't handle finite streams correctly, since something in the middle of the pipeline doesn't really know anything about upstream, by design.  Given this, for example, if you had `999` elements to process in chunks of five, you'd be stuck forever with some final chunk of four elements. 

This actually is addressed with `pipes-group` partly, but I still had to write this stupid little function: 

```haskell
chunkedG :: Monad m => Int -> Producer a m r -> Producer [a] m r
chunkedG n = folds (flip (:)) [] reverse . view (chunksOf n)
```
It uses the Lens library `view` function and doing a bunch of bullshit with folding you can get the desired behavior, and it seems to work fine.  

I gotta admit, while Pipes is interesting, I'm not really enjoying using it at all.   This might just be me being dumb, but I have trouble parsing the compiler error, I have trouble figuring out what I'm allowed to actually do. Even with NeoVim integrations I am just left trying to figure out what's actually happening and how I'm supposed to compose.  

It's possible that I'll grow to like Pipes more, but right now I'm kind of wishing I had chosen the [Conduit](https://hackage.haskell.org/package/conduit) library. 

# Conclusion

I am still very conflicted with Haskell. I *want* to like it more than I do.  There's a lot of neat features and they have fixed a lot of my complaints, but I still don't really have fun writing it.  Part of it probably due to the fact that I don't really need to rewrite the indexer; the Rust version works fine and I doubt that the Haskell version will perform better. 

I probably will still finish the port just to play with the new features, and I suspect that if I do another project I'll actually start having fun writing it; I at least mostly understand the Category Theory and Type Theory stuff now, so it's much easier for me to pick up and read the documentation. I've heard that [Rhine](https://hackage.haskell.org/package/rhine) is a pretty neat library, so maybe next I'll try and make a game or something. 

------------------------------

Sorry for the kind of meandering nature of this post.   I had a few thoughts while writing Haskell, but they didn't really follow any cohesive narrative.  Such is life, I suppose. 



