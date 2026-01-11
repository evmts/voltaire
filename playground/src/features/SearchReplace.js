export class SearchReplace {
	/** @type {any} */
	#monaco;
	/** @type {any} */
	#editor;
	/** @type {any} */
	#tabs;
	/** @type {HTMLElement} */
	#panel;

	/**
	 * @param {any} monaco
	 * @param {any} editor
	 * @param {any} tabs
	 * @param {HTMLElement} panel
	 */
	constructor(monaco, editor, tabs, panel) {
		this.#monaco = monaco;
		this.#editor = editor;
		this.#tabs = tabs;
		this.#panel = panel;
	}

	destroy() {
		// Stub: cleanup
	}
}
