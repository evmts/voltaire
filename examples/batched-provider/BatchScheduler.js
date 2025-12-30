/**
 * BatchScheduler - Request batching and debouncing logic
 *
 * Accumulates requests over a debounce window, then executes them as a batch.
 * Routes responses back to individual callers via Promise resolution.
 *
 * @module batched-provider/BatchScheduler
 */

/**
 * @typedef {Object} PendingRequest
 * @property {number} id - Unique request ID
 * @property {Object} request - The JSON-RPC request body
 * @property {function(any): void} resolve - Promise resolve function
 * @property {function(Error): void} reject - Promise reject function
 */

/**
 * @typedef {Object} BatchSchedulerOptions
 * @property {number} [wait=10] - Debounce window in milliseconds
 * @property {number} [maxBatchSize=100] - Maximum requests per batch
 * @property {function(Array<Object>): Promise<Array<Object>>} execute - Batch execution function
 */

/**
 * Creates a batch scheduler for JSON-RPC requests
 *
 * @param {BatchSchedulerOptions} options - Scheduler configuration
 * @returns {Object} Scheduler with schedule() and flush() methods
 *
 * @example
 * ```javascript
 * const scheduler = createBatchScheduler({
 *   wait: 10,
 *   maxBatchSize: 100,
 *   execute: async (requests) => {
 *     const response = await fetch(url, {
 *       method: 'POST',
 *       body: JSON.stringify(requests)
 *     });
 *     return response.json();
 *   }
 * });
 *
 * // Each call returns a Promise that resolves to the individual result
 * const [block, balance] = await Promise.all([
 *   scheduler.schedule({ method: 'eth_blockNumber', params: [] }),
 *   scheduler.schedule({ method: 'eth_getBalance', params: ['0x...', 'latest'] })
 * ]);
 * ```
 */
export function createBatchScheduler(options) {
	const { wait = 10, maxBatchSize = 100, execute } = options;

	/** @type {Map<number, PendingRequest>} */
	const pending = new Map();

	/** @type {Array<PendingRequest>} */
	let queue = [];

	/** @type {ReturnType<typeof setTimeout> | null} */
	let timer = null;

	/** @type {number} */
	let nextId = 1;

	/**
	 * Execute the current batch
	 */
	async function flush() {
		timer = null;

		if (queue.length === 0) {
			return;
		}

		// Take current queue and reset
		const batch = queue;
		queue = [];

		// Build request array
		const requests = batch.map((item) => ({
			jsonrpc: "2.0",
			id: item.id,
			method: item.request.method,
			params: item.request.params ?? [],
		}));

		try {
			const responses = await execute(requests);

			// Create ID->response map for fast lookup
			const responseMap = new Map();
			if (Array.isArray(responses)) {
				for (const response of responses) {
					if (response && typeof response.id !== "undefined") {
						responseMap.set(response.id, response);
					}
				}
			}

			// Route responses to callers
			for (const item of batch) {
				const response = responseMap.get(item.id);
				pending.delete(item.id);

				if (!response) {
					item.reject(
						new Error(`Missing response for request id ${item.id}`),
					);
					continue;
				}

				if (response.error) {
					const error = new Error(response.error.message || "RPC Error");
					/** @type {any} */ (error).code = response.error.code;
					/** @type {any} */ (error).data = response.error.data;
					item.reject(error);
				} else {
					item.resolve(response.result);
				}
			}
		} catch (error) {
			// Batch-level failure: reject all pending requests
			for (const item of batch) {
				pending.delete(item.id);
				item.reject(error);
			}
		}
	}

	/**
	 * Schedule a request for batching
	 *
	 * @param {Object} request - JSON-RPC request (method, params)
	 * @returns {Promise<any>} Promise resolving to the result
	 */
	function schedule(request) {
		const id = nextId++;

		/** @type {function(any): void} */
		let resolve;
		/** @type {function(Error): void} */
		let reject;

		const promise = new Promise((res, rej) => {
			resolve = res;
			reject = rej;
		});

		/** @type {PendingRequest} */
		const item = {
			id,
			request,
			resolve: /** @type {function(any): void} */ (resolve),
			reject: /** @type {function(Error): void} */ (reject),
		};

		pending.set(id, item);
		queue.push(item);

		// Flush immediately if batch size reached
		if (queue.length >= maxBatchSize) {
			if (timer) {
				clearTimeout(timer);
				timer = null;
			}
			flush();
		} else if (!timer) {
			// Schedule flush after debounce window
			timer = setTimeout(flush, wait);
		}

		return promise;
	}

	/**
	 * Force immediate execution of pending requests
	 */
	function forceFlush() {
		if (timer) {
			clearTimeout(timer);
			timer = null;
		}
		return flush();
	}

	/**
	 * Get count of pending requests
	 * @returns {number}
	 */
	function getPendingCount() {
		return queue.length;
	}

	return {
		schedule,
		flush: forceFlush,
		getPendingCount,
	};
}
