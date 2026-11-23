import { Secp256k1 } from "../../crypto/Secp256k1/index.js";
import type { AddressType as BrandedAddress } from "../Address/AddressType.js";
import { fromPublicKey } from "../Address/internal-index.js";
import {
	DecodingError,
	InvalidFormatError,
	InvalidLengthError,
} from "../errors/index.js";
import type { HashType } from "../Hash/index.js";
import type { BrandedRlp } from "../Rlp/RlpType.js";

type Encodable = Uint8Array | BrandedRlp | Encodable[];

const DOCS = "/primitives/transaction/utils#error-handling";

/**
 * Read an RLP byte-string field. Rejects lists and missing fields.
 * @internal
 *
 * @throws {DecodingError} If the field is not an RLP byte string
 */
export function decodeBytesField(
	field: BrandedRlp | undefined,
	name: string,
): Uint8Array {
	if (field?.type !== "bytes") {
		throw new DecodingError(`Invalid ${name}: expected RLP byte string`, {
			code: -32602,
			context: { field: name, type: field?.type },
			docsPath: DOCS,
		});
	}
	return field.value;
}

/**
 * Read an RLP list field. Rejects byte strings and missing fields.
 * @internal
 *
 * @throws {DecodingError} If the field is not an RLP list
 */
export function decodeListField(
	field: BrandedRlp | undefined,
	name: string,
): BrandedRlp[] {
	if (field?.type !== "list") {
		throw new DecodingError(`Invalid ${name}: expected RLP list`, {
			code: -32602,
			context: { field: name, type: field?.type },
			docsPath: DOCS,
		});
	}
	return field.value;
}

/**
 * Decode a canonical RLP unsigned integer field: a byte string with no
 * leading zero byte (zero is the empty string) of at most `maxBytes` bytes.
 * @internal
 *
 * @throws {DecodingError} If the field is a list, has a leading zero byte, or
 * is longer than `maxBytes`
 */
export function decodeUint(
	field: BrandedRlp | undefined,
	maxBytes: number,
	name = "integer",
): bigint {
	const bytes = decodeBytesField(field, name);
	if (bytes.length > maxBytes) {
		throw new DecodingError(
			`Invalid ${name}: ${bytes.length} bytes exceeds ${maxBytes}`,
			{
				code: -32602,
				context: { field: name, actualLength: bytes.length, maxBytes },
				docsPath: DOCS,
			},
		);
	}
	return decodeBigint(bytes);
}

/**
 * Decode a canonical `yParity` field: the empty string is `0`, the single
 * byte `0x01` is `1`. `0x00`, values above 1 and multi-byte strings are
 * rejected, so each parity has exactly one encoding.
 * @internal
 *
 * @throws {DecodingError} If the field is not a canonical 0 or 1
 */
export function decodeYParity(field: BrandedRlp | undefined): 0 | 1 {
	if (field?.type === "bytes") {
		if (field.value.length === 0) return 0;
		if (field.value.length === 1 && field.value[0] === 1) return 1;
	}
	throw new DecodingError(
		"Invalid yParity: expected canonical RLP integer 0 or 1",
		{
			code: -32602,
			context:
				field?.type === "bytes"
					? {
							type: field.type,
							length: field.value.length,
							first: field.value[0],
						}
					: { type: field?.type },
			docsPath: DOCS,
		},
	);
}

/**
 * Encode bigint as big-endian bytes, removing leading zeros
 * @internal
 */
export function encodeBigintCompact(value: bigint): Uint8Array {
	if (value === 0n) {
		return new Uint8Array(0);
	}

	let byteLength = 0;
	let temp = value;
	while (temp > 0n) {
		byteLength++;
		temp >>= 8n;
	}

	const bytes = new Uint8Array(byteLength);
	let val = value;
	for (let i = byteLength - 1; i >= 0; i--) {
		bytes[i] = Number(val & 0xffn);
		val >>= 8n;
	}
	return bytes;
}

/**
 * Encode a signature scalar (`r`, `s`) as a minimal RLP integer: strip
 * leading zero bytes, so a zero scalar encodes as the empty string.
 * @internal
 */
export function encodeSignatureScalar(value: Uint8Array): Uint8Array {
	let start = 0;
	while (start < value.length && value[start] === 0) start++;
	return value.slice(start);
}

/**
 * Encode `yParity` as a minimal RLP integer (`0` is the empty string).
 * @internal
 */
export function encodeYParity(yParity: number): Uint8Array {
	return encodeBigintCompact(BigInt(yParity));
}

/**
 * Decode a signature scalar (`r`, `s`) from canonical RLP integer bytes and
 * left-pad it to 32 bytes for the public API.
 * @internal
 *
 * @throws {InvalidLengthError} If the value is longer than 32 bytes
 * @throws {DecodingError} If the value has a leading zero byte
 */
export function decodeSignatureScalar(bytes: Uint8Array): Uint8Array {
	if (bytes.length > 32) {
		throw new InvalidLengthError(
			`Invalid signature scalar length: ${bytes.length}`,
			{
				code: -32602,
				value: bytes,
				expected: "at most 32 bytes",
				context: { actualLength: bytes.length },
				docsPath: "/primitives/transaction/utils#error-handling",
			},
		);
	}
	if (bytes.length > 0 && bytes[0] === 0) {
		throw new DecodingError(
			"Non-canonical signature scalar: leading zero byte",
			{
				code: -32602,
				context: { actualLength: bytes.length },
				docsPath: DOCS,
			},
		);
	}
	if (bytes.length === 32) return bytes;
	const out = new Uint8Array(32);
	out.set(bytes, 32 - bytes.length);
	return out;
}

/**
 * Encode address for RLP (empty bytes for null, 20 bytes otherwise)
 * @internal
 *
 * Assumes address is a valid BrandedAddress (20 bytes) or null.
 * Validation happens at the boundary when creating branded types.
 */
export function encodeAddress(address: BrandedAddress | null): Uint8Array {
	if (address === null) {
		return new Uint8Array(0);
	}
	return address;
}

/**
 * Decode address from RLP bytes (null for empty, Address otherwise)
 * @internal
 *
 * Assumes RLP-decoded bytes have been validated. Validation happens at the boundary
 * when creating branded types via Address.from().
 *
 * @throws {InvalidLengthError} If address length is not 0 or 20 bytes
 */
export function decodeAddress(bytes: Uint8Array): BrandedAddress | null {
	if (bytes.length === 0) {
		return null;
	}
	if (bytes.length !== 20) {
		throw new InvalidLengthError(`Invalid address length: ${bytes.length}`, {
			code: -32602,
			value: bytes,
			expected: "20 bytes",
			context: { actualLength: bytes.length },
			docsPath: "/primitives/transaction/utils#error-handling",
		});
	}
	// Safe cast: validates length above
	return bytes as BrandedAddress;
}

/**
 * Decode bigint from canonical big-endian RLP integer bytes (no leading zero
 * byte; zero is the empty string)
 * @internal
 *
 * @throws {DecodingError} If the value has a leading zero byte
 */
export function decodeBigint(bytes: Uint8Array): bigint {
	if (bytes.length === 0) {
		return 0n;
	}
	if (bytes[0] === 0) {
		throw new DecodingError("Non-canonical RLP integer: leading zero byte", {
			code: -32602,
			context: { actualLength: bytes.length },
			docsPath: DOCS,
		});
	}
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		// biome-ignore lint/style/noNonNullAssertion: loop bounds checked
		result = (result << 8n) | BigInt(bytes[i]!);
	}
	return result;
}

/**
 * Recover Address from ECDSA signature
 * @internal
 *
 * Recovers a BrandedAddress from a secp256k1 signature and message hash.
 * Assumes signature components (r, s) and messageHash are valid.
 * Validation happens at the boundary when creating branded types.
 *
 * @param signature Signature components (r, s, v)
 * @param messageHash HashType (32 bytes) of the signed message
 * @returns BrandedAddress recovered from the signature
 */
export function recoverAddress(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	messageHash: HashType,
): BrandedAddress {
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

	let x = 0n;
	let y = 0n;
	for (let i = 0; i < 32; i++) {
		// biome-ignore lint/style/noNonNullAssertion: loop bounds checked
		x = (x << 8n) | BigInt(publicKey[i]!);
		// biome-ignore lint/style/noNonNullAssertion: loop bounds checked
		y = (y << 8n) | BigInt(publicKey[32 + i]!);
	}

	return fromPublicKey(x, y);
}

/**
 * Encode access list for RLP
 * @internal
 *
 * Encodes an access list of BrandedAddress and HashType entries for RLP serialization.
 * Assumes all addresses are valid BrandedAddress (20 bytes) and storage keys are
 * valid HashType (32 bytes). Validation happens at the boundary.
 */
export function encodeAccessList(
	accessList: readonly {
		address: BrandedAddress;
		storageKeys: readonly HashType[];
	}[],
): Encodable[] {
	return accessList.map((item) => [
		item.address,
		item.storageKeys.map((key) => key as Uint8Array),
	]);
}

/**
 * Decode access list from RLP
 * @internal
 *
 * Decodes RLP-encoded access list items into BrandedAddress and HashType arrays.
 * Validates format and length during decoding - this is a boundary between RLP data
 * and typed primitives.
 *
 * @throws {InvalidFormatError} If access list format is invalid
 * @throws {InvalidLengthError} If address or storage key length is invalid
 */
export function decodeAccessList(
	data: BrandedRlp[],
): { address: BrandedAddress; storageKeys: HashType[] }[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 2) {
			throw new InvalidFormatError("Invalid access list item", {
				code: -32602,
				value: item,
				expected: "List with 2 elements [address, storageKeys]",
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		const addressData = item.value[0];
		const keysData = item.value[1];

		if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
			throw new InvalidLengthError("Invalid access list address", {
				code: -32602,
				value: addressData,
				expected: "20 bytes",
				context: { actualLength: addressData?.value?.length },
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		if (keysData?.type !== "list") {
			throw new InvalidFormatError("Invalid access list storage keys", {
				code: -32602,
				value: keysData,
				expected: "List of storage keys",
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		// Safe cast: validates length above
		const address = addressData.value as BrandedAddress;
		const storageKeys = keysData.value.map((keyData: BrandedRlp) => {
			if (keyData.type !== "bytes" || keyData.value.length !== 32) {
				throw new InvalidLengthError("Invalid storage key", {
					code: -32602,
					value: keyData,
					expected: "32 bytes",
					context: { actualLength: keyData.value?.length },
					docsPath: "/primitives/transaction/utils#error-handling",
				});
			}
			// Safe cast: validates length above
			return keyData.value as HashType;
		});

		return { address, storageKeys };
	});
}

/**
 * Encode authorization list for RLP (EIP-7702)
 * @internal
 *
 * Encodes an authorization list where each authorization contains a BrandedAddress.
 * Assumes all addresses are valid BrandedAddress (20 bytes).
 * Validation happens at the boundary when creating branded types.
 */
export function encodeAuthorizationList(
	authList: readonly {
		chainId: bigint;
		address: BrandedAddress;
		nonce: bigint;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}[],
): Encodable[] {
	return authList.map((auth) => [
		encodeBigintCompact(auth.chainId),
		auth.address,
		encodeBigintCompact(auth.nonce),
		encodeYParity(auth.yParity),
		encodeSignatureScalar(auth.r),
		encodeSignatureScalar(auth.s),
	]);
}

/**
 * Decode authorization list from RLP (EIP-7702)
 * @internal
 *
 * Decodes the RLP authorization list field into Authorization objects. Every
 * tuple is `[chainId, address, nonce, yParity, r, s]` with canonical integers:
 * `chainId` at most 32 bytes, `address` exactly 20 bytes, `nonce` at most 8
 * bytes, `yParity` any canonical uint8 (0..255), `r`/`s` at most 32 bytes.
 *
 * EIP-7702 types the tuple's `y_parity` as a uint8 on the wire. A tuple whose
 * parity is not 0 or 1 is skipped during authorization processing; it does
 * not invalidate the transaction, so decoding must accept it.
 *
 * @throws {InvalidFormatError} If the field or a tuple is not a list of 6 byte strings
 * @throws {DecodingError} If an integer is non-canonical or out of range
 * @throws {InvalidLengthError} If the address is not 20 bytes or a scalar exceeds 32 bytes
 */
export function decodeAuthorizationList(data: BrandedRlp | undefined): {
	chainId: bigint;
	address: BrandedAddress;
	nonce: bigint;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
}[] {
	if (data?.type !== "list") {
		throw new InvalidFormatError("Invalid authorization list", {
			code: -32602,
			value: data,
			expected: "RLP list of authorization tuples",
			docsPath: DOCS,
		});
	}
	return data.value.map((item) => {
		if (
			item.type !== "list" ||
			item.value.length !== 6 ||
			item.value.some((field) => field.type !== "bytes")
		) {
			throw new InvalidFormatError("Invalid authorization item", {
				code: -32602,
				value: item,
				expected:
					"List with 6 byte-string elements [chainId, address, nonce, yParity, r, s]",
				docsPath: DOCS,
			});
		}

		const [chainIdData, addressData, nonceData, yParityData, rData, sData] =
			item.value;

		const address = decodeBytesField(addressData, "authorization address");
		if (address.length !== 20) {
			throw new InvalidLengthError("Invalid authorization address", {
				code: -32602,
				value: address,
				expected: "20 bytes",
				context: { actualLength: address.length },
				docsPath: DOCS,
			});
		}

		return {
			chainId: decodeUint(chainIdData, 32, "authorization chainId"),
			// Safe cast: validates length above (20 bytes)
			address: address as BrandedAddress,
			nonce: decodeUint(nonceData, 8, "authorization nonce"),
			yParity: Number(decodeUint(yParityData, 1, "authorization yParity")),
			r: decodeSignatureScalar(decodeBytesField(rData, "authorization r")),
			s: decodeSignatureScalar(decodeBytesField(sData, "authorization s")),
		};
	});
}
