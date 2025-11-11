import { InvalidBloomFilterParameterError } from "./errors.js";

/**
 * Merge two bloom filters using bitwise OR
 * Both filters must have same size and hash count
 *
 * @param {import('./BrandedBloomFilter.js').BrandedBloomFilter} filter1 - First bloom filter
 * @param {import('./BrandedBloomFilter.js').BrandedBloomFilter} filter2 - Second bloom filter
 * @returns {import('./BrandedBloomFilter.js').BrandedBloomFilter} Merged bloom filter
 * @throws {InvalidBloomFilterParameterError} If filters have different parameters
 *
 * @example
 * ```typescript
 * const f1 = BloomFilter.create(2048, 3);
 * const f2 = BloomFilter.create(2048, 3);
 * const merged = BloomFilter.merge(f1, f2);
 * ```
 */
export function merge(filter1, filter2) {
	if (filter1.m !== filter2.m || filter1.k !== filter2.k) {
		throw new InvalidBloomFilterParameterError(
			"Cannot merge filters with different parameters",
			{
				value: { m1: filter1.m, k1: filter1.k, m2: filter2.m, k2: filter2.k },
				expected: "matching m and k values",
				docsPath: "/primitives/bloom-filter/merge#error-handling",
			},
		);
	}
	if (filter1.length !== filter2.length) {
		throw new InvalidBloomFilterParameterError(
			"Cannot merge filters with different sizes",
			{
				value: { len1: filter1.length, len2: filter2.length },
				expected: "matching filter sizes",
				docsPath: "/primitives/bloom-filter/merge#error-handling",
			},
		);
	}

	const result = new Uint8Array(filter1.length);
	for (let i = 0; i < filter1.length; i++) {
		const byte1 = filter1[i];
		const byte2 = filter2[i];
		if (byte1 === undefined || byte2 === undefined) {
			throw new InvalidBloomFilterParameterError(
				`Invalid bloom filter data at index ${i}`,
				{
					value: i,
					expected: "valid byte data",
					docsPath: "/primitives/bloom-filter/merge#error-handling",
				},
			);
		}
		result[i] = byte1 | byte2;
	}

	Object.defineProperty(result, "k", {
		value: filter1.k,
		writable: false,
		enumerable: true,
	});
	Object.defineProperty(result, "m", {
		value: filter1.m,
		writable: false,
		enumerable: true,
	});
	Object.defineProperty(result, "__tag", {
		value: "BloomFilter",
		writable: false,
		enumerable: false,
	});

	return /** @type {import('./BrandedBloomFilter.js').BrandedBloomFilter} */ (
		result
	);
}
