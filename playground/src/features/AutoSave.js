/** @typedef {{ debounceMs: number, storagePrefix: string }} AutoSaveOptions */

export class AutoSave {
	/** @type {any} */
	#editor;
	/** @type {AutoSaveOptions} */
	#options;

	/**
	 * @param {any} editor
	 * @param {AutoSaveOptions} options
	 */
	constructor(editor, options) {
		this.#editor = editor;
		this.#options = options;
	}

	/**
	 * @param {HTMLElement} unsavedIndicator
	 * @param {HTMLElement} lastSavedIndicator
	 */
	init(_unsavedIndicator, _lastSavedIndicator) {
		// Stub: init autosave
	}

	/**
	 * @param {string} path
	 * @param {string} content
	 */
	loadFile(_path, content) {
		this.#editor.setValue(content);
	}

	destroy() {
		// Stub: cleanup
	}
}
