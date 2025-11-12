import { InvalidBloomFilterLengthError } from "./errors.js";

/**
 * Create bloom filter from hex string
 *
 * @param {string} hex - Hex string (with or without 0x prefix)
 * @param {number} m - Number of bits
 * @param {number} k - Number of hash functions
 * @returns {import('./BrandedBloomFilter.js').BrandedBloomFilter} BloomFilter
 * @throws {InvalidBloomFilterLengthError} If hex length doesn't match expected size
 *
 * @example
 * ```typescript
 * const filter = BloomFilter.fromHex("0x00...", 2048, 3);
 * ```
 */
export function fromHex(hex, m, k) {
	const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
	const expectedBytes = Math.ceil(m / 8);
	const expectedHexLen = expectedBytes * 2;

	if (cleanHex.length !== expectedHexLen) {
		throw new InvalidBloomFilterLengthError(
			`Expected ${expectedHexLen} hex chars, got ${cleanHex.length}`,
			{
				value: cleanHex.length,
				expected: `${expectedHexLen} hex chars`,
				context: { m, k },
				docsPath: "/primitives/bloom-filter/from-hex#error-handling",
			},
		);
	}

	const bytes = new Uint8Array(expectedBytes);
	for (let i = 0; i < expectedBytes; i++) {
		bytes[i] = Number.parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
	}

	Object.defineProperty(bytes, "k", {
		value: k,
		writable: false,
		enumerable: true,
	});
	Object.defineProperty(bytes, "m", {
		value: m,
		writable: false,
		enumerable: true,
	});

	return /** @type {import('./BrandedBloomFilter.js').BrandedBloomFilter} */ (
		bytes
	);
}
