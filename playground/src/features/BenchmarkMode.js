/** @typedef {{ iterations: number, warmupRuns: number }} BenchmarkOptions */

export class BenchmarkMode {
	/** @type {HTMLElement} */
	#container;
	/** @type {boolean} */
	#visible = false;

	/** @param {HTMLElement} container */
	constructor(container) {
		this.#container = container;
	}

	togglePanel() {
		this.#visible = !this.#visible;
		this.#container.style.display = this.#visible ? "block" : "none";
	}

	/**
	 * @param {string} code
	 * @param {string} path
	 * @param {any} executor
	 * @param {BenchmarkOptions} options
	 */
	async runBenchmark(code, path, executor, options) {
		// Stub: run benchmark
	}
}
