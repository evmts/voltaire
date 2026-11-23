import { InvalidTransactionTypeError } from "../errors/index.js";
import { encode } from "../Rlp/encode.js";
import { type Any, Type } from "./types.js";
import type { Unsigned } from "./UnsignedType.js";
import {
	encodeAccessList,
	encodeAddress,
	encodeAuthorizationList,
	encodeBigintCompact,
} from "./utils.js";

/**
 * Legacy chain ID: an explicit `chainId` wins, otherwise derive it from an
 * EIP-155 `v` (`v >= 35`) when a signed legacy transaction is passed.
 */
function legacyChainId(tx: {
	chainId?: bigint | null;
	v?: bigint;
}): bigint | null {
	if (tx.chainId !== undefined && tx.chainId !== null) return tx.chainId;
	if (tx.v !== undefined && tx.v >= 35n) return (tx.v - 35n) / 2n;
	return null;
}

function typed(type: Type, fields: Uint8Array[] | unknown[]): Uint8Array {
	// biome-ignore lint/suspicious/noExplicitAny: RLP encodable nested arrays
	const rlp = encode(fields as any);
	const out = new Uint8Array(1 + rlp.length);
	out[0] = type;
	out.set(rlp, 1);
	return out;
}

/**
 * Serialize an unsigned transaction to its signing payload.
 *
 * The output is the exact byte string whose keccak256 is the signing hash:
 * - Legacy: `rlp([nonce, gasPrice, gasLimit, to, value, data])`, or the
 *   EIP-155 form `rlp([..., chainId, 0, 0])` when `chainId` is set.
 * - Typed (1, 2, 3, 4): `type || rlp([...fields])` without `yParity`, `r`, `s`.
 *
 * Signature fields on the input are ignored, so a signed transaction can be
 * passed to get its unsigned envelope.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.1.0
 * @param tx - Unsigned (or signed) transaction
 * @returns Unsigned serialized transaction
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 * @example
 * ```javascript
 * import { serializeUnsigned } from './primitives/Transaction/serializeUnsigned.js';
 * const bytes = serializeUnsigned({ type: 2, chainId: 1n, nonce: 0n, ... });
 * ```
 */
export function serializeUnsigned(tx: Unsigned | Any): Uint8Array {
	switch (tx.type) {
		case Type.Legacy: {
			const fields = [
				encodeBigintCompact(tx.nonce),
				encodeBigintCompact(tx.gasPrice),
				encodeBigintCompact(tx.gasLimit),
				encodeAddress(tx.to),
				encodeBigintCompact(tx.value),
				tx.data,
			];
			const chainId = legacyChainId(
				tx as { chainId?: bigint | null; v?: bigint },
			);
			if (chainId !== null) {
				fields.push(
					encodeBigintCompact(chainId),
					new Uint8Array(0),
					new Uint8Array(0),
				);
			}
			return encode(fields);
		}
		case Type.EIP2930:
			return typed(Type.EIP2930, [
				encodeBigintCompact(tx.chainId),
				encodeBigintCompact(tx.nonce),
				encodeBigintCompact(tx.gasPrice),
				encodeBigintCompact(tx.gasLimit),
				encodeAddress(tx.to),
				encodeBigintCompact(tx.value),
				tx.data,
				encodeAccessList(tx.accessList),
			]);
		case Type.EIP1559:
			return typed(Type.EIP1559, [
				encodeBigintCompact(tx.chainId),
				encodeBigintCompact(tx.nonce),
				encodeBigintCompact(tx.maxPriorityFeePerGas),
				encodeBigintCompact(tx.maxFeePerGas),
				encodeBigintCompact(tx.gasLimit),
				encodeAddress(tx.to),
				encodeBigintCompact(tx.value),
				tx.data,
				encodeAccessList(tx.accessList),
			]);
		case Type.EIP4844:
			return typed(Type.EIP4844, [
				encodeBigintCompact(tx.chainId),
				encodeBigintCompact(tx.nonce),
				encodeBigintCompact(tx.maxPriorityFeePerGas),
				encodeBigintCompact(tx.maxFeePerGas),
				encodeBigintCompact(tx.gasLimit),
				// Never null for blob transactions; encode null as empty so deserialize rejects it.
				encodeAddress(tx.to),
				encodeBigintCompact(tx.value),
				tx.data,
				encodeAccessList(tx.accessList),
				encodeBigintCompact(tx.maxFeePerBlobGas),
				tx.blobVersionedHashes.map((h) => h),
			]);
		case Type.EIP7702:
			return typed(Type.EIP7702, [
				encodeBigintCompact(tx.chainId),
				encodeBigintCompact(tx.nonce),
				encodeBigintCompact(tx.maxPriorityFeePerGas),
				encodeBigintCompact(tx.maxFeePerGas),
				encodeBigintCompact(tx.gasLimit),
				encodeAddress(tx.to),
				encodeBigintCompact(tx.value),
				tx.data,
				encodeAccessList(tx.accessList),
				encodeAuthorizationList(tx.authorizationList),
			]);
		default:
			throw new InvalidTransactionTypeError(
				// biome-ignore lint/suspicious/noExplicitAny: error message for unknown type
				`Unknown transaction type: ${(tx as any).type}`,
				{
					code: -32602,
					// biome-ignore lint/suspicious/noExplicitAny: error context for unknown type
					context: { type: (tx as any).type },
					docsPath: "/primitives/transaction/serialize#error-handling",
				},
			);
	}
}
