# Contributing

Thanks for helping improve GNOME Hotspot Toggle. This project is small and
focused; please keep changes tight and well-scoped.

## Development Setup
- Run `./install.sh` to install the script, desktop entry, and extension.
- For local testing without installing, run `./hotspot-toggle` directly.
- Extension files live in `hotspot@yurij.de/`.

## Coding Style
- Bash: 2-space indentation, `set -euo pipefail`, functions in
  `lower_snake_case`, constants in `UPPER_SNAKE_CASE`.
- GJS: 4-space indentation, semicolons, ES module imports, `async/await`.

## Testing
There is no automated test suite yet. Please verify changes manually:
- `./hotspot-toggle` toggles the `Hotspot` connection.
- `nmcli connection show --active` reflects state changes.
- iptables rules are added/removed as expected.
- Extension toggle appears and updates in GNOME Quick Settings.

## Submitting Changes
- Keep commits small and descriptive.
- Include testing steps in your PR description.
- Note GNOME Shell version (46/47/48) and Wayland/Xorg.
- Provide screenshots or a short recording for UI changes.
- Call out any change that alters sudoers or firewall behavior.
