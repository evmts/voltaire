import { Secp256k1 } from "../../crypto/Secp256k1/index.js";
import type { BrandedAddress } from "../Address/BrandedAddress/BrandedAddress.js";
import { fromPublicKey } from "../Address/BrandedAddress/index.js";
import type { BrandedHash } from "../Hash/index.js";
import type { BrandedRlp } from "../Rlp/BrandedRlp/BrandedRlp.js";
import { InvalidFormatError, InvalidLengthError } from "../errors/index.js";

type Encodable = Uint8Array | BrandedRlp | Encodable[];

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
	for (let i = byteLength - 1; i >= 0; i--) {
		bytes[i] = Number(value & 0xffn);
		value >>= 8n;
	}
	return bytes;
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
			code: "INVALID_ADDRESS_LENGTH",
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
 * Decode bigint from big-endian bytes
 * @internal
 */
export function decodeBigint(bytes: Uint8Array): bigint {
	if (bytes.length === 0) {
		return 0n;
	}
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
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
 * @param messageHash BrandedHash (32 bytes) of the signed message
 * @returns BrandedAddress recovered from the signature
 */
export function recoverAddress(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	messageHash: BrandedHash,
): BrandedAddress {
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

	let x = 0n;
	let y = 0n;
	for (let i = 0; i < 32; i++) {
		x = (x << 8n) | BigInt(publicKey[i]!);
		y = (y << 8n) | BigInt(publicKey[32 + i]!);
	}

	return fromPublicKey(x, y);
}

/**
 * Encode access list for RLP
 * @internal
 *
 * Encodes an access list of BrandedAddress and BrandedHash entries for RLP serialization.
 * Assumes all addresses are valid BrandedAddress (20 bytes) and storage keys are
 * valid BrandedHash (32 bytes). Validation happens at the boundary.
 */
export function encodeAccessList(
	accessList: readonly {
		address: BrandedAddress;
		storageKeys: readonly BrandedHash[];
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
 * Decodes RLP-encoded access list items into BrandedAddress and BrandedHash arrays.
 * Validates format and length during decoding - this is a boundary between RLP data
 * and typed primitives.
 *
 * @throws {InvalidFormatError} If access list format is invalid
 * @throws {InvalidLengthError} If address or storage key length is invalid
 */
export function decodeAccessList(
	data: BrandedRlp[],
): { address: BrandedAddress; storageKeys: BrandedHash[] }[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 2) {
			throw new InvalidFormatError("Invalid access list item", {
				code: "INVALID_ACCESS_LIST_ITEM",
				value: item,
				expected: "List with 2 elements [address, storageKeys]",
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		const addressData = item.value[0];
		const keysData = item.value[1];

		if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
			throw new InvalidLengthError("Invalid access list address", {
				code: "INVALID_ACCESS_LIST_ADDRESS",
				value: addressData,
				expected: "20 bytes",
				context: { actualLength: addressData?.value?.length },
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		if (keysData?.type !== "list") {
			throw new InvalidFormatError("Invalid access list storage keys", {
				code: "INVALID_ACCESS_LIST_KEYS",
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
					code: "INVALID_STORAGE_KEY",
					value: keyData,
					expected: "32 bytes",
					context: { actualLength: keyData.value?.length },
					docsPath: "/primitives/transaction/utils#error-handling",
				});
			}
			// Safe cast: validates length above
			return keyData.value as BrandedHash;
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
		new Uint8Array([auth.yParity]),
		auth.r,
		auth.s,
	]);
}

/**
 * Decode authorization list from RLP (EIP-7702)
 * @internal
 *
 * Decodes RLP-encoded authorization items into Authorization objects containing
 * BrandedAddress values. Validates format and length during decoding - this is
 * a boundary between RLP data and typed primitives.
 *
 * @throws {InvalidFormatError} If authorization list format is invalid
 */
export function decodeAuthorizationList(data: BrandedRlp[]): {
	chainId: bigint;
	address: BrandedAddress;
	nonce: bigint;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
}[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 6) {
			throw new InvalidFormatError("Invalid authorization item", {
				code: "INVALID_AUTHORIZATION_ITEM",
				value: item,
				expected:
					"List with 6 elements [chainId, address, nonce, yParity, r, s]",
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		const [chainIdData, addressData, nonceData, yParityData, rData, sData] =
			item.value;

		if (
			!chainIdData ||
			chainIdData.type !== "bytes" ||
			!addressData ||
			addressData.type !== "bytes" ||
			addressData.value.length !== 20 ||
			!nonceData ||
			nonceData.type !== "bytes" ||
			!yParityData ||
			yParityData.type !== "bytes" ||
			yParityData.value.length !== 1 ||
			!rData ||
			rData.type !== "bytes" ||
			rData.value.length !== 32 ||
			!sData ||
			sData.type !== "bytes" ||
			sData.value.length !== 32
		) {
			throw new InvalidFormatError("Invalid authorization data", {
				code: "INVALID_AUTHORIZATION_DATA",
				value: item,
				expected:
					"Valid authorization data with correct field types and lengths",
				docsPath: "/primitives/transaction/utils#error-handling",
			});
		}

		return {
			chainId: decodeBigint(chainIdData.value),
			// Safe cast: validates length above (20 bytes)
			address: addressData.value as BrandedAddress,
			nonce: decodeBigint(nonceData.value),
			yParity: yParityData.value[0]!,
			r: rData.value,
			s: sData.value,
		};
	});
}
