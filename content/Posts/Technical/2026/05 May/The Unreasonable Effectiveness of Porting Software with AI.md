---
{"publish":true,"title":"The Unreasonable Effectiveness of Porting Software with AI","created":"2026-05-17T06:22:44-04:00","modified":"2026-05-17T13:50:24.470-04:00","tags":["technical"],"cssclasses":""}
---


I saw a post about someone porting the old [3D Movie Maker](https://en.wikipedia.org/wiki/3D_Movie_Maker) software to [Linux](https://benstoneonline.com/posts/porting-3d-movie-maker-to-linux/).  I used to love playing with 3DMM as a kid, and I was excited to be able to easily play it on Linux, so I cloned the repository, compiled it, and indeed did have considerable fun remaking 12-year-old-Tombert's masterpiece "Fatso Man and Tarzan Baby". I expect the Academy will be knocking on my door any minute and I can quit this sham of a "software" career. 

However, immediately after that excitement I also realized that there's no reason that it *has* to be specifically ported to every platform.  [WebAssembly](https://webassembly.org/) has gotten become fairly performant, and more importantly, it's portable on basically every platform now as well.  Instead of manually writing a port of every game to every platform, why not outsource this task to the browser makers, especially for twenty-five year old software that doesn't need 2026 CPU speeds?

I have basically no life and I seemingly never leave my house anymore, so I fired up Claude, and asked it to port the game to WebAssembly with [Emscripten](https://emscripten.org/).  After about an hour of back and forth, I eventually got it working, and now [3D Movie Maker is available to be played in the browser](https://3dmmex.pages.dev/).  

I was blown away at how well it worked, and with so little effort, but it shouldn't be *that* surprising. The [Transformer](https://en.wikipedia.org/wiki/Transformer_(deep_learning)) was actually devised specifically for the use of translation, and while natural language is different from software, it still has enough overlap to make sense. 

After that, I wanted to know what else I could port, so I decided to try another open source game that I liked: [Abuse](https://en.wikipedia.org/wiki/Abuse_(video_game)).   It was roughly the same process: I cloned the repository, spent about an hour with Claude, and then [deployed it to Cloudflare Pages](https://abuse-wasm.pages.dev/). 

Now I'm hooked; I want to take basically every game I can get the source for and get Claude to make it work within WebAssembly, and that has been eating my entire weekend. 


------

Short one today, I just thought it was pretty cool and wanted to share. I am working on a bigger project that I will write about soon enough, but I wanted to get something else out there that I thought was interesting. 