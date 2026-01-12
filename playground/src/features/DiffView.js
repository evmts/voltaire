export class DiffView {
	/** @type {Map<string, string>} */
	#originals = new Map();
	/** @type {boolean} */
	#diffMode = false;

	/**
	 * @param {any} monaco
	 * @param {HTMLElement} container
	 * @param {any} editor
	 */
	constructor(monaco, container, editor) {
		this.#monaco = monaco;
		this.#container = container;
		this.#editor = editor;
	}

	/**
	 * @param {string} path
	 * @param {string} content
	 */
	storeOriginalContent(path, content) {
		this.#originals.set(path, content);
	}

	/** @param {any} tab */
	toggleDiffMode(_tab) {
		this.#diffMode = !this.#diffMode;
		// Stub: toggle diff
	}

	isInDiffMode() {
		return this.#diffMode;
	}

	/** @param {any} tab */
	onTabChange(_tab) {
		// Stub: handle tab change
	}

	/**
	 * @param {string} path
	 * @param {string} content
	 */
	hasChanges(path, content) {
		const original = this.#originals.get(path);
		return original !== content;
	}

	/**
	 * @param {string} path
	 * @param {string} content
	 */
	getChangedLineCount(_path, _content) {
		return 0; // Stub
	}

	/** @param {any} tab */
	revertToOriginal(tab) {
		const original = this.#originals.get(tab.path);
		if (original) {
			tab.model.setValue(original);
		}
	}
}
