// @ts-check

/** @import { Parameter } from "./Parameter.js" */
/** @import { ParametersToPrimitiveTypes } from "./Parameter.js" */

import { createDecodeBudget, decodeValue } from "./decodeValue.js";

/**
 * Decode ABI-encoded parameters.
 *
 * One decode budget (element count and copied bytes) is shared by every
 * top-level parameter and nested value, so offsets that alias the same tail
 * from several parameters cannot multiply the work or memory of a decode.
 *
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {Uint8Array} data
 * @returns {ParametersToPrimitiveTypes<TParams>}
 * @throws {import("./Errors.js").AbiDecodingError} If the data is malformed or the decode budget is exceeded
 */
export function decodeParameters(params, data) {
	/** @type {unknown[]} */
	const result = [];
	let offset = 0;
	const budget = createDecodeBudget(data);

	for (const param of params) {
		const { value, newOffset } = decodeValue(
			param.type,
			data,
			offset,
			param.components,
			budget,
		);
		result.push(value);
		offset = newOffset;
	}

	return /** @type {ParametersToPrimitiveTypes<TParams>} */ (result);
}
