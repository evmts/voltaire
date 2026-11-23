import { DecodingError, InvalidTransactionTypeError } from "../errors/index.js";
import { decode } from "../Rlp/decode.js";
import { encode } from "../Rlp/encode.js";
import type { BrandedRlp } from "../Rlp/RlpType.js";
import { detectType } from "./detectType.js";
import * as EIP1559 from "./EIP1559/deserialize.js";
import * as EIP2930 from "./EIP2930/deserialize.js";
import * as EIP4844 from "./EIP4844/deserialize.js";
import * as EIP7702 from "./EIP7702/deserialize.js";
import * as Legacy from "./Legacy/deserialize.js";
import { Type } from "./types.js";
import type {
	Unsigned,
	UnsignedEIP1559,
	UnsignedEIP2930,
	UnsignedEIP4844,
	UnsignedEIP7702,
	UnsignedLegacy,
} from "./UnsignedType.js";

const DOCS = "/primitives/transaction/deserialize-unsigned#error-handling";

/** Unsigned field counts per typed transaction (signed count minus 3). */
const TYPED_FIELDS: Record<number, number> = {
	[Type.EIP2930]: 8,
	[Type.EIP1559]: 9,
	[Type.EIP4844]: 11,
	[Type.EIP7702]: 10,
};

const EMPTY: BrandedRlp = { type: "bytes", value: new Uint8Array(0) };

function decodeList(rlp: Uint8Array, label: string): BrandedRlp[] {
	const decoded = decode(rlp);
	if (decoded.data.type !== "list") {
		throw new DecodingError(
			`Invalid unsigned ${label} transaction: expected list`,
			{
				code: -32602,
				context: { type: decoded.data.type },
				docsPath: DOCS,
			},
		);
	}
	return decoded.data.value;
}

function fieldCountError(label: string, expected: string, actual: number) {
	return new DecodingError(
		`Invalid unsigned ${label} transaction: expected ${expected} fields, got ${actual}`,
		{
			code: -32602,
			context: { expected, actual },
			docsPath: DOCS,
		},
	);
}

function deserializeLegacy(data: Uint8Array): UnsignedLegacy {
	const fields = decodeList(data, "legacy");
	if (fields.length === 6) {
		// Pre-EIP-155: pad v, r, s so the signed decoder validates every field.
		const {
			v: _v,
			r: _r,
			s: _s,
			...tx
		} = Legacy.deserialize(
			encode({ type: "list", value: [...fields, EMPTY, EMPTY, EMPTY] }),
		);
		return tx;
	}
	if (fields.length === 9) {
		// EIP-155: [..., chainId, 0, 0]
		const [r, s] = [fields[7], fields[8]];
		if (
			r?.type !== "bytes" ||
			s?.type !== "bytes" ||
			r.value.length !== 0 ||
			s.value.length !== 0
		) {
			throw new DecodingError(
				"Invalid unsigned legacy transaction: r and s must be empty (EIP-155 signing payload); use deserialize() for signed transactions",
				{
					code: -32602,
					context: {
						rType: r?.type,
						sType: s?.type,
						rLength: r?.value.length,
						sLength: s?.value.length,
					},
					docsPath: DOCS,
				},
			);
		}
		const { v, r: _r, s: _s, ...tx } = Legacy.deserialize(data);
		return { ...tx, chainId: v };
	}
	throw fieldCountError("legacy", "6 or 9", fields.length);
}

/**
 * Deserialize an unsigned transaction (signing payload) produced by
 * `serializeUnsigned`.
 *
 * Accepts:
 * - Legacy: 6 fields (pre-EIP-155) or 9 fields with empty `r`/`s` (EIP-155,
 *   `chainId` read from position 6).
 * - Typed (1, 2, 3, 4): `type || rlp([...fields])` without `yParity`, `r`, `s`.
 *
 * Every field is validated by the same rules as `deserialize`: byte-string or
 * list type, canonical RLP integers, a 20-byte `to` and non-empty
 * authorization list for EIP-7702, and non-empty blob hashes for EIP-4844.
 *
 * @see https://voltaire.tevm.sh/primitives/transaction for Transaction documentation
 * @since 0.1.0
 * @param data - Unsigned serialized transaction
 * @returns Unsigned transaction
 * @throws {DecodingError} If the field count or any field is invalid
 * @throws {InvalidTransactionTypeError} If transaction type is unknown
 * @example
 * ```javascript
 * import { deserializeUnsigned } from './primitives/Transaction/deserializeUnsigned.js';
 * const tx = deserializeUnsigned(bytes);
 * ```
 */
export function deserializeUnsigned(data: Uint8Array): Unsigned {
	const type = detectType(data);
	if (type === Type.Legacy) return deserializeLegacy(data);

	const expected = TYPED_FIELDS[type];
	if (expected === undefined) {
		throw new InvalidTransactionTypeError(`Unknown transaction type: ${type}`, {
			code: -32602,
			context: { type },
			docsPath: DOCS,
		});
	}
	const label = Type[type];
	const fields = decodeList(data.slice(1), label);
	if (fields.length !== expected) {
		throw fieldCountError(label, String(expected), fields.length);
	}
	const rlp = encode({ type: "list", value: [...fields, EMPTY, EMPTY, EMPTY] });
	const padded = new Uint8Array(1 + rlp.length);
	padded[0] = type;
	padded.set(rlp, 1);

	switch (type) {
		case Type.EIP2930: {
			const { yParity: _y, r: _r, s: _s, ...tx } = EIP2930.deserialize(padded);
			return tx as UnsignedEIP2930;
		}
		case Type.EIP1559: {
			const { yParity: _y, r: _r, s: _s, ...tx } = EIP1559.deserialize(padded);
			return tx as UnsignedEIP1559;
		}
		case Type.EIP4844: {
			const { yParity: _y, r: _r, s: _s, ...tx } = EIP4844.deserialize(padded);
			return tx as UnsignedEIP4844;
		}
		default: {
			const { yParity: _y, r: _r, s: _s, ...tx } = EIP7702.deserialize(padded);
			return tx as UnsignedEIP7702;
		}
	}
}
