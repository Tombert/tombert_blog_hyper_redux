---
{"publish":true,"created":"2025-09-10T00:25:39.989-04:00","modified":"2025-09-10T00:27:16.823-04:00","cssclasses":""}
---


```nix
{ config, lib, pkgs, ... }:

{
  imports = [ # Include the results of the hardware scan.
    ./hardware-configuration.nix
   
  ];


  services.acpid.enable = true;
  services.udev.packages = [

  ];
  services.udev.extraRules = ''
    ACTION=="add", SUBSYSTEM=="pci", ATTR{vendor}=="0x10de", ATTR{power/control}="on"
  '';


  # Use the systemd-boot EFI boot loader.
  boot.loader.systemd-boot.enable = true;
  boot.loader.systemd-boot.memtest86.enable = true;
  boot.loader.efi.canTouchEfiVariables = true;
  boot.kernelPackages = pkgs.linuxPackages_latest;

  boot.kernelParams = [ "usbcore.autosuspend=-1" "nvidia-drm.modeset=1" ];

  nixpkgs.config.allowUnfree = true;
  nixpkgs.config.nvidia.acceptLicense = true;

  networking.hostName = "nixoshtpc"; # Define your hostname.

  networking.networkmanager.enable =
    true; # Easiest to use and most distros use this by default.

  networking.wireless = {
    userControlled.enable = true;
    enable = false;
    networks."Cerritos_5GHz".psk = "2148859496";
    extraConfig = "ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=wheel";
    # output ends up in /run/wpa_supplicant/wpa_supplicant.conf
  };
 
  hardware.bluetooth.enable = true; # enables support for Bluetooth
  hardware.bluetooth.powerOnBoot = true;
  services.getty.autologinUser = "tombert";
  services.xserver.videoDrivers = [
    "amdgpu"

    "nvidia"
  ];

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
 

  services.blueman.enable = true;
  nix = {
    #package = pkgs.nixVersions.stable;
    extraOptions = "experimental-features = nix-command flakes";
  };
  hardware.xone.enable = true;

  services.hardware.bolt.enable = true;
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

  boot.extraModulePackages = [
    #config.boot.kernelPackages.nvidia_x11 
  ];

  # For 32 bit applications 

  #services.xserver.displayManager.gdm.enable = true; 
  #services.xserver.enable = true; 
  #services.xserver.displayManager.gdm.wayland = true;
  #services.xserver.displayManager.defaultSession = "gnome";
  #programs.steam.gamescopeSession.enable = true; 
  programs.gamescope.enable = true;
 


  systemd.services."getty@tty1".enable = true;
  #systemd.services."autovt@tty1".enable = false; 
  programs.steam = {
    enable = true;
    package = pkgs.steam.override { extraArgs = ""; };
  };




  security = { rtkit.enable = true; };
  services.pipewire = {
    enable = true;
    pulse.enable = true;
    alsa.enable = true;
    extraConfig.pipewire.noresample = {
      "context.properties" = { 
          "default.clock.allowed-rates" = [ 48000 ]; 
	  default.clock.rate = 48000;
	  default.clock.quantum = 2048;
          default.clock.min-quantum = 1024; 
       };
    };
  };
  services.pulseaudio.support32Bit = true;
  services.sunshine = {
    enable = false;
    capSysAdmin = true;
  };

  users.users.tombert = {
    isNormalUser = true;
    initialPassword = "pw123";
    extraGroups = [ "wheel" "networkmanager" ]; # Enable ‘sudo’ for the user.
    packages = with pkgs; [ tree neovim ];
  };

  # Optionally, you may want to enable OpenCL support

  #environment.loginShellInit = ''
  #sway --unsupported-gpu
  #'';

  environment.loginShellInit = ''
    [[ "$(tty)" = "/dev/tty1" ]] && [ ! -f sway ] && exec gamescope --rt --steam -- steam -tenfoot -pipewire-dmabuf
  '';
  environment.sessionVariables = {
    #__GL_VRR_ALLOWED="0"; 
    LIBVA_DRIVER_NAME = "nvidia";
    __NV_PRIME_RENDER_OFFLOAD = "1";
    __GLX_VENDOR_LIBRARY_NAME = "nvidia";
    __VK_LAYER_NV_optimus = "NVIDIA_only";
    WLR_NO_HARDWARE_CURSORS = "1"; # Fixes some cursor issues on Wayland
    VK_ICD_FILENAMES =
      "/run/opengl-driver/share/vulkan/icd.d/nvidia_icd.x86_64.json";
    WLR_RENDERER = "vulkan"; # Ensures it's using Vulkan (better for NVIDIA)
  };

  environment.systemPackages = with pkgs; [
    vim # Do not forget to add an editor to edit configuration.nix! The Nano editor is also installed by default.
    wget
    git
    sway
    foot
    linuxKernel.packages.linux_zen.xone
    chromium
    widevine-cdm
    pciutils
    neovim
    pkg-config
    gamescope
    nss
    vulkan-tools
    vulkan-loader
    protonplus
    heroic
    lutris
    bluez
    SDL2
    SDL2_ttf
    SDL2_image
    SDL2_mixer
    SDL2_net
  ];



  # List services that you want to enable:

  services.openssh.enable = true;

  system.stateVersion = "24.05"; # Did you read the comment?

}
```