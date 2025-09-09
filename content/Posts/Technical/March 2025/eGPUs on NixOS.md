---
{"publish":true,"title":"eGPUs on NixOS","created":"2025-03-09T02:21:44-04:00","modified":"2025-09-09T17:09:43.442-04:00","tags":["technical"],"cssclasses":""}
---


This will be a short one, I just wanted to stay in the habit of writing regularly, and I also wanted to document my work to get an Nvidia GPU working on NixOS with an eGPU case. 


# eGPUs

To those who don't know, the Thunderbolt port built into most newer laptops is ridiculously fast.  The theoretical maximum speed is on the order of 40 gigabits per second, which is rivaling internal bus speeds of computer. 

The Thunderbolt specification is also versatile enough to handle PCIe ports, and that's where the eGPU comes in.  

In a nutshell, an eGPU case is just an external PCIe port.  I've used an eGPU case to run a SAS card to read [LTO-6 tapes](https://en.wikipedia.org/wiki/Linear_Tape-Open), I've used it to install a ten gigabit SFP+ eternet card on my laptop. Surprisingly, until recently, I hadn't used it for, you know, a GPU. 

# My Problem

My main gaming machine for the last year has been the relatively cheap [Beelink SER6](https://a.co/d/iYl6qBv).  It's more or less just an old gaming laptop without a screen, but it works great.  I installed NixOS on there, and ran the JovianOS, and all has been good. Well, until two weeks ago. 

I bought the [System Shock](https://en.wikipedia.org/wiki/System_Shock_(2023_video_game)) remake, and installed it on my little gaming PC, and while it did "work", it was really choppy.  It ran at a low framerate, even when I turned down the settings. I'm not generally a graphics snob, but it was bad even for me. 

I remembered that I bought an [RTX 3060](https://a.co/d/3gQo6dV) a couple years ago to play with Stable Diffusion, but I hadn't used it for more than a year, and it's still a relatively fast card, so I figured this would be a good excuse to actually use it instead of having it lay dormant in my basement. I don't have a regular desktop PC anymore, but my SER6 does have a Thunderbolt port and I already had an eGPU case. 

# Setting up the eGPU case.  

It turns out that getting the eGPU case working was the easiest part. It's *mostly* as simple as "plug it in", but there are a few wrinkles you have to look out for.

First, I had to authorize the card to get it to even show up anywhere. This is pretty easy.  Just type: 

```
boltctl
```

This should list all the Thunderbolt devices that are plugged in.  It should have a long UUID. Copy that, and then run: 

```
boltctl autorize <INSERT ID HERE> 
```

Now, if you're lucky, then you should be able to simply type: 

```
lspci | grep VGA
```

and see the card in there.  That *didn't* work for me out of the box.  I had to run: 

```
echo 1 | sudo tee /sys/bus/pci/rescan
```

to force it to read the card. You might need to do this after every reboot, so it might be prudent to write a `systemd` service. 

I also had to do a bit of extra stuff to make sure that modules loaded in the correct order (I think). 

```nix
  boot.blacklistedKernelModules = [
    "nouveau"
    "nvidiafb"
  

  ];
  boot.initrd.kernelModules = [ "thunderbolt" "usbhid" "joydev" "xpad" "nvidia"];

  boot.kernelModules = [
    "thunderbolt"
    "usbhid"
    "joydev"
    "xpad"
    "nvidia"
    "nvidia_modeset"
    "nvidia_uvm"
    "nvidia_drm"
    "amdgpu"
  ];
```

After that, it was able to read the case just fine.  The next step is installing the driver.  NixOS makes this relatively easy: 

```nix
  services.xserver.videoDrivers = ["nvidia"];
  hardware.nvidia = {

    modesetting.enable = true;
    powerManagement.enable = false;

    powerManagement.finegrained = false;

    open = false;
    nvidiaSettings = true;
    package = config.boot.kernelPackages.nvidiaPackages.stable;
  };

```

(Copied from the [NixOS Wiki](https://nixos.wiki/wiki/Nvidia))

Once you have all that, you can just do `sudo nixos-rebuild switch` and reboot.

# Now What? 

This installed, and by some definitions of the word it "worked".  I was able to boot into Gnome and that worked perfectly fine.  I was also able to get System Shock playing at a nice framerate.  

So what's the problem? Well, if you play with the desktop Steam client, you're done.  Enjoy, everything should work about as well as you'd hope it does. 

However, this computer is basically a game console for me.  I like having it boot into the Gamescope Big Picture Mode because I generaly play this in my bed.  

When I booted into Big Picture Mode, it was this horrible glitchy mess. I'd get random flashing, the screen wouldn't update, the menus wouldn't pop up.  It was completely useless.  

I had to spend an entire weekend to fix that, but the solution was pretty simple: you need to use the `latest` Nvidia driver, which at the time of this writing is slightly broken in NixOS.  I changed the Nvidia stanza to look like this: 

```nix
hardware.nvidia = {
    modesetting.enable = true;
    powerManagement.enable = false;
    powerManagement.finegrained = false;
    forceFullCompositionPipeline = true;
    open = false;
    package = pkgs.linuxPackages_latest.nvidiaPackages.beta.overrideAttrs
      (old: {
        nativeBuildInputs = (old.nativeBuildInputs or [ ])
          ++ [ pkgs.pkg-config ];
      });
    prime = {
      sync.enable = true;
      offload.enable = false;
      offload.enableOffloadCmd = false;
      amdgpuBusId = "PCI:229:0:0";
      allowExternalGpu = true;
      nvidiaBusId = "PCI:7:0:0";
    };
  };
```

I also had to make sure I was using the latest Linux kernel:

```
boot.kernelPackages = pkgs.linuxPackages_latest;
```

Rebuild one more time, and the Big Picture Interface works!  Well, mostly.  In my case it's still a bit glitchy, but it's useable. 

# Conclusion

Anyway, pretty short post.  [Here](https://gist.github.com/Tombert/a6ad8502d2460eade343e95265abea87) is the full NixOS config if you think I missed anything.  
