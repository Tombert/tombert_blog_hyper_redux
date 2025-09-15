---
{"publish":true,"title":"Making a Shitty 'Search Engine' in Hugo","created":"2025-03-11T03:21:44-04:00","modified":"2025-09-14T22:42:31.706-04:00","tags":["technical"],"cssclasses":""}
---


> UPDATE: In perhaps the fasted "I wrote something and *then* decided to do it entirely differently" in history, I have updated the search to use Lunr.js.  I think this post still has some value just due to how simple it is, but [[Posts/Technical/March 2025/Adding a Less Shitty Search Engine to Hugo with Lunr.js\|here]] is the follow up. 

I hate web programming. 

I mean, I kind of love it too, it's how I got started in software engineering in 2012.  There was a huge shortage of software engineers and I was able to find work in making websites, but around 2014 I moved exclusively to backend web programming, and by 2015, I completely removed myself from the web, instead focusing entirely on distributed systems work. 

This isn't to discount web programming as a profession; it's a useful skill and I'm glad people are good at it. I just never enjoyed it.  I'm not terribly good at or concerned with making websites look nice or function well, and JavaScript moves so quickly now that it's hard to play a game of catchup even if I wanted to. 

However, I found myself needing to solve a problem that required doing a bit of frontend JavaScript, and I figured I'd write about it.  It might even be useful for people. 

# Hugo

I use the [Hugo](https://gohugo.io/) static site generator for this blog. To those that are unaware, a static site generator is exactly what it sounds like: It's a framework that easily generates plain HTML, CSS, and JavaScript, without a sophisticated backend. The HTML it generates is then able to be copied onto a server and served directly with basically any software that can serve static files. Hugo is a fast and relatively popular one, but there are a bunch out there like [Jekyll](https://jekyllrb.com/) or [Pelican](https://getpelican.com/)

There's two reasons why this is desirable.  First, if you're not doing anything interactive in the backend, it is dirt cheap to serve static files with Nginx. I haven't done benchmarking, but I suspect it is several orders of magnitude faster to serve a static site than writing something equivalent with something like WordPress. 

The more important reason, though, is that if your site doesn't strictly *need* a backend, then removing the backeng gives you a much simpler setup.  You're not mucking with databases, or runtime errors, and due to the ubiquity of serving static files with Nginx, the tools for it are extremely simple to use and stable. 

However, a lack of a backend can make some stuff a annoying that would be comparatively simple with a traditional backend server, and most relevant to this article, one of these features is search. 

Search, of course, is actually a really complicated problem even if you have a backend (there's a reason no one has dethroned Google yet).  There are tons of software packages like [Apache Solr](https://solr.apache.org/) which can give you fairly sophisticated tools, and it's what I would recommend if you're trying to add a "real" search engine to your site, but that comes with the expense of having to manage a separate server, which would kind of eliminate part of the appeal of using Hugo for this blog. 

I realized, though, that I don't really need a "real" search engine.  I don't have *that* many articles, and even if I added a lot more it's still not *that* expensive to loop through them all in a dumb linear search. I also don't need the advanced features like [Stemming](https://en.wikipedia.org/wiki/Stemming) or fancy indexes; a dumb text search should be good enough for people to find what they're looking for.  I also think that if I keep it dumb, it can all be done entirely client-side. 

After I noticed this, I realized that this is something I could write myself, relatively quickly, so I might as well write a quick blog post about this to generate some content out of my work. 

# Getting The Data

First things first, we cannot do any kind of searches without some way to get the content of the articles. Fortunately, Hugo makes it relatively easy to  add custom pages, including JSON generation. 


I added this page to `layouts/index.json.json`.  Notice I added `.json` in there twice.  That's not a mistake. 

```
{{- /* layouts/index.json.json */ -}}
[
  {{- $pages := where .Site.Pages "Kind" "in" (slice "page" "section") -}}
  {{- range $i, $page := $pages -}}
    {{- if $i }},{{ end -}}
    {
      "title": {{ $page.Title | jsonify }},
      "url": {{ $page.RelPermalink | jsonify }},
      "summary": {{ $page.Summary | plainify | jsonify }},
      "content": {{ $page.Plain | jsonify }},
      "date": {{ $page.Date | time.Format "2006-01-02" | jsonify }}
    }
  {{- end -}}
]

```

This is just a basic template to give us something JSON structured that can can use later.

I also had to add this snippet to my `hugo.toml`. 


```toml
[outputs]
home = [ "HTML", "JSON" ]
```

This is actually all that's required to give us the seed data.  Pretty easy isn't it? If you rebuild your Hugo site, you should be able to visit [localhost:1313/index.json](http://localhost:1313/index.json) and see the JSON dump. 

# Making The Search

After this, we need to make the actual search page.  

I added the file `content/page/search.md`.  Yes, we're still doing this in Markdown.  Is that a good idea? I don't know, but it works and it's easy, and it gives you some formatting for free. 

I personally wanted to make sure that there was a way to get to the page before I did anything else so I added this my `hugo.toml`: 


```toml
  [[menu.main]]
    pageRef="search"
    name = 'Search'
    url = '/search/'
    weight = 30
```

Ok, so this is the contents of `search.md`. 

```markdown
---
title: Search
---

<script> 
   function doSearch() {
       const inputValue = document.querySelector("#searchbar").value;
       if (inputValue != null && inputValue != ""){
         fetch("/index.json")
         .then(res => res.json())
         .then(data => {
            console.log(data);
	    const container = document.querySelector("#results");
	    container.innerHTML = ""; 
            var filteredRes = data.forEach(function (i)  {
	       var doesContainValue = i.summary != null && (i.title.toLowerCase().indexOf(inputValue.toLowerCase()) != -1 || i.summary.toLowerCase().indexOf(inputValue.toLowerCase()) != -1  || i.content.toLowerCase().indexOf(inputValue.toLowerCase()) != -1);
	       if (doesContainValue) {

                  const div = document.createElement("div");
                  div.setAttribute("style", "display: flex; justify-content: space-between; padding: 4px 0;");

                  const a = document.createElement("a");
                  a.textContent = i.title;
                  a.setAttribute("href", i.url);
                  a.setAttribute("style", "color: #4ea1f3; text-decoration: none;");

                  const date = document.createElement("span");
                  date.textContent = i.date;
                  date.setAttribute("style", "color: #aaa; font-size: 0.9em;");

                  div.appendChild(a);
                  div.appendChild(date);
                  container.appendChild(div); 
	       }
            });
         })
         .catch(err => console.error("Fetch failed:", err));
     }
}
</script>

<input type="text" name="search" placeholder="Search For Posts" id="searchbar" />  <button onClick="doSearch()"> Submit </button>

<div aria-label="Content" id="results">
    
</article>
```

It's pretty straightforward.  Markdown lets you insert custom HTML pretty much anywhere, so I did exactly that. The bottom is a pretty straightforward template for a search bar and a place to dump the results. 

The slightly more interesting part is the JavaScript function: 

```javascript
   function doSearch() {
       const inputValue = document.querySelector("#searchbar").value;
       if (inputValue != null && inputValue != ""){
         fetch("/index.json")
         .then(res => res.json())
         .then(data => {
            console.log(data);
	    const container = document.querySelector("#results");
	    container.innerHTML = ""; 
            var filteredRes = data.forEach(function (i)  {
	       var doesContainValue = i.summary != null && (i.title.toLowerCase().indexOf(inputValue.toLowerCase()) != -1 || i.summary.toLowerCase().indexOf(inputValue.toLowerCase()) != -1  || i.content.toLowerCase().indexOf(inputValue.toLowerCase()) != -1);
	       if (doesContainValue) {

                  const div = document.createElement("div");
                  div.setAttribute("style", "display: flex; justify-content: space-between; padding: 4px 0;");

                  const a = document.createElement("a");
                  a.textContent = i.title;
                  a.setAttribute("href", i.url);
                  a.setAttribute("style", "color: #4ea1f3; text-decoration: none;");

                  const date = document.createElement("span");
                  date.textContent = i.date;
                  date.setAttribute("style", "color: #aaa; font-size: 0.9em;");

                  div.appendChild(a);
                  div.appendChild(date);
                  container.appendChild(div); 
	       }
            });
         })
         .catch(err => console.error("Fetch failed:", err));
     }
}
```

The "algorithm", if you want to call it that, is just a straightforward [Linear Search](https://en.wikipedia.org/wiki/Linear_search).  I fetch the JSON blob that we created.  I loop through each post, and check the summary and contents.  

For each item, I check to see if the search term is inside either the summary or the contents, and if it is, I simply append the results to the template on the bottom.  I do the `toLowerCase()` function in order to make it case-insensitive, but otherwise it's looking for an exact match for any substring inside my articles. 


# Conclusion

Is this the best searching system? No, not really.  It's linear ($O(n)$), meaning it will progressively get slower as I add more posts, and it requires exact matches for everything which could make searches more difficult. Honestly, I don't really think the performance matters *that* much in this case.  This isn't gigs of textual data, it's a static blog written by one person, meaning that we're talking milliseconds of overhead and maybe a couple megs of data (As of this writing, the entire size of all my posts is `180k`). 

Still, eventually I would like to use a "real" search tool for this.  I've heard that [Lunr.js](https://lunrjs.com/) is pretty cool, and I certainly have no objections to using it in the future.  I just wanted something simple to start. 

I might do a sequel to this post, where I use a more "real" search engine, just for fun. Is it "necessary"? Of course not, but when has that ever stopped me? Still, I think even a stupid one like this has some value. 

Hopefully you enjoyed this article, and please don't hesitate to let me know if you get anything out of it. 

