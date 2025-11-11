// @ts-nocheck
import { toHex } from "./toHex.js";

/**
 * Extract ABI from bytecode by analyzing selectors and event hashes
 *
 * @param {import('./BrandedBytecode.js').BrandedBytecode} bytecode - Bytecode to analyze
 * @returns {import('./BrandedBytecode.js').BrandedAbi} Extracted ABI with function selectors and event hashes
 *
 * @example
 * ```typescript
 * const bytecode = BrandedBytecode.from("0x608060...");
 * const abi = toAbi(bytecode);
 * // [
 * //   { type: "function", selector: "0xa9059cbb", stateMutability: "nonpayable", payable: false },
 * //   { type: "event", hash: "0xddf252ad..." }
 * // ]
 * ```
 */
export function toAbi(bytecode) {
	const abi = [];
	const selectors = new Set();
	const eventHashes = new Set();

	// Scan bytecode for patterns
	for (let i = 0; i < bytecode.length; i++) {
		const opcode = bytecode[i];

		// PUSH4 (0x63) followed by 4 bytes - potential function selector
		if (opcode === 0x63 && i + 4 < bytecode.length) {
			const selector = `0x${Array.from(bytecode.slice(i + 1, i + 5))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
			selectors.add(selector);
			i += 4; // Skip the 4 selector bytes
			continue;
		}

		// PUSH32 (0x7f) followed by 32 bytes - potential event hash
		if (opcode === 0x7f && i + 32 < bytecode.length) {
			const hash = `0x${Array.from(bytecode.slice(i + 1, i + 33))
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
			// Event hashes are used with LOG opcodes (0xa0-0xa4)
			// Look ahead for LOG instruction (up to 100 bytes)
			for (let j = i + 33; j < Math.min(i + 133, bytecode.length); j++) {
				if (bytecode[j] >= 0xa0 && bytecode[j] <= 0xa4) {
					eventHashes.add(hash);
					break;
				}
			}
			i += 32; // Skip the 32 hash bytes
		}
	}

	// Add function selectors to ABI
	for (const selector of selectors) {
		abi.push({
			type: "function",
			selector,
			stateMutability: "nonpayable",
			payable: false,
		});
	}

	// Add event hashes to ABI
	for (const hash of eventHashes) {
		abi.push({
			type: "event",
			hash,
		});
	}

	// Add __tag brand (before freezing)
	Object.defineProperty(abi, "__tag", {
		value: "Abi",
		writable: false,
		enumerable: false,
		configurable: false,
	});

	// Make readonly
	const brandedAbi = Object.freeze(abi);

	return brandedAbi;
}
