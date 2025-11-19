export class InvalidReceiptError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 * @param {unknown} [details.value]
	 * @param {string} [details.expected]
	 * @param {Record<string, unknown>} [details.context]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidReceiptError";
		if (details) {
			this.details = details;
		}
	}
}
