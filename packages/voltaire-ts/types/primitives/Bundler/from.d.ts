/**
 * Create Bundler from address input
 *
 * @param {number | bigint | string | Uint8Array | import('../Address/AddressType.js').AddressType} value - Address value
 * @returns {import('./BundlerType.js').BundlerType} Bundler address
 * @throws {Error} If address format is invalid
 *
 * @example
 * ```typescript
 * const bundler = Bundler.from("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3");
 * ```
 */
export function from(value: number | bigint | string | Uint8Array | import("../Address/AddressType.js").AddressType): import("./BundlerType.js").BundlerType;
//# sourceMappingURL=from.d.ts.map