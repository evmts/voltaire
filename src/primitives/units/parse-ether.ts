import { parseUnits } from "./parse-units.js";

/**
 * Parse ether string to wei (18 decimals)
 *
 * @param ether - Ether amount as string (e.g., "1.5")
 * @returns Wei amount as bigint
 *
 * @example
 * parseEther("1") // 1000000000000000000n
 * parseEther("1.5") // 1500000000000000000n
 * parseEther("0.000000000000000001") // 1n
 * parseEther("-1") // -1000000000000000000n
 */
export function parseEther(ether: string): bigint {
	return parseUnits(ether, 18);
}
