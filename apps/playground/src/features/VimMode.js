import { initVimMode } from "monaco-vim";

export class VimMode {
	/** @type {HTMLElement} */
	#statusEl;
	/** @type {boolean} */
	#enabled = false;
	/** @type {any} */
	#vimMode = null;

	/** @param {HTMLElement} statusEl */
	constructor(statusEl) {
		this.#statusEl = statusEl;
	}

	/** @param {any} editor */
	toggle(editor) {
		this.#enabled = !this.#enabled;
		if (this.#enabled) {
			this.initVim(editor);
		} else {
			this.dispose();
		}
	}

	/** @param {any} editor */
	initVim(editor) {
		if (this.#vimMode) {
			return; // Already initialized
		}
		this.#vimMode = initVimMode(editor, this.#statusEl);
	}

	dispose() {
		if (this.#vimMode) {
			this.#vimMode.dispose();
			this.#vimMode = null;
		}
		this.#statusEl.textContent = "";
	}

	isEnabled() {
		return this.#enabled;
	}
}
