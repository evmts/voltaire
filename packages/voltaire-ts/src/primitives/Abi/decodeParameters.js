// @ts-check

/** @import { Parameter } from "./Parameter.js" */
/** @import { ParametersToPrimitiveTypes } from "./Parameter.js" */

import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";
import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import { createDecodeBudget, decodeValue } from "./decodeValue.js";
import { CreateViemParameterConverter } from "./toViemParameters.js";

const defaultViemConverter = CreateViemParameterConverter({
	keccak256: keccak256Impl,
});

/**
 * @typedef {{ format?: "voltaire" | "viem" }} DecodeParametersOptions
 */

/**
 * Decode ABI-encoded parameters using Voltaire-native output types.
 *
 * @template {readonly Parameter[]} TParams
 * @overload
 * @param {TParams} params
 * @param {Uint8Array} data
 * @param {{ format?: "voltaire" }} [options]
 * @returns {ParametersToPrimitiveTypes<TParams>}
 */

/**
 * Decode ABI-encoded parameters using viem `decodeAbiParameters` output types.
 *
 * @template {readonly import('abitype').AbiParameter[]} TParams
 * @overload
 * @param {TParams} params
 * @param {Uint8Array | `0x${string}`} data
 * @param {{ format: "viem" }} options
 * @returns {import('abitype').AbiParametersToPrimitiveTypes<TParams>}
 */

/**
 * Decode ABI-encoded parameters.
 *
 * One decode budget (element count and copied bytes) is shared by every
 * top-level parameter and nested value, so offsets that alias the same tail
 * from several parameters cannot multiply the work or memory of a decode.
 *
 * Defaults to Voltaire-native output (`format: 'voltaire'`). Pass `{ format: 'viem' }`
 * (or call `Abi.decodeAbiParameters`) for viem-compatible output semantics:
 * EIP-55 checksummed addresses, `0x` hex strings for `bytes`/`bytesN`, JS `number`
 * for `uint8..uint48` & `int8..int48`, `bigint` for wider integers, and keyed objects
 * for fully named tuples.
 *
 * @param {readonly Parameter[] | readonly import('abitype').AbiParameter[]} params
 * @param {Uint8Array | `0x${string}`} data
 * @param {DecodeParametersOptions} [options]
 * @returns {unknown}
 * @throws {import("./Errors.js").AbiDecodingError} If the data is malformed or the decode budget is exceeded
 */
export function decodeParameters(params, data, options) {
	const bytes = typeof data === "string" ? hexToBytes(data) : data;
	/** @type {unknown[]} */
	const result = [];
	let offset = 0;
	const budget = createDecodeBudget(bytes);

	for (const param of params) {
		const { value, newOffset } = decodeValue(
			/** @type {Parameter["type"]} */ (param.type),
			bytes,
			offset,
			/** @type {readonly Parameter[] | undefined} */ (
				/** @type {{ components?: readonly Parameter[] }} */ (param).components
			),
			budget,
		);
		result.push(value);
		offset = newOffset;
	}

	if (options?.format === "viem") {
		return defaultViemConverter(params, result);
	}

	return result;
}
