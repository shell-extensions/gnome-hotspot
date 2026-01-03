/* GNOME Shell 45+ extension: Hotspot quick toggle */
import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as QuickSettings from 'resource:///org/gnome/shell/ui/quickSettings.js';
import {Extension, gettext as _} from 'resource:///org/gnome/shell/extensions/extension.js';

const HOTSPOT_NAME = 'Hotspot';
const REFRESH_INTERVAL = 10; // seconds
const TARGET_POSITION = 4;   // 0-based -> 5. Button von oben

function findHotspotCommand(extraPaths = []) {
    const candidates = [];
    const addCandidate = path => {
        if (path && !candidates.includes(path))
            candidates.push(path);
    };

    for (const path of extraPaths)
        addCandidate(path);

    addCandidate(GLib.build_filenamev([
        GLib.get_home_dir(),
        '.local', 'bin', 'hotspot-toggle',
    ]));

    addCandidate(GLib.find_program_in_path('hotspot-toggle'));

    for (const candidate of candidates) {
        if (GLib.file_test(candidate, GLib.FileTest.IS_EXECUTABLE))
            return candidate;
    }

    return null;
}

function runCommand(argv) {
    return new Promise((resolve, reject) => {
        if (!argv?.length) {
            reject(new Error('no command provided'));
            return;
        }

        let proc;
        try {
            proc = Gio.Subprocess.new(
                argv,
                Gio.SubprocessFlags.STDOUT_PIPE |
                Gio.SubprocessFlags.STDERR_PIPE,
            );
        } catch (e) {
            reject(e);
            return;
        }

        proc.communicate_utf8_async(null, null, (p, res) => {
            try {
                const [ok, stdoutRaw, stderrRaw] = p.communicate_utf8_finish(res);
                const stdout = (stdoutRaw ?? '').toString().trim();
                const stderr = (stderrRaw ?? '').toString().trim();
                const exitCode = p.get_exit_status();
                if (!ok || exitCode !== 0) {
                    const cmd = argv[0];
                    reject(new Error(`${cmd}: ${stderr || stdout || 'command failed'} (exit ${exitCode})`));
                } else {
                    resolve({stdout, stderr});
                }
            } catch (e) {
                reject(e);
            }
        });
    });
}

const HotspotIndicator = GObject.registerClass(
class HotspotIndicator extends QuickSettings.SystemIndicator {
    _init(options = {}) {
        super._init();

        this._indicator = this._addIndicator();
        this._indicator.icon_name = 'network-wireless-hotspot-symbolic';
        this._indicator.visible = false;

        const {
            commandPaths = [],
            targetPosition = TARGET_POSITION,
        } = options;

        this._command = findHotspotCommand(commandPaths);
        this._targetPosition = targetPosition;
        this._busy = false;
        this._updateRunning = false;
        this._timeoutId = 0;

        this._toggle = new QuickSettings.QuickToggle({
            title: _('Hotspot'),
            iconName: 'network-wireless-hotspot-symbolic',
            toggleMode: true,
        });

        this._toggle.connect('clicked', () => this._toggleHotspot());
        this._toggle.bind_property(
            'checked',
            this._indicator,
            'visible',
            GObject.BindingFlags.DEFAULT,
        );

        this.quickSettingsItems.push(this._toggle);

        this._refresh();
        this._timeoutId = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            REFRESH_INTERVAL,
            () => {
                this._refresh();
                return GLib.SOURCE_CONTINUE;
            },
        );
    }

    async _isActive() {
        const result = await runCommand([
            'nmcli', '-t', '-f', 'NAME,TYPE,DEVICE',
            'connection', 'show', '--active',
        ]);

        const stdout = result?.stdout ?? '';
        if (!stdout)
            return false;

        return stdout.split('\n').some(line => line.startsWith(`${HOTSPOT_NAME}:`));
    }

    async _getHotspotSsid() {
        try {
            const result = await runCommand([
                'nmcli', '-t', '-g', '802-11-wireless.ssid',
                'connection', 'show', HOTSPOT_NAME,
            ]);

            const ssid = (result?.stdout ?? '').trim();
            return ssid || HOTSPOT_NAME;
        } catch (e) {
            log(`hotspot-toggle: SSID lookup failed: ${e}`);
            return HOTSPOT_NAME;
        }
    }

    async _refresh() {
        if (this._updateRunning)
            return;

        this._updateRunning = true;
        try {
            const active = await this._isActive();
            this._toggle.checked = active;
            if (active) {
                const ssid = await this._getHotspotSsid();
                this._toggle.subtitle = ssid;
            } else {
                this._toggle.subtitle = '';
            }
        } catch (e) {
            log(`hotspot-toggle: status check failed: ${e}`);
            this._toggle.checked = false;
            this._toggle.subtitle = '';
        } finally {
            this._updateRunning = false;
        }
    }

    async _toggleHotspot() {
        if (this._busy)
            return;

        if (!this._command) {
            const msg = _('hotspot-toggle Kommando nicht gefunden.');
            log(`hotspot-toggle: ${msg}`);
            Main.notify(_('Hotspot'), msg);
            return;
        }

        this._busy = true;
        this._toggle.reactive = false;

        try {
            await runCommand([this._command]);
        } catch (e) {
            log(`hotspot-toggle: toggle failed: ${e}`);
            Main.notify(_('Hotspot'), `${_('Schalten fehlgeschlagen')}: ${e.message}`);
        } finally {
            await this._refresh();
            this._toggle.reactive = true;
            this._busy = false;
        }
    }

    _reorderToggle() {
        const grid = Main.panel?.statusArea?.quickSettings?.menu?._grid;
        if (!grid?.get_children)
            return GLib.SOURCE_REMOVE;

        const toggles = grid.get_children().filter(child =>
            child instanceof QuickSettings.QuickToggle ||
            child instanceof QuickSettings.QuickMenuToggle);

        const currentIndex = toggles.indexOf(this._toggle);
        if (currentIndex === -1)
            return GLib.SOURCE_REMOVE;

        const desired = Math.min(
            Math.max(0, this._targetPosition),
            toggles.length - 1,
        );

        if (desired !== currentIndex) {
            toggles.splice(currentIndex, 1);
            toggles.splice(desired, 0, this._toggle);

            let last = null;
            for (const item of toggles) {
                grid.set_child_above_sibling(item, last);
                last = item;
            }
        }

        return GLib.SOURCE_REMOVE;
    }

    moveToDefaultPosition() {
        GLib.idle_add(GLib.PRIORITY_DEFAULT_IDLE,
            () => this._reorderToggle());
    }

    destroy() {
        if (this._timeoutId)
            GLib.source_remove(this._timeoutId);

        this.quickSettingsItems.forEach(item => {
            if (item?.destroy)
                item.destroy();
        });

        super.destroy();
    }
});

export default class HotspotToggleExtension extends Extension {
    constructor(metadata) {
        super(metadata);
        this._indicator = null;
    }

    enable() {
        const extensionPath = this.path ?? this.dir?.get_path();
        const bundledCommand = extensionPath
            ? GLib.build_filenamev([extensionPath, 'hotspot-toggle'])
            : null;

        this._indicator = new HotspotIndicator({
            commandPaths: [bundledCommand],
            targetPosition: TARGET_POSITION,
        });

        Main.panel.statusArea.quickSettings.addExternalIndicator(this._indicator);
        this._indicator.moveToDefaultPosition();
    }

    disable() {
        if (this._indicator) {
            const qs = Main.panel?.statusArea?.quickSettings;
            if (qs?.removeExternalIndicator)
                qs.removeExternalIndicator(this._indicator);

            this._indicator.destroy();
            this._indicator = null;
        }
    }
}
