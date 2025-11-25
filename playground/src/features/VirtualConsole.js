/**
 * @typedef {"log" | "error" | "warn" | "info"} LogLevel
 * @typedef {{ timestamp: Date, message: string, level: LogLevel }} LogEntry
 */

export class VirtualConsole {
	/** @type {HTMLElement} */
	#container;
	/** @type {LogEntry[]} */
	#entries = [];
	/** @type {string} */
	#filter = "all";

	/** @param {HTMLElement} container */
	constructor(container) {
		this.#container = container;
	}

	/** @param {LogEntry} entry */
	addEntry(entry) {
		this.#entries.push(entry);
		this.#render();
	}

	clear() {
		this.#entries = [];
		this.#container.innerHTML = "";
	}

	getEntries() {
		return [...this.#entries];
	}

	/** @param {string} filter */
	setFilter(filter) {
		this.#filter = filter;
	}

	forceRender() {
		this.#render();
	}

	#render() {
		const filtered =
			this.#filter === "all"
				? this.#entries
				: this.#entries.filter((e) => e.level === this.#filter);

		this.#container.innerHTML = filtered
			.map(
				(e) => `<div class="console-${e.level}">${this.#escape(e.message)}</div>`,
			)
			.join("");
	}

	/** @param {string} str */
	#escape(str) {
		const div = document.createElement("div");
		div.textContent = str;
		return div.innerHTML;
	}
}
