/**
 * Unit conversion utilities
 * Convert between wei, gwei, and ether denominations
 */

export type Hex = `0x${string}`;

/**
 * Format wei value to ether string
 * @param wei - Value in wei (as bigint or hex string)
 * @param decimals - Number of decimal places (default: 18)
 * @returns Formatted ether string
 * @example formatEther(1000000000000000000n) // "1.0"
 */
export function formatEther(wei: bigint | Hex, decimals = 18): string {
	throw new Error("not implemented");
}

/**
 * Format wei value to gwei string
 * @param wei - Value in wei (as bigint or hex string)
 * @param decimals - Number of decimal places (default: 9)
 * @returns Formatted gwei string
 * @example formatGwei(1000000000n) // "1.0"
 */
export function formatGwei(wei: bigint | Hex, decimals = 9): string {
	throw new Error("not implemented");
}

/**
 * Format wei value with custom unit
 * @param wei - Value in wei (as bigint or hex string)
 * @param unit - Unit decimals (e.g., 18 for ether, 9 for gwei, 6 for mwei)
 * @returns Formatted unit string
 * @example formatUnits(1000000n, 6) // "1.0"
 */
export function formatUnits(wei: bigint | Hex, unit: number): string {
	throw new Error("not implemented");
}

/**
 * Parse ether string to wei
 * @param ether - Ether value as string
 * @returns Wei value as bigint
 * @example parseEther("1.0") // 1000000000000000000n
 */
export function parseEther(ether: string): bigint {
	throw new Error("not implemented");
}

/**
 * Parse gwei string to wei
 * @param gwei - Gwei value as string
 * @returns Wei value as bigint
 * @example parseGwei("1.0") // 1000000000n
 */
export function parseGwei(gwei: string): bigint {
	throw new Error("not implemented");
}

/**
 * Parse custom unit string to wei
 * @param value - Unit value as string
 * @param unit - Unit decimals (e.g., 18 for ether, 9 for gwei, 6 for mwei)
 * @returns Wei value as bigint
 * @example parseUnits("1.0", 6) // 1000000n
 */
export function parseUnits(value: string, unit: number): bigint {
	throw new Error("not implemented");
}
