// @ts-check

/** @import { Parameter } from "./Parameter.js" */
/** @import { ParametersToPrimitiveTypes } from "./Parameter.js" */

import { AbiParameterMismatchError } from "./Errors.js";
import { encodeValue, encodeUint256 } from "./encodeValue.js";

/**
 * @template {readonly Parameter[]} TParams
 * @param {TParams} params
 * @param {ParametersToPrimitiveTypes<TParams>} values
 * @returns {Uint8Array}
 */
export function encodeParameters(params, values) {
	if (params.length !== values.length) {
		throw new AbiParameterMismatchError(
			`Parameter count mismatch: expected ${params.length}, got ${values.length}`,
			{
				value: values.length,
				expected: `${params.length} parameters`,
			},
		);
	}

	/** @type {Uint8Array[]} */
	const staticParts = [];
	/** @type {Uint8Array[]} */
	const dynamicParts = [];

	/** @type {Array<{ encoded: Uint8Array; isDynamic: boolean }>} */
	const encodings = [];
	for (let i = 0; i < params.length; i++) {
		const param = params[i];
		if (!param) continue;
		const value = values[i];
		encodings.push(encodeValue(param.type, value, param.components));
	}

	let dynamicOffset = params.length * 32;

	for (const { encoded, isDynamic } of encodings) {
		if (isDynamic) {
			staticParts.push(encodeUint256(BigInt(dynamicOffset)));
			dynamicParts.push(encoded);
			dynamicOffset += encoded.length;
		} else {
			staticParts.push(encoded);
		}
	}

	const totalLength =
		staticParts.reduce((sum, part) => sum + part.length, 0) +
		dynamicParts.reduce((sum, part) => sum + part.length, 0);
	const result = new Uint8Array(totalLength);
	let offset = 0;

	for (const part of staticParts) {
		result.set(part, offset);
		offset += part.length;
	}
	for (const part of dynamicParts) {
		result.set(part, offset);
		offset += part.length;
	}

	return result;
}
