import { parseUnits } from "./parse-units.js";

/**
 * Parse gwei string to wei (9 decimals)
 *
 * @param gwei - Gwei amount as string (e.g., "1.5")
 * @returns Wei amount as bigint
 *
 * @example
 * parseGwei("1") // 1000000000n
 * parseGwei("1.5") // 1500000000n
 * parseGwei("0.000000001") // 1n
 * parseGwei("-1") // -1000000000n
 */
export function parseGwei(gwei: string): bigint {
	return parseUnits(gwei, 9);
}
