# GNOME Hotspot Toggle

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-46%2F47%2F48-4A86CF?logo=gnome&logoColor=white)](https://www.gnome.org/)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL--2.0-blue.svg)](LICENSE)

[English](README.md) | **Deutsch** | [Español](README.es.md)

Eine kleine GNOME Shell Erweiterung und ein Begleitskript, um einen
NetworkManager Wi-Fi Hotspot umzuschalten und grundlegende NAT/iptables
Regeln zu setzen.

## Funktionen
- Quick Settings Schalter für GNOME Shell 46/47/48.
- CLI Skript für manuelle Nutzung oder Automatisierung.
- Optionaler Desktop-Entry Starter.
- Richtet NAT/Forwarding für Hotspot Traffic ein.

## Repository-Aufbau
- `hotspot-toggle`: Haupt Bash Skript.
- `gnome-shell-extension/hotspot@yurij.de/`: Erweiterungsquellen und gebündeltes Skript.
- `hotspot-toggle.desktop`: Desktop-Entry.
- `install.sh`: Installer und sudoers Setup.

## Voraussetzungen
- NetworkManager mit `nmcli`
- `iptables`, `sysctl`, `notify-send`
- `gnome-extensions` (zum Aktivieren der Erweiterung)
- sudo Zugriff (um den sudoers Eintrag zu installieren)

## Installation
Führe den Installer aus und gib dein sudo-Passwort ein:
```bash
./install.sh
```

Dies installiert:
- `~/.local/bin/hotspot-toggle`
- `~/.local/share/applications/hotspot-toggle.desktop`
- `~/.local/share/gnome-shell/extensions/hotspot@yurij.de/`
- `/etc/sudoers.d/hotspot-toggle`

Stelle sicher, dass `~/.local/bin` in deinem `PATH` ist, oder rufe das Skript
mit dem vollen Pfad auf. Wenn du den Desktop-Entry nutzt, aktualisiere den
Cache:
```bash
update-desktop-database ~/.local/share/applications
```

## Nutzung
Hotspot über die Kommandozeile toggeln:
```bash
hotspot-toggle
```

Ein bestimmtes Wi-Fi-Interface festlegen:
```bash
HOTSPOT_WIFI_IF=wlp2s0 hotspot-toggle
```

Das Skript erwartet den Verbindungsnamen `Hotspot` (Standard von
`nmcli dev wifi hotspot`). Wenn deine Verbindung einen anderen Namen nutzt,
passe `HOTSPOT_NAME` in `hotspot-toggle` an.

## GNOME Shell-Erweiterung
Aktivieren:
```bash
gnome-extensions enable hotspot@yurij.de
```

GNOME Shell neu laden, wenn nötig (Xorg: Alt+F2 dann `r`; Wayland:
ab- und wieder anmelden).

## Deinstallation
```bash
rm -f ~/.local/bin/hotspot-toggle
rm -f ~/.local/share/applications/hotspot-toggle.desktop
rm -rf ~/.local/share/gnome-shell/extensions/hotspot@yurij.de
sudo rm -f /etc/sudoers.d/hotspot-toggle
```

## Sicherheitshinweise
Der Installer fügt einen `NOPASSWD` sudoers Eintrag für bestimmte `iptables`
und `sysctl` Befehle hinzu. Bitte prüfe `/etc/sudoers.d/hotspot-toggle` vor dem
Einsatz in sensiblen Umgebungen.

## Lizenz
GPL-2.0. Siehe `LICENSE`.
