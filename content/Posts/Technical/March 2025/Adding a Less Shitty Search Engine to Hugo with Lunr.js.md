---
{"publish":true,"title":"Adding a Less Shitty Search Engine to Hugo with Lunr.js","created":"2025-03-12T09:21:44-04:00","modified":"2025-09-09T20:09:31.997-04:00","tags":["technical"],"cssclasses":""}
---



Yesterday I [[Posts/Technical/March 2025/Making a Shitty 'Search Engine' in Hugo\|posted]] an article about how I added a really simple search engine to this blog. It worked well enough, but I even mentioned at the end that it was a pretty limited search tool, and I didn't like that it didn't give me any more advanced searching features, like boolean operators or [stemming](https://en.wikipedia.org/wiki/Stemming). No one reads this blog and I don't post *that* much content, so I don't really "need" any of those features, which is why I was happy enough with my simple linear-search solution.  I didn't want to do a lot of extra work to reinvent searching, especially since this blog doesn't make me any money or do anything outside of give me a place to dump my inane writing. 

But after doing a bit of research immediately after posting my article, I realized that this is a problem that has actually been more or less solved, and it didn't look like it would take very much code, so I figured I'd spend an hour on it and see if I can get anywhere. It turns out that it didn't even take that long. It was extremely easy, and now the search is much better than the shitty thing I wrote. 

So consider this post an apology and an update.  I will write it assuming you didn't read my previous post, and you should be able to start from scratch. 

# Client-Side Search

There are a lot of client side search libraries, like [Fuse.js](https://www.fusejs.io/), [Elasticlunr.js](https://github.com/weixsong/elasticlunr.js), [Flexsearch](https://github.com/nextapps-de/flexsearch), and the most supported and popular of the bunch: [Lunr.js](https://lunrjs.com/).  

I wish I could tell you that I did a lot of elaborate benchmarks and chose the objectively best option, but I did none of that. I chose Lunr.js because it was the only one I had heard of before and it didn't seem hard.  The [documentation](https://lunrjs.com/guides/getting_started.html) seemed to indicate that it would only take a few lines to get what I wanted, and fundamentally I'm very lazy. 

# Source Data

We can't do any kind of search if we don't seed it with any kind of data.  I'm sure there are more clever ways of doing this, but I found it easiest to simply get Hugo to generate a JSON file upon rendering the site.  

To do that, I needed to add a file `layouts/index.json.json`.  Note the double `.json`.  That's not a mistake, you need both. 


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

It's just a template that spits out JSON. Pretty simple. 


I also had to add a snippet to my `hugo.toml`


```toml
[outputs]
home = [ "HTML", "JSON" ]
```

# Building the Search Page

I made a file at `content/page/search.md`. It's still in Markdown, because Markdown lets you inline HTML, and then we get some formatting for free. Here's the page: 

```markdown

---
title: Search
---
<script src="https://unpkg.com/lunr/lunr.js"></script>
<script> 
  document.addEventListener('DOMContentLoaded', function () {
    const input = document.getElementById('searchbar');

    input.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        doSearch2();
      }
    });
  });
  
  
  var sourceData = null; 
  var sourceMap = {}
  var sourceIndex = null; 
  
  let doUpdate = (inputValue) => (data) => {
      const container = document.querySelector("#results");
      container.innerHTML = ""; 
      if (sourceIndex == null) {
        sourceIndex = lunr(function () {
          this.ref('url')
          this.field('content')
          this.field('url')
          this.field('title')

          data.forEach(function (doc) {
            this.add(doc)
          }, this);
        });
      }
      var res = sourceIndex.search(inputValue); 
      res.forEach(function(i) {
        var current = sourceMap[i.ref]; 
        const div = document.createElement("div");
        div.setAttribute("style", "display: flex; justify-content: space-between; padding: 4px 0;");

        const a = document.createElement("a");
        a.textContent = current.title;
        a.setAttribute("href", current.url);
        a.setAttribute("style", "color: #4ea1f3; text-decoration: none;");
        const date = document.createElement("span");
        date.textContent = current.date;
        date.setAttribute("style", "color: #aaa; font-size: 0.9em;");
        div.appendChild(a);
        div.appendChild(date);
        container.appendChild(div); 
      });
  }
  
  let doSearch2 = () => {
       const inputValue = document.querySelector("#searchbar").value;
       if (inputValue != null && inputValue != ""){
	 if (sourceData == null ) {
           fetch("/index.json")
           .then(res => res.json())
	   .then(data => {
	      sourceData = data; 
	      sourceMap = {};
	      
	      data.forEach(function(i) {
	         sourceMap[i.url] = i; 
	      });
	      return data; 
	   })
           .then(doUpdate(inputValue))
          } else {
	    doUpdate(inputValue)(sourceData); 
	  }
       }
  }
</script>

<input type="text" name="search" placeholder="Search For Posts" id="searchbar" onSubmit="doSearch2()"/>  <button onClick="doSearch2()"> Submit </button>

<div aria-label="Content" id="results">
    
</div>
```

Let's break this down.  First, we need to import the library.  I just grabbed this snippet from the Lunr.js website: 

```html
<script src="https://unpkg.com/lunr/lunr.js"></script>
```

Next, let's look at the functions. 

```javascript
  let doSearch2 = () => {
       const inputValue = document.querySelector("#searchbar").value;
       if (inputValue != null && inputValue != ""){
	 if (sourceData == null ) {
           fetch("/index.json")
           .then(res => res.json())
	   .then(data => {
	      sourceData = data; 
	      sourceMap = {};
	      
	      data.forEach(function(i) {
	         sourceMap[i.url] = i; 
	      });
	      return data; 
	   })
           .then(doUpdate(inputValue))
          } else {
	    doUpdate(inputValue)(sourceData); 
	  }
       }
  }
```

This function grabs the search value from the text input, parses the JSON, and calls the update function.  The data is unlikely to change between searches, so we memoize the data by simply adding a global variable and [checking](checking) for null. 

One annoying thing about Lunr.js is that it doesn't return the entire object when we we get a match, only a key to look things up.  As such, we need to create some kind of mapping so that we can hydrate the result later, which is why we have the `sourceMap` variable, which is also global for memoization purposes. 

Next the update function: 


```javascript
  let doUpdate = (inputValue) => (data) => {
      const container = document.querySelector("#results");
      container.innerHTML = ""; 
      if (sourceIndex == null) {
        sourceIndex = lunr(function () {
          this.ref('url')
          this.field('content')
          this.field('url')
          this.field('title')

          data.forEach(function (doc) {
            this.add(doc)
          }, this);
        });
      }
      var res = sourceIndex.search(inputValue); 
      res.forEach(function(i) {
        var current = sourceMap[i.ref]; 
        const div = document.createElement("div");
        div.setAttribute("style", "display: flex; justify-content: space-between; padding: 4px 0;");

        const a = document.createElement("a");
        a.textContent = current.title;
        a.setAttribute("href", current.url);
        a.setAttribute("style", "color: #4ea1f3; text-decoration: none;");
        const date = document.createElement("span");
        date.textContent = current.date;
        date.setAttribute("style", "color: #aaa; font-size: 0.9em;");
        div.appendChild(a);
        div.appendChild(date);
        container.appendChild(div); 
      });
  }
```

I found it easier to [curry](https://en.wikipedia.org/wiki/Currying) this function in order to be able to send it two arguments, in this case the input value so that we could use it for a single-argument callback. 

The most interesting part is right here: 

```javascript
        sourceIndex = lunr(function () {
          this.ref('url')
          this.field('content')
          this.field('url')
          this.field('title')

          data.forEach(function (doc) {
            this.add(doc)
          }, this);
        });
```

This is pretty neat.  We tell Lunr.js which values we want to index, and what we want as a reference for later. Since I think that the indexing is relatively expensive, and it's unlikely to change between calls since this site is only updated like once a day, I felt it wsa worth it to also memoize the index, again with a global variable. We can then just run:

```javascript
      var res = sourceIndex.search(inputValue); 
```

This will give us an array of potential matches with a score.  I'm not using the score (yet) but it's kind of cool to have it for later. We can use the `ref` field to look up the values in our `sourceMap` in order to get the rest of the data to display.

Afterwards is just a very dumb, straightforward HTML-appending code to insert the results. 

That's pretty much all the functional code.  You can read, and you probably don't need me to explain this much to you. 

# Linking to the Page

Finally, we need to add a reference to the page so we have a way to get to it. 

All you have to do is add this to your `hugo.toml`

```toml
  [[menu.main]]
    pageRef="search"
    name = 'Search'
    url = '/search/'
    weight = 30
```

under the `menu` section. 


# Conclusion

That wasn't hard at all! I should have started with this.  Lunr.js is pretty cool, and it has the advantage of being closer to a "real" search engine. Since it wasn't hard to add to Hugo, I think it's worth pursuing, especially if you have a lot of posts on your blog. 

That said, I don't know that it's any faster than the shitty one I wrote before. I still have to loop through the entire data to build a map for lookup later, and Lunr is likely looping through and doing something more or less akin to `toLowerCase()` behind the scenes. 

Anyway, sorry for the kind of rushed nature of this post.  I didn't really want to rewrite it after I wrote a more detailed one yesterday, but I felt it was still worth an update. 

Please don't hesitate to contact me if you know of any better ways of doing what I'm doing. 

