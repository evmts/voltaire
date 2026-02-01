/**
 * @typedef {import('../Address/index.js').AddressType} BrandedAddress
 * @typedef {import('../Hash/HashType.js').HashType} HashType
 */
/**
 * Compare two hashes for equality
 * @internal
 * @param {HashType} a
 * @param {HashType} b
 * @returns {boolean}
 */
export function hashEquals(a: HashType, b: HashType): boolean;
/**
 * Compare two addresses for equality (byte-wise comparison)
 * @internal
 * @param {BrandedAddress} a
 * @param {BrandedAddress} b
 * @returns {boolean}
 */
export function addressEquals(a: BrandedAddress, b: BrandedAddress): boolean;
export type BrandedAddress = import("../Address/index.js").AddressType;
export type HashType = import("../Hash/HashType.js").HashType;
//# sourceMappingURL=utils.d.ts.map