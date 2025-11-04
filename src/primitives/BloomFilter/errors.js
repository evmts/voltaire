/**
 * Error thrown when BloomFilter parameters are invalid
 */
export class InvalidBloomFilterParameterError extends Error {
	constructor(message) {
		super(message);
		this.name = "InvalidBloomFilterParameterError";
	}
}

/**
 * Error thrown when BloomFilter data length is invalid
 */
export class InvalidBloomFilterLengthError extends Error {
	constructor(message) {
		super(message);
		this.name = "InvalidBloomFilterLengthError";
	}
}
