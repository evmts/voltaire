/**
 * Error thrown when TopicFilter is invalid
 */
export class InvalidTopicFilterError extends Error {
	/**
	 * @param {string} message
	 * @param {object} [details]
	 */
	constructor(message, details) {
		super(message);
		this.name = "InvalidTopicFilterError";
		if (details) {
			this.details = details;
		}
	}
}
