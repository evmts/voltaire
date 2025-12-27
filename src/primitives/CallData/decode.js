import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { decodeParameters } from "../Abi/Encoding.js";
import { getSelector } from "./getSelector.js";
import { SELECTOR_SIZE } from "./constants.js";
import * as Hex from "../Hex/index.js";

/**
 * Decoded calldata structure
 * @typedef {Object} CallDataDecoded
 * @property {Uint8Array} selector - 4-byte function selector
 * @property {string | null} signature - Human-readable function signature (if ABI provided)
 * @property {unknown[]} parameters - Decoded parameter values
 */

/**
 * Decode CallData to structured form
 *
 * @param {import('./CallDataType.js').CallDataType} calldata - CallData to decode
 * @param {import('../Abi/AbiType.js').AbiType} abi - ABI specification with function definitions
 * @returns {CallDataDecoded} Decoded structure with selector, signature, and parameters
 * @throws {Error} If function not found in ABI or decoding fails
 *
 * @example
 * ```javascript
 * const abi = [{
 *   name: "transfer",
 *   type: "function",
 *   inputs: [
 *     { name: "to", type: "address" },
 *     { name: "amount", type: "uint256" }
 *   ]
 * }];
 *
 * const decoded = CallData.decode(calldata, abi);
 * console.log(decoded.signature); // "transfer(address,uint256)"
 * console.log(decoded.parameters[0]); // "0x..."
 * console.log(decoded.parameters[1]); // bigint
 * ```
 */
export function decode(calldata, abi) {
	const selector = getSelector(calldata);
	const selectorHex = Hex.fromBytes(selector).toLowerCase();

	// Find matching function in ABI
	const functionItem = abi.find((item) => {
		if (item.type !== "function") return false;

		// Compute selector from function signature
		const inputs = item.inputs || [];
		const types = inputs.map((input) => input.type).join(",");
		const signature = `${item.name}(${types})`;

		// Compute keccak256 hash of signature
		const encoder = new TextEncoder();
		const signatureBytes = encoder.encode(signature);
		const hash = keccak256(signatureBytes);
		const itemSelectorHex = Hex.fromBytes(hash.slice(0, 4)).toLowerCase();

		return itemSelectorHex === selectorHex;
	});

	if (!functionItem || functionItem.type !== "function") {
		throw new Error(`Function not found in ABI for selector ${selectorHex}`);
	}

	// Build signature string
	const inputs = functionItem.inputs || [];
	const types = inputs.map((input) => input.type).join(",");
	const signature = `${functionItem.name}(${types})`;

	// Decode parameters
	const paramsData = calldata.subarray(SELECTOR_SIZE);

	/** @type {unknown[]} */
	let parameters = [];
	if (inputs.length > 0 && paramsData.length > 0) {
		// Convert inputs to parameter objects
		const parameterObjects = inputs.map((input) => ({
			type: input.type,
			name: input.name || "",
			components: input.components,
		}));

		parameters = decodeParameters(
			/** @type {any} */ (parameterObjects),
			paramsData,
		);
	}

	return {
		selector,
		signature,
		parameters,
	};
}
