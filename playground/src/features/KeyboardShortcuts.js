/**
 * @typedef {{
 *   editor: any,
 *   monaco: any,
 *   onRun: () => void,
 *   onClearConsole: () => void,
 *   onIncreaseFontSize: () => void,
 *   onDecreaseFontSize: () => void,
 *   onToggleSettings: () => void
 * }} ShortcutHandlers
 */

export class KeyboardShortcuts {
	/** @param {ShortcutHandlers} handlers */
	constructor(handlers) {
		this.#handlers = handlers;
	}

	register() {
		// Stub: register shortcuts
	}
}

export function addShortcutStyles() {
	// Stub: add styles
}
