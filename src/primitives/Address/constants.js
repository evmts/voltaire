/**
 * Address size in bytes
 * @type {20}
 */
export const SIZE = 20;

/**
 * Address hex string size (including 0x prefix)
 * @type {42}
 */
export const HEX_SIZE = 42;

/**
 * Native ETH address constant as defined in ERC-7528
 * Used to represent native ETH in token-related operations
 * @see https://eips.ethereum.org/EIPS/eip-7528
 * @type {string}
 */
export const NATIVE_ASSET_ADDRESS =
	"0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

/**
 * Zero address constant (all zeros, 20 bytes)
 * @type {import('./AddressType.js').AddressType}
 */
export const ZERO_ADDRESS = /** @type {import('./AddressType.js').AddressType} */ (
	new Uint8Array(SIZE)
);

/**
 * Max address constant (all 0xff bytes, 20 bytes)
 * @type {import('./AddressType.js').AddressType}
 */
export const MAX_ADDRESS = /** @type {import('./AddressType.js').AddressType} */ (
	new Uint8Array(SIZE).fill(0xff)
);
