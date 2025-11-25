/**
 * @typedef {{
 *   fontSize: number,
 *   fontFamily: string,
 *   minimap: boolean,
 *   lineNumbers: string,
 *   wordWrap: string
 * }} DisplaySettings
 */

export class DisplaySettingsManager {
	/** @type {DisplaySettings} */
	#settings = {
		fontSize: 14,
		fontFamily: "monospace",
		minimap: false,
		lineNumbers: "on",
		wordWrap: "on",
	};
	/** @type {((settings: DisplaySettings) => void)[]} */
	#listeners = [];

	get() {
		return { ...this.#settings };
	}

	/** @param {(settings: DisplaySettings) => void} listener */
	onChange(listener) {
		this.#listeners.push(listener);
	}

	increaseFontSize() {
		this.#settings.fontSize++;
		this.#notify();
	}

	decreaseFontSize() {
		this.#settings.fontSize--;
		this.#notify();
	}

	/** @param {HTMLElement} panel */
	createUI(panel) {
		// Stub: create settings UI
	}

	#notify() {
		for (const listener of this.#listeners) {
			listener(this.#settings);
		}
	}
}
