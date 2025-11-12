import { InvalidBloomFilterParameterError } from "./errors.js";

/**
 * Combine multiple bloom filters using bitwise OR
 * All filters must have same size and hash count
 *
 * @param {...import('./BrandedBloomFilter.ts').BrandedBloomFilter} filters - Bloom filters to combine
 * @returns {import('./BrandedBloomFilter.ts').BrandedBloomFilter} Combined bloom filter
 * @throws {InvalidBloomFilterParameterError} If filters have different parameters
 *
 * @example
 * ```typescript
 * const f1 = BloomFilter.create(2048, 3);
 * const f2 = BloomFilter.create(2048, 3);
 * const f3 = BloomFilter.create(2048, 3);
 * const combined = BloomFilter.combine(f1, f2, f3);
 * ```
 */
export function combine(...filters) {
	if (filters.length === 0) {
		throw new InvalidBloomFilterParameterError(
			"combine requires at least one filter",
			{
				value: 0,
				expected: "at least 1 filter",
				docsPath: "/primitives/bloom-filter/combine#error-handling",
			},
		);
	}

	const first = filters[0];
	if (!first) {
		throw new InvalidBloomFilterParameterError("Invalid filter", {
			value: first,
			expected: "valid BloomFilter",
			docsPath: "/primitives/bloom-filter/combine#error-handling",
		});
	}

	// Validate all filters have same parameters
	for (let i = 1; i < filters.length; i++) {
		const filter = filters[i];
		if (!filter) {
			throw new InvalidBloomFilterParameterError(
				`Invalid filter at index ${i}`,
				{
					value: i,
					expected: "valid BloomFilter",
					docsPath: "/primitives/bloom-filter/combine#error-handling",
				},
			);
		}
		if (filter.m !== first.m || filter.k !== first.k) {
			throw new InvalidBloomFilterParameterError(
				"Cannot combine filters with different parameters",
				{
					value: { m: filter.m, k: filter.k, index: i },
					expected: `m=${first.m}, k=${first.k}`,
					docsPath: "/primitives/bloom-filter/combine#error-handling",
				},
			);
		}
		if (filter.length !== first.length) {
			throw new InvalidBloomFilterParameterError(
				"Cannot combine filters with different sizes",
				{
					value: { length: filter.length, index: i },
					expected: `${first.length} bytes`,
					docsPath: "/primitives/bloom-filter/combine#error-handling",
				},
			);
		}
	}

	const result = new Uint8Array(first.length);
	for (let i = 0; i < first.length; i++) {
		let combined = 0;
		for (const filter of filters) {
			const byte = filter[i];
			if (byte === undefined) {
				throw new InvalidBloomFilterParameterError(
					`Invalid bloom filter data at index ${i}`,
					{
						value: i,
						expected: "valid byte data",
						docsPath: "/primitives/bloom-filter/combine#error-handling",
					},
				);
			}
			combined |= byte;
		}
		result[i] = combined;
	}

	Object.defineProperty(result, "k", {
		value: first.k,
		writable: false,
		enumerable: true,
	});
	Object.defineProperty(result, "m", {
		value: first.m,
		writable: false,
		enumerable: true,
	});

	return /** @type {import('./BrandedBloomFilter.ts').BrandedBloomFilter} */ (
		result
	);
}
