import { formatUnits } from "./format-units.js";

/**
 * Format wei to ether string (18 decimals)
 *
 * @param wei - Wei amount as bigint
 * @returns Ether amount as string
 *
 * @example
 * formatEther(1000000000000000000n) // "1"
 * formatEther(1500000000000000000n) // "1.5"
 * formatEther(1n) // "0.000000000000000001"
 * formatEther(-1000000000000000000n) // "-1"
 */
export function formatEther(wei: bigint): string {
	return formatUnits(wei, 18);
}
