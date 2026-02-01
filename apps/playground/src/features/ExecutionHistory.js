/** @typedef {{ timestamp: number, code: string, output: string, duration: number, filePath: string }} HistoryEntry */

export class ExecutionHistory {
	/** @type {HTMLElement} */
	#container;
	/** @type {HistoryEntry[]} */
	#entries = [];
	/** @type {boolean} */
	#visible = false;

	/** @param {HTMLElement} container */
	constructor(container) {
		this.#container = container;
	}

	/** @param {HistoryEntry} entry */
	addEntry(entry) {
		this.#entries.push(entry);
		this.#render();
	}

	togglePanel() {
		this.#visible = !this.#visible;
		this.#container.style.display = this.#visible ? "block" : "none";
	}

	#render() {
		if (!this.#visible) return;
		// Stub: render entries
	}
}
