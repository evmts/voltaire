/**
 * Calculate gas cost for account access with warm/cold distinction (EIP-2929)
 *
 * Determines if an address is warm (already accessed in transaction) or cold
 * (first access in transaction). Returns appropriate gas cost based on hardfork.
 *
 * Hardfork-dependent costs:
 * - Berlin+: 2600 (cold) / 100 (warm) - EIP-2929
 * - Istanbul-Berlin: 700 (uniform)
 * - Tangerine Whistle-Istanbul: 400 (uniform, EIP-1884 for BALANCE/EXTCODESIZE)
 * - Pre-Tangerine Whistle: 20 (uniform)
 *
 * @param {*} frame - Frame with hardfork config
 * @param {import("../../primitives/Address/AddressType.js").AddressType} address - Address to check
 * @returns {bigint} Gas cost for the access
 */
export function gasCostAccessAddress(frame: any, address: import("../../primitives/Address/AddressType.js").AddressType): bigint;
/**
 * Check if hardfork supports Constantinople or later
 *
 * Used for opcodes introduced in Constantinople (EIP-1052: EXTCODEHASH)
 *
 * @param {*} frame - Frame with hardfork config
 * @returns {boolean} True if hardfork is Constantinople or later
 */
export function supportsConstantinople(frame: any): boolean;
//# sourceMappingURL=gasCostAccessAddress.d.ts.map