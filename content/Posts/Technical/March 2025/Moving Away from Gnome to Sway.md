---
{"publish":true,"title":"Moving Away from Gnome to Sway","description":"Switching from GNOME to Sway on NixOS: config, Vim‑style modal keybindings, a custom status bar script, Wayland/GTK portal fixes, and QoL tweaks.","created":"2025-03-17T09:21:44-04:00","modified":"2026-01-29T01:17:03.940-05:00","tags":["technical"],"cssclasses":""}
---


For the last year, I've been running [NixOS](https://nixos.org/) on my primary laptop.  It appeals to the inner geekiness inside me; I can make it as bloated or as minimal or as bloated as I'd like, everything is declarative, and if I screw something up, everything is snapshotted, meaning that a lifeline is always available in the form of a "reboot and choose a previous generation". It's great. 

Since I've been running NixOS, I've been using the Gnome desktop.  

People have been [unjustifiably harsh](https://www.zdnet.com/article/linus-torvalds-finds-gnome-3-4-to-be-a-total-user-experience-design-failure/) on Gnome since Gnome 3 was released, but I think most of those people didn't give it a chance.  If you take the time to properly learn *what* they were going for, it's actually a pretty nice desktop. It's reasonably keyboard *and* touchscreen friendly, the latest versions are actually pretty fast, and it just looks nice. Seriously, if you haven't touched Gnome in awhile, try it out, *give it a chance*.  Don't just get frustrated in the first five minutes and give up, actually try and *learn* how to use it and you might be surprised. 

So why am I ditching it? Partly just for fun, but also because I've become a bit interested in hyper-keyboard-focused GUIs. Gnome is decent with the keyboard, but I still *sometimes* have to use the mouse.  Of course, this isn't really a "problem"; the touchpad is there to be used, you might as well use it, but a small part of me always resents when I have to lift my hands off the keyboard. I'm a Vim guy, I live and breath in "insert" and "normal" modes and I will do *everything* with the keyboard if given the option. 

So some of the tiling window managers have started to become appealing to me again. 

# Tiling Window Managers

The main gimmick with tiling window managers is that windows don't overlap.  Windows appear side by size, or above and below each other, in a tiling fashion. This makes it easier to use the keyboard to navigate around precisely, and they tend to eschew most things like "borders" and "decorators" or anything like that. Tiling window managers tend to be very light, taking almost no memory or CPU, and wholly embrace the use of the keyboard.  They aren't as pretty as something like Gnome or KDE, but they generally have a pretty sleek and minimalistic look to them. 

![[Attachments/tiling_example.png]]


Tiling managers have been around for quite awhile.  I used to run the [Xmonad](https://xmonad.org/) for about a year, before I bought a Macbook in 2020, and I actually liked it a lot.  It was obscenely lightweight, easy to configure, and ridiculously keyboard friendly. I have also run [AwesomeWM](https://awesomewm.org/) and [i3](https://i3wm.org/) in the past, and I similarly liked them for the same reasons.  


All the above mentioned window managers are directly coupled to [X](https://en.wikipedia.org/wiki/X_Window_System), which makes sense, but most modern Linux distros have finally embraced [Wayland](https://en.wikipedia.org/wiki/Wayland_(protocol)), meaning that you cannot easily run most of these window managers on your modern distro, at least if you want to take advantage of the newer features. 

# Sway

[Sway](https://swaywm.org/) is a more recently tiling window manager that more-or-less serves as a direct port of i3 to Wayland. It is broadly compatible with i3 configurations, as well as adding a lot of its own, and receives regular updates and is directly supported in NixOS.  

I've had a friend peer-pressuring me to use Sway for months, and I finally gave in. 


Installing Sway was pretty easy on NixOS.  Just add this snippet to your `configuration.nix`. 

```nix
  programs.sway = {
    enable = true;
    wrapperFeatures.gtk = true;
  };
```

I also personally use the [Gnome Display Manager](https://en.wikipedia.org/wiki/GNOME_Display_Manager) (mostly known as GDM) to launch it: 

```nix
    services.xserver.displayManager.gdm.enable = true;
```

Don't worry, it's not actually using `xserver`.  It's under that category for legacy reasons. 

I commented out all the Gnome configs I had before, then I rebuilt with `sudo nixos-rebuild switch`, and rebooted. 

After I logged in, I was greeted with a blank Sway session.  It looked like nothing, almost like something was broken; there wasn't a title bar or anything, but my mouse was moving.  

Fortunately, you can simply do `Windows-Enter` to fire up a terminal, and I started editing `~/.config/sway/config`


# Using Modes 

As mentioned, I'm a big Vim fan, and I really like [modal editing](https://en.wikipedia.org/wiki/Vim_(text_editor)#Modes). It has a bit of a learning curve, but once it clicked for me, I really appreciated not having to constantly reach for modifier keys, and I appreciated how many keystrokes became easier to reach as a result. As such, I added this configuration immediately. 


```
set $mod Mod4

input * {
    xkb_options "lv3:ralt_alt,caps:escape"
}

mode "vim-nav" {
    bindsym h focus left
    bindsym j focus down
    bindsym k focus up
    bindsym l focus right

    bindsym Shift+h move left
    bindsym Shift+j move down
    bindsym Shift+k move up
    bindsym Shift+l move right
    bindsym f exec nautilus

    bindsym 1 workspace 1
    bindsym 2 workspace 2
    bindsym 3 workspace 3
    bindsym 4 workspace 4
    bindsym 5 workspace 5
    bindsym 6 workspace 6
    bindsym 7 workspace 7
    bindsym 8 workspace 8
    bindsym 9 workspace 9
    bindsym 0 workspace 10
    bindsym Shift+1 move container to workspace 1
    bindsym Shift+2 move container to workspace 2
    bindsym Shift+3 move container to workspace 3
    bindsym Shift+4 move container to workspace 4
    bindsym Shift+5 move container to workspace 5
    bindsym Shift+6 move container to workspace 6
    bindsym Shift+7 move container to workspace 7
    bindsym Shift+8 move container to workspace 8
    bindsym Shift+9 move container to workspace 9
    bindsym Shift+0 move container to workspace 10

    bindsym c exec sway-new-workspace

    bindsym Print exec grim - | tee ~/Pictures/screenshot-$(date +%s).png | wl-copy --type image/png
    
    bindsym d exec wofi --show drun
    bindsym o focus next
    bindsym Shift+o focus prev


    bindsym p workspace next
    bindsym n workspace prev

    bindsym q kill
    bindsym Return exec foot

    # Exit vim-nav mode
    bindsym Escape mode "default"
}

bindsym Alt_R mode "vim-nav"
```

So this is pretty cool, and shows how powerful Sway can be.  I created a `vim-nav` mode, that can be "entered". I have almost never used the right Alt key in my entire life, but it is relatively easy to reach with my right thumb, so it was a logical choice to map to be used as an "enter my special mode" key. From there, I am using Vim-style navigation.  I use `h`, `j`, `k`, and `l` to move around between windows.  I also use the `tmux` style of `p` and `n` to navigate across workspaces.  

Also, being a Vim user, I of course have to set the Caps Lock to Escape. I'm too used to that, I'm not changing. 

You might notice a command `sway-new-workspace`, which isn't a normal sway command.  That's a custom script I had to write in order to "jump to the first unused workspace", kind of like `prefix-c` in `tmux`. I made it by adding this to my `environment.systemPackages` in my NixOS config. 


```nix
    (writeShellScriptBin "sway-new-workspace" ''
      used=$(swaymsg -t get_workspaces | jq '.[].num')
      for i in $(seq 1 20); do
        if ! echo "$used" | grep -q "^$i$"; then
          swaymsg workspace number $i
          exit
        fi
      done
    '')
```

A few quality of life things that I added as well:

# Quality of Life Fixes

## Slow File Manager Launch

When I was trying to get [Nautilus](https://en.wikipedia.org/wiki/GNOME_Files) or [Thunar](https://en.wikipedia.org/wiki/Thunar) to launch, it would take upwards of an entire minute to launch.  

Apparently this was an issue with thumbnails and something to do with GTK portals that I don't really understand.  I ended up just brute-forcing with guessing and checking and ChatGPT, and I eventually fixed it with this in my NixOS config: 

```nix
xdg.portal = {
  enable = true;
  config.common.default = "gtk";
  extraPortals = [ pkgs.xdg-desktop-portal-gtk ];
};
```
I also had to add `xfce.tumbler`, `dbus`, `gvfs` to my system packages. 

I also had to create a file in ` ~/.config/systemd/user/xdg-desktop-portal-gtk.service.d/override.conf`

```toml
[Unit]
After=graphical-session.target
Requires=graphical-session.target

[Service]
Environment=WAYLAND_DISPLAY=wayland-1
```

After a rebuild *and* a reboot, this fixed it. 

## Moving the Title Bar to the Top: 

Matter of preference, but I prefer to have the title bar at the top instead of the bottom.  The `status_command` thing will be described later. 
```
bar {
    position top
    status_command sway-status
}
```

## Get Rid of Title Bars

Part of the appeal of a tiling window manager to me is getting back a lot more real estate from removing superfluous crap from the display.  For some reason, Sway still gives you title bars by default, but they're easy enough to remove: 

```
default_border none
default_floating_border none
for_window [class=".*"] border pixel 1
```

I still keep a border of 1 pixel, just to make sure windows have a clear delimiter, but it doesn't take much space. 

## Nice Status Bar


One thing that is a little annoying but expected from a hyper-minimal desktop is that it doesn't come with the bells and whistles that you get from the "full" desktops like Gnome.  One of those things is information in the title bar, like battery status or a clock or Wi-Fi connectivity. 

I had to add another custom program in my `environment.systemPackages`: 


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

Obviously you can change the emojis if you don't like them, but I think that they're useful for quickly communicating a status without a lot of room.  This will also give us a nice little clock on the bar. If you're ok with more of a lag, you can of course adjust the `sleep 2` to any number you want.  These are pretty cheap operations so you could honestly get away with even every second. 

## Laptop Niceties

If you're using a laptop like I am, it's nice to be able to use the keyboard brightness and volume controls.  This was surprisingly pretty easy: 

```
# Volume 
bindsym XF86AudioRaiseVolume exec pactl set-sink-volume @DEFAULT_SINK@ +5%
bindsym XF86AudioLowerVolume exec pactl set-sink-volume @DEFAULT_SINK@ -5%
bindsym XF86AudioMute exec pactl set-sink-mute @DEFAULT_SINK@ toggle

# Brightness 
bindsym XF86MonBrightnessUp exec brightnessctl set +10%
bindsym XF86MonBrightnessDown exec brightnessctl set 10%-
```

At least on my laptop (Thinkpad P16S AMD Gen 2), this worked perfectly out of the box. 

## Removing Gaps

For some reason, and I don't know why, I kept getting gaps between windows which I found ugly.  I had to add this: 

```
gaps inner 0
gaps outer 0
smart_gaps off
```


# Conclusion

With these configs, I have grown to *really* like Sway.  It feels like I was able to get `tmux` everywhere in my desktop, which is not a bad thing.  It's worth giving it a shot. 
