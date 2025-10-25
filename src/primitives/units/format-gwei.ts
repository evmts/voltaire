import { formatUnits } from "./format-units.js";

/**
 * Format wei to gwei string (9 decimals)
 *
 * @param wei - Wei amount as bigint
 * @returns Gwei amount as string
 *
 * @example
 * formatGwei(1000000000n) // "1"
 * formatGwei(1500000000n) // "1.5"
 * formatGwei(1n) // "0.000000001"
 * formatGwei(-1000000000n) // "-1"
 */
export function formatGwei(wei: bigint): string {
	return formatUnits(wei, 9);
}
