import * as Abi from "../Abi/index.js";
import { EIP1271_MAGIC_VALUE } from "./constants.js";
import { ContractCallError } from "./errors.js";

/**
 * Check if a contract signature is valid via EIP-1271
 *
 * Calls the contract's isValidSignature(bytes32,bytes) method and checks
 * if it returns the magic value 0x1626ba7e.
 *
 * @see https://eips.ethereum.org/EIPS/eip-1271
 * @param {Object} provider - JSON-RPC provider
 * @param {(method: string, params: unknown[]) => Promise<unknown>} provider.request - JSON-RPC request method
 * @param {import("../Address/AddressType.js").AddressType | string} contractAddress - Contract address to call
 * @param {import("../Hash/HashType/HashType.js").HashType | Uint8Array} hash - Message hash (bytes32)
 * @param {Uint8Array} signature - Signature bytes
 * @returns {Promise<boolean>} True if signature is valid
 * @throws {ContractCallError} If the contract call fails
 *
 * @example
 * ```javascript
 * import { isValidSignature } from './primitives/ContractSignature/isValidSignature.js';
 *
 * const isValid = await isValidSignature(
 *   provider,
 *   '0x1234...', // contract address
 *   messageHash,
 *   signatureBytes
 * );
 * ```
 */
export async function isValidSignature(
	provider,
	contractAddress,
	hash,
	signature,
) {
	try {
		// Define the isValidSignature function ABI
		const fn = {
			type: /** @type {const} */ ("function"),
			name: "isValidSignature",
			stateMutability: /** @type {const} */ ("view"),
			inputs: /** @type {const} */ ([
				{ type: "bytes32", name: "_hash" },
				{ type: "bytes", name: "_signature" },
			]),
			outputs: /** @type {const} */ ([{ type: "bytes4", name: "magicValue" }]),
		};

		// Encode function call
		const data = Abi.Function.encodeParams(fn, [hash, signature]);

		// Convert data to hex string
		let dataHex = "0x";
		for (const byte of data) {
			dataHex += byte.toString(16).padStart(2, "0");
		}

		// Convert contract address to hex if needed
		let addressHex;
		if (typeof contractAddress === "string") {
			addressHex = contractAddress;
		} else {
			addressHex = "0x";
			for (const byte of contractAddress) {
				addressHex += byte.toString(16).padStart(2, "0");
			}
		}

		// Call contract
		const result = await provider.request("eth_call", [
			{
				to: addressHex,
				data: dataHex,
			},
			"latest",
		]);

		// Check if result matches magic value
		if (typeof result !== "string") {
			return false;
		}

		// Compare first 10 characters (0x + 8 hex digits = 4 bytes)
		return result.slice(0, 10).toLowerCase() === EIP1271_MAGIC_VALUE;
	} catch (error) {
		throw new ContractCallError(
			`Failed to call isValidSignature: ${error instanceof Error ? error.message : String(error)}`,
			{ contractAddress, hash, signature, cause: error },
		);
	}
}
