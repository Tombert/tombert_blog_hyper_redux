---
{"publish":true,"title":"Overengineering the Swaybar","created":"2025-03-22T09:21:44-04:00","modified":"2025-09-09T20:10:10.820-04:00","tags":["technical"],"cssclasses":""}
---


A couple days ago I posted about my [[Moving Away from Gnome to Sway \| transition to the Sway window manager]].  I am still using it, I still like it, but even in that post, I mentioned having to create some custom code to get the Swaybar to do what I want.  

For reminders, this was the code: 


```nix
(writeShellScriptBin "sway-status" ''
  while true; do
    # battery
    battery_path="/sys/class/power_supply/BAT0"
    capacity="$(cat "$battery_path/capacity" 2>/dev/null)"
    status="$(cat "$battery_path/status" 2>/dev/null)"

    if [ "$status" = "Charging" ]; then
      bat_icon="⚡"
    elif [ "$status" = "Discharging" ]; then
      bat_icon="🔋"
    else
      bat_icon="🔌"
    fi

    # wifi
    wifi_iface=$(iw dev | awk '$1=="Interface"{print $2}' | head -n1)
    if iw "$wifi_iface" link | grep -q "Connected"; then
      wifi_icon="📶"
    else
      wifi_icon="❌"
    fi

    echo "$wifi_icon | $bat_icon $capacity% | $(date '+%a %b %d %I:%M %p')"
    sleep 2 
  done
'')
```

This "worked", in the sense that it dig give me a status bar that gave me the information that I asked for, but it lacked a few things that bothered me. 

First, it's non-trivial to add click events.  I wanted to make it so that I could click on the Wi-Fi status and have it invoke `iwgtk` so that I could quickly switch networks. I did eventually figure it out using the `read` command, but it was really messy and buggy. 

It was also just getting increasingly difficult to add new features, because the bash got increasingly complicated. If you want to have custom click events or colors or anything more than plain text, you have to render out JSON, which is really annoying to do in Bash.  

But I realized something: the Swaybar is just reading `stdout`.  There's no fancy socket protocol or funny APIs you have to call, it literally is just a process that reads a stream of JSON objects, meaning that any language that can write to `stdout` and render JSON can work. 

It had been awhile since I had touched Clojure, and I was itching to do something with it again.  I knew that the JVM would have too slow of a startup time and take up too much memory, so this was also an excuse to play with [GraalVM](https://www.graalvm.org/), which I had been wanting to do for awhile.  

Doing this with a "real" language would also afford me access to virtually any library that I wanted, so with that, I spent several nights hacking together something that had already been mostly solved with Bash in twenty minutes. 

# Concurrency

One of my favorite parts of Clojure is the excellent [core.async](https://clojure.org/reference/async) library. It gives an extremely nice and sane implementation of [CSP](https://en.wikipedia.org/wiki/Communicating_sequential_processes), and works especially well with non-blocking IO.  You can generally avoid [Callback Hell](http://callbackhell.com/) by abusing the channels and `go` blocks, and I find it just downright pleasant to use. 

I wanted each module in my application to be independent and avoid blocking the other.  I also wanted to be able to have asynchronous stuff mixed and matched with my regular blocking stuff. 

This in itself isn't terribly difficult:

```clojure
(defn- maybe-start-tasks [curr-state kkey is-async is-processing ^Duration now ^Duration expire-time ^Duration ttl]
  (when (and (not is-processing) (pos? (.compareTo now expire-time)))
    (let [ ch (if is-async (fetch-data kkey) (go (fetch-data kkey))) 
          nstate (-> curr-state 
                     (assoc-in [kkey :processing] true)
                     (assoc-in [kkey :channel] ch)
                     (assoc-in [kkey :expires] (.plus now ttl))
                     (assoc-in [kkey :started] now))]
      {:ch-p ch :n1 nstate})))
```

There are two parts to this: the expiration and the asynchrony. 

While there are some operations that are fine to poll every `50ms`, there are times where you don't want that. For example, if you need to call a web API: you probably want to rate-limit it, and so we memoize the old values and don't refresh them until the time has expired. 

The async part is more interesting.  If the method is labeled with `is-async` then it is assumed to be returning a `core.async` channel. If it is not then we simply wrap the function with a `go` block, which returns a channel that carries the result of the inner expression.  

This means that we treat *all* computations as if they could be asynchronous.  My first version didn't do this, but that ended up with a lot of duplicated code, and I realized that we could consolidate this code if we upgrade all the operations into async. 


Later on, we get the value: 

```clojure
(defn- poller [ch state kkey ^Duration started ^Duration now is-async is-processing async-timeout]
  (let [res (a/poll! ch) ]
    (if res 
      (let [
            nstate (-> state
                       (assoc-in [kkey :processing] false)
                       (assoc-in [kkey :data] res)) ]
        {:poll-data res :n2 nstate}) 
      (when (and is-async is-processing)
        (let [delta (.minus now started)]
          (when (pos? (.compareTo delta async-timeout))
            (let [
                  nstate (-> state
                             (assoc-in [kkey :processing] false)
                             (assoc-in [kkey :expires] (Duration/ofNanos 0)))] 
              {:poll-data nil :n2 nstate})))))))
```


By using the `poll!` function we *do not block*.  No blocking! We simply see if a message exists, and if it does we update the state and return back the data. When possible, I try to avoid any kind of blocking APIs.  The slow things down and there's usually ways of getting around it. 

This actually has some utility; by avoiding blocking, no slow module can interrupt any others.  We will see the relevance of this later. 


# Building a Framework

In order to make this easily hackable, I abused Clojure multimethods. If you want to add a new module, you need to implement these two methods: 


```clojure
(defmulti fetch-data 
  (fn [method ]
    method))
    
(defmulti render 
  (fn [method _]
    method))
```

These do what you probably think they do: the `fetch-data` function grabs out the data that you want to display, and the `render` function gives back an object to be rendered. Here's an example for the system clock: 


```clojure
(defmethod fetch-data :date [_]
  (let [
          now (LocalDateTime/now)
          month (clojure.string/trim (str (.getMonth now)))
          day-of-week (str (.getDayOfWeek now))
          day-of-month (.getDayOfMonth now)
          year  (.getYear now)
          hour  (.getHour now)
          ssecond  (.getSecond now)
          minute  (.getMinute now)
          now (System/currentTimeMillis)
          ] 
    {
     :data {
        :month month 
        :day-of-week day-of-week 
        :day-of-month day-of-month 
        :year year 
        :hour hour 
        :second ssecond 
        :minute minute
        } }))
	

(defmethod render :date [_ date]
  (let [weekday (get day-abbrev (:day-of-week date) (:day-of-week date))
        month (get month-abbrev (:month date) (:month date))
        day (:day-of-month date)
        hour (format "%02d" (mod (:hour date) 12))
        minute (format "%02d" (:minute date))
        ampm (if ( < (:hour date) 12) "AM" "PM")
        ]
 {:out (str weekday " " 
            month  " " 
            day " " 
            hour ":" minute " " 
            ampm)}))
```

This is pretty straightforward. We fetch the data for the date using the Java API, and put that into a Clojure map under the keyword `:data`. The render function (eventually) is run and gets that same data object and then splits that out into a string under the `:out` key. 

We also need to specify it in our configuration: 

```json
{
    "poll_time": 50,
    [{
        "name": "date",
        "ttl": 0 
    }]
}
```

You can have as many modules as you'd like.  Only items that show up in the JSON will end up being shown in the bar. 

# Having Some Fun

I could go through every single line of code I wrote, but I don't think that that would be terribly productive, so lets do what everyone in 2025 is doing: needlessly add AI to it!

The main reason that I made all of this async-safe is because I wanted to be able to call web APIs without it disturbing the other items on the bar.  For example, my internet going out shouldn't ruin the clock display. To do this properly, you *need* proper asynchrony and concurrency support. 

Anyway, since now that I *do* have good concurrency support, I decided to call OpenAI on an interval of every eight minutes, and generate an inspirational quote on the top of my screen. With my cool framework, this was pretty straightforward. 


```clojure
(defn call-gpt [prompt role]
  (let [return-chan (chan)
        api-key open-ai-key
        body {:model "gpt-3.5-turbo"
              :messages [{:role "system"
                          :content role}
                         {:role "user"
                          :content prompt}]}]
    (hc/post "https://api.openai.com/v1/chat/completions"
             {:async? true
              :headers {"Authorization" (str "Bearer " api-key)
                        "Content-Type" "application/json"}
              :body (json/write-str body)
              :socket-timeout 3000
              :connect-timeout 3000} 
             (fn [resp]
               (let [
                     parsed (json/read-str (:body resp) :key-fn keyword)
                     results (get-in parsed [:choices 0 :message :content])
                     ]
                 (a/put! return-chan results)))
             (fn [err]
               (a/put! return-chan :error)
               ))
    return-chan))
    
(defmethod fetch-data :quote [_]
  (go 
    (let [
          rint (->> (quote-topics "")
                    count
                    rand-int)
          topic (get (quote-topics "") rint)
          prompt (str "Give me a unique medium-sized inspirational quote involving " topic " with an attribution to a fictional author whose name is a pun on " topic)
          role "You are a quote generator"
          quote-chan (call-gpt prompt role)
          qquote (<! quote-chan)]
          {
           :data {
                  :quote qquote
                  }})))
		  
(defmethod render :quote [_ qquote]
  {:out (str (:quote qquote))})
```

We also need to add this to our JSON: 

```
{
    "poll_time" : 50,
    "modules" : [
        {
           "async": true,
           "async_timeout": 1000,
           "name": "quote",
           "ttl": 480000,
           "color": "#EEEEEE",
           "background": "#222222"
       }
    ]
}
```

If you want to use an async function, you have to forward-declare it async, since I couldn't figure out a way to make this automatic.  Pay special attention to the `ttl`.  This is in milliseconds, and so we have it so that the quote will expire after roughly eight minutes, after which it is free to be scheduled and called again. 

And that's it!  Here's the result:

![[Attachments/sway-example.png]]

I bet you feel inspired already. 

# Conclusion. 

Did I spent too much time on this? Probably, but I don't think this is *less* productive than playing a video game or something.  

While having an AI-generated quote showing up every eight minutes isn't necessarily useful in itself, I do think this framework *could* be useful.  You could pretty easily have this poll stock data or a news aggregator or virtually anything else, and since it's in the JVM (well, GraalVM), you have access to a metric ton of libraries to play with. 

Anyway, the code is available [here](https://github.com/Tombert/swanbar) if you want to play with it. There is definitely some cleanup to be done, but I still think it's kind of cool.  
