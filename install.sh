#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN_SRC="${SCRIPT_DIR}/hotspot-toggle"
DESKTOP_SRC="${SCRIPT_DIR}/hotspot-toggle.desktop"
EXT_SRC="${SCRIPT_DIR}/gnome-shell-extension/hotspot@yurij.de"
EXT_UUID="hotspot@yurij.de"

TARGET_USER="${TARGET_USER:-${SUDO_USER:-$USER}}"
BIN_DEST="${HOME}/.local/bin/hotspot-toggle"
DESKTOP_DEST="${HOME}/.local/share/applications/hotspot-toggle.desktop"
EXT_DEST="${HOME}/.local/share/gnome-shell/extensions/${EXT_UUID}"
SUDOERS_FILE="/etc/sudoers.d/hotspot-toggle"

log() {
  echo "[install] $*"
}

require_file() {
  local f="$1"
  if [[ ! -f "${f}" ]]; then
    echo "Fehlende Datei: ${f}" >&2
    exit 1
  fi
}

require_dir() {
  local d="$1"
  if [[ ! -d "${d}" ]]; then
    echo "Fehlendes Verzeichnis: ${d}" >&2
    exit 1
  fi
}

install_bin() {
  require_file "${BIN_SRC}"
  mkdir -p "$(dirname "${BIN_DEST}")"
  install -m 755 "${BIN_SRC}" "${BIN_DEST}"
  log "Script installiert nach ${BIN_DEST}"
}

install_desktop() {
  require_file "${DESKTOP_SRC}"
  mkdir -p "$(dirname "${DESKTOP_DEST}")"
  install -m 644 "${DESKTOP_SRC}" "${DESKTOP_DEST}"

  if command -v sed >/dev/null 2>&1; then
    sed -i "s#^Exec=.*#Exec=/bin/sh -c \"${BIN_DEST}\"#" "${DESKTOP_DEST}" || true
  fi

  log ".desktop installiert nach ${DESKTOP_DEST}"
}

install_extension() {
  if [[ ! -d "${EXT_SRC}" ]]; then
    log "GNOME Extension-Verzeichnis fehlt, überspringe Installation (${EXT_SRC})"
    return
  fi

  require_dir "${EXT_SRC}"
  mkdir -p "$(dirname "${EXT_DEST}")"
  rm -rf "${EXT_DEST}"
  cp -r "${EXT_SRC}" "${EXT_DEST}"
  log "GNOME Shell Extension nach ${EXT_DEST} kopiert"

  if command -v gnome-extensions >/dev/null 2>&1; then
    if ! gnome-extensions enable "${EXT_UUID}" >/dev/null 2>&1; then
      log "Hinweis: Extension ${EXT_UUID} ggf. manuell aktivieren"
    else
      log "Extension ${EXT_UUID} aktiviert"
    fi
  else
    log "gnome-extensions CLI nicht gefunden, Aktivierung ggf. manuell"
  fi

  log "GNOME Shell ggf. neu laden (Xorg: Alt+F2, 'r'; Wayland: ab- und anmelden)."
}

sync_extension_payload() {
  if [[ ! -f "${BIN_SRC}" ]]; then
    log "Hotspot-Script fehlt (${BIN_SRC}), kann Extension-Payload nicht aktualisieren"
    return
  fi

  mkdir -p "${EXT_SRC}"
  install -m 755 "${BIN_SRC}" "${EXT_SRC}/hotspot-toggle"
  log "Extension-Payload aktualisiert (${EXT_SRC}/hotspot-toggle)"
}

install_sudoers() {
  if [[ -z "${TARGET_USER}" ]]; then
    echo "TARGET_USER ist leer" >&2
    exit 1
  fi

  local ipt sys vis tmp
  ipt=$(command -v iptables || true)
  sys=$(command -v sysctl || true)
  vis=$(command -v visudo || true)

  if [[ -z "${ipt}" || -z "${sys}" || -z "${vis}" ]]; then
    echo "iptables/sysctl/visudo nicht gefunden, Pfade prüfen" >&2
    exit 1
  fi

  tmp=$(mktemp)
  cat <<EOF > "${tmp}"
Cmnd_Alias HOTSPOT_IPTABLES = \
  ${ipt} -C DOCKER-USER -i * -j ACCEPT, \
  ${ipt} -I DOCKER-USER -i * -j ACCEPT, \
  ${ipt} -D DOCKER-USER -i * -j ACCEPT, \
  ${ipt} -C FORWARD -i * -j ACCEPT, \
  ${ipt} -I FORWARD -i * -j ACCEPT, \
  ${ipt} -D FORWARD -i * -j ACCEPT, \
  ${ipt} -C FORWARD -o * -m conntrack --ctstate RELATED\,ESTABLISHED -j ACCEPT, \
  ${ipt} -I FORWARD -o * -m conntrack --ctstate RELATED\,ESTABLISHED -j ACCEPT, \
  ${ipt} -D FORWARD -o * -m conntrack --ctstate RELATED\,ESTABLISHED -j ACCEPT, \
  ${ipt} -t nat -C POSTROUTING -o * -j MASQUERADE, \
  ${ipt} -t nat -A POSTROUTING -o * -j MASQUERADE, \
  ${ipt} -t nat -D POSTROUTING -o * -j MASQUERADE
Cmnd_Alias HOTSPOT_SYSCTL = ${sys} -w net.ipv4.ip_forward=*
${TARGET_USER} ALL=(root) NOPASSWD: HOTSPOT_IPTABLES, HOTSPOT_SYSCTL
EOF

  if ! sudo "${vis}" -cf "${tmp}" >/dev/null; then
    echo "visudo-Check fehlgeschlagen, sudoers nicht geschrieben" >&2
    rm -f "${tmp}"
    exit 1
  fi

  sudo install -m 440 "${tmp}" "${SUDOERS_FILE}"
  rm -f "${tmp}"
  log "sudoers-Eintrag in ${SUDOERS_FILE} für ${TARGET_USER} gesetzt"
}

install_bin
install_desktop
sync_extension_payload
install_extension
install_sudoers

log "Installation fertig. Desktop-Eintrag ggf. mit 'update-desktop-database ~/.local/share/applications' aktualisieren."
