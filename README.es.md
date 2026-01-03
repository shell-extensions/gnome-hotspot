# GNOME Hotspot Toggle

[![GNOME Shell](https://img.shields.io/badge/GNOME%20Shell-46%2F47%2F48-4A86CF?logo=gnome&logoColor=white)](https://www.gnome.org/)
[![License: GPL-2.0](https://img.shields.io/badge/License-GPL--2.0-blue.svg)](LICENSE)

[English](README.md) | [Deutsch](README.de.md) | **Español**

Una pequeña extensión de GNOME Shell y un script compañero para alternar un
hotspot Wi-Fi de NetworkManager y configurar reglas básicas de NAT/iptables.

## Características
- Toggle de Ajustes Rápidos para GNOME Shell 46/47/48.
- Script CLI para uso manual o automatización.
- Lanzador opcional de entrada de escritorio.
- Configura NAT/forwarding para el tráfico del hotspot.

## Estructura del repositorio
- `hotspot-toggle`: script principal en Bash.
- `gnome-shell-extension/hotspot@yurij.de/`: fuentes de la extensión y script integrado.
- `hotspot-toggle.desktop`: entrada de escritorio.
- `install.sh`: instalador y configuración de sudoers.

## Requisitos
- NetworkManager con `nmcli`
- `iptables`, `sysctl`, `notify-send`
- `gnome-extensions` (para habilitar la extensión)
- acceso sudo (para instalar la entrada sudoers)

## Instalación
Ejecuta el instalador e introduce tu contraseña sudo cuando se solicite:
```bash
./install.sh
```

Esto instala:
- `~/.local/bin/hotspot-toggle`
- `~/.local/share/applications/hotspot-toggle.desktop`
- `~/.local/share/gnome-shell/extensions/hotspot@yurij.de/`
- `/etc/sudoers.d/hotspot-toggle`

Asegúrate de que `~/.local/bin` esté en tu `PATH`, o invoca el script con la
ruta completa. Si usas la entrada de escritorio, actualiza el caché:
```bash
update-desktop-database ~/.local/share/applications
```

## Uso
Alterna desde la línea de comandos:
```bash
hotspot-toggle
```

Fijar una interfaz Wi-Fi específica:
```bash
HOTSPOT_WIFI_IF=wlp2s0 hotspot-toggle
```

El script espera el nombre de conexión `Hotspot` (el valor por defecto creado
por `nmcli dev wifi hotspot`). Si tu conexión usa otro nombre, actualiza
`HOTSPOT_NAME` en `hotspot-toggle`.

## Extensión de GNOME Shell
Habilítala:
```bash
gnome-extensions enable hotspot@yurij.de
```

Recarga GNOME Shell si es necesario (Xorg: Alt+F2 luego `r`; Wayland: cerrar
sesión e iniciar sesión de nuevo).

## Desinstalación
```bash
rm -f ~/.local/bin/hotspot-toggle
rm -f ~/.local/share/applications/hotspot-toggle.desktop
rm -rf ~/.local/share/gnome-shell/extensions/hotspot@yurij.de
sudo rm -f /etc/sudoers.d/hotspot-toggle
```

## Notas de seguridad
El instalador agrega una entrada sudoers `NOPASSWD` para comandos específicos de
`iptables` y `sysctl`. Revisa `/etc/sudoers.d/hotspot-toggle` antes de usar en
entornos sensibles.

## Licencia
GPL-2.0. Ver `LICENSE`.
