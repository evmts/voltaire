// @ts-check

import { hash as keccak256Impl } from "../../crypto/Keccak256/hash.js";
import { toBytes as hexToBytes } from "../Hex/toBytes.js";
import { decodeParameters } from "./decodeParameters.js";
import { CreateViemParameterConverter } from "./toViemParameters.js";

/**
 * Factory: decode ABI parameters with viem `decodeAbiParameters` output semantics
 *
 * `Abi.decodeParameters` returns Voltaire-native values by default: lowercase address
 * strings, `Uint8Array` for `bytes`/`bytesN`, `bigint` for every integer, and
 * arrays for every tuple. The function this factory returns decodes the same
 * data and returns what viem returns:
 *
 * - `address`: EIP-55 checksummed string
 * - `bytes`, `bytesN`: `0x` hex string
 * - `uintN`, `intN` with N <= 48: `number`; wider integers: `bigint`
 * - `tuple` whose components all have names: object keyed by component name
 * - `tuple` with any unnamed component, or no components: array
 * - `bool`, `string`: unchanged
 *
 * The result is always an array with one entry per parameter, including for a
 * single parameter and for an empty parameter list.
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @param {Object} deps - Crypto dependencies
 * @param {(data: Uint8Array) => Uint8Array} deps.keccak256 - Keccak256 hash function, used for EIP-55 checksums
 * @returns {<const TParams extends readonly import('abitype').AbiParameter[]>(params: TParams, data: Uint8Array | `0x${string}`) => import('abitype').AbiParametersToPrimitiveTypes<TParams>}
 * @example
 * ```javascript
 * import { DecodeAbiParameters } from './primitives/Abi/decodeAbiParameters.js';
 * import { hash as keccak256 } from './crypto/Keccak256/hash.js';
 *
 * const decodeAbiParameters = DecodeAbiParameters({ keccak256 });
 * const [owner, nonce] = decodeAbiParameters(
 *   [{ type: 'address' }, { type: 'uint32' }],
 *   data,
 * );
 * // owner: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045", nonce: 7
 * ```
 */
export function DecodeAbiParameters({ keccak256 }) {
	const convertToViem = CreateViemParameterConverter({ keccak256 });

	return function decodeAbiParameters(params, data) {
		const bytes = typeof data === "string" ? hexToBytes(data) : data;
		const native = /** @type {readonly unknown[]} */ (
			/** @type {unknown} */ (
				decodeParameters(
					/** @type {readonly import("./Parameter.js").Parameter[]} */ (
						/** @type {unknown} */ (params)
					),
					bytes,
				)
			)
		);
		return /** @type {import('abitype').AbiParametersToPrimitiveTypes<typeof params>} */ (
			/** @type {unknown} */ (convertToViem(params, native))
		);
	};
}

/**
 * Decode ABI parameters with viem `decodeAbiParameters` output semantics
 *
 * Same argument order and return shape as viem. See {@link DecodeAbiParameters}
 * for the full mapping. Use `Abi.decodeParameters` for Voltaire-native values
 * or pass `{ format: 'viem' }` to `Abi.decodeParameters`.
 *
 * @see https://voltaire.tevm.sh/primitives/abi
 * @since 0.0.0
 * @throws {import('./Errors.js').AbiDecodingError} If the data is too short or malformed for the parameters
 * @example
 * ```javascript
 * import * as Abi from './primitives/Abi/index.js';
 *
 * const [balance] = Abi.decodeAbiParameters([{ type: 'uint256' }], data);
 * const [point] = Abi.decodeAbiParameters(
 *   [{ type: 'tuple', components: [{ name: 'x', type: 'uint8' }, { name: 'y', type: 'uint8' }] }],
 *   data,
 * );
 * // point: { x: 1, y: 2 }
 * ```
 */
export const decodeAbiParameters = DecodeAbiParameters({
	keccak256: keccak256Impl,
});
