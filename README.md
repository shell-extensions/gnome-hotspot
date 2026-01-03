# GNOME Hotspot Toggle

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-46%2F47%2F48-4A86CF?logo=gnome&logoColor=white)](https://www.gnome.org/)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL--2.0-blue.svg)](LICENSE)

**English** | [Deutsch](README.de.md) | [Español](README.es.md)

A small GNOME Shell extension and companion script to toggle a NetworkManager
Wi-Fi hotspot and set up basic NAT/iptables rules.

## Screenshots
![Hotspot on](image/Screenshot%20on.png)
![Hotspot off](image/Screenshot%20off.png)

## Features
- Quick Settings toggle for GNOME Shell 46/47/48.
- CLI script for manual use or automation.
- Optional desktop entry launcher.
- Sets up NAT/forwarding for hotspot traffic.

## Repository Layout
- `hotspot-toggle`: main Bash script.
- `hotspot@yurij.de/`: extension sources and bundled script.
- `hotspot-toggle.desktop`: desktop entry.
- `install.sh`: installer and sudoers setup.

## Requirements
- NetworkManager with `nmcli`
- `iptables`, `sysctl`, `notify-send`
- `gnome-extensions` (for enabling the extension)
- sudo access (to install the sudoers entry)

## Install
Run the installer and enter your sudo password when prompted:
```bash
./install.sh
```

This installs:
- `~/.local/bin/hotspot-toggle`
- `~/.local/share/applications/hotspot-toggle.desktop`
- `~/.local/share/gnome-shell/extensions/hotspot@yurij.de/`
- `/etc/sudoers.d/hotspot-toggle`

Ensure `~/.local/bin` is on your `PATH`, or invoke the script with the full path.
If you rely on the desktop entry, refresh the cache:
```bash
update-desktop-database ~/.local/share/applications
```

## Usage
Toggle from the command line:
```bash
hotspot-toggle
```

Pin a specific Wi-Fi interface:
```bash
HOTSPOT_WIFI_IF=wlp2s0 hotspot-toggle
```

The script expects the connection name `Hotspot` (the default created by
`nmcli dev wifi hotspot`). If your connection uses a different name, update
`HOTSPOT_NAME` in `hotspot-toggle`.

## GNOME Shell Extension
Enable it:
```bash
gnome-extensions enable hotspot@yurij.de
```

Reload GNOME Shell if needed (Xorg: Alt+F2 then `r`; Wayland: log out/in).

## Uninstall
```bash
rm -f ~/.local/bin/hotspot-toggle
rm -f ~/.local/share/applications/hotspot-toggle.desktop
rm -rf ~/.local/share/gnome-shell/extensions/hotspot@yurij.de
sudo rm -f /etc/sudoers.d/hotspot-toggle
```

## Security Notes
The installer adds a `NOPASSWD` sudoers entry for specific `iptables` and
`sysctl` commands. Review `/etc/sudoers.d/hotspot-toggle` before using in
sensitive environments.

## License
GPL-2.0. See `LICENSE`.
