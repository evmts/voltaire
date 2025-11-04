import { Secp256k1 } from "../../crypto/secp256k1.js";
import type { Address } from "../Address/index.js";
import * as AddressNamespace from "../Address/index.js";
import type { Hash } from "../Hash/index.js";
import type * as Rlp from "../Rlp/index.js";

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
 */
export function encodeAddress(address: Address | null): Uint8Array {
	if (address === null) {
		return new Uint8Array(0);
	}
	return address;
}

/**
 * Decode address from RLP bytes (null for empty, Address otherwise)
 * @internal
 */
export function decodeAddress(bytes: Uint8Array): Address | null {
	if (bytes.length === 0) {
		return null;
	}
	if (bytes.length !== 20) {
		throw new Error(`Invalid address length: ${bytes.length}`);
	}
	return bytes as Address;
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
 */
export function recoverAddress(
	signature: { r: Uint8Array; s: Uint8Array; v: number },
	messageHash: Hash,
): Address {
	const publicKey = Secp256k1.recoverPublicKey(signature, messageHash);

	let x = 0n;
	let y = 0n;
	for (let i = 0; i < 32; i++) {
		x = (x << 8n) | BigInt(publicKey[i]!);
		y = (y << 8n) | BigInt(publicKey[32 + i]!);
	}

	return AddressNamespace.fromPublicKey(x, y);
}

/**
 * Encode access list for RLP
 * @internal
 */
export function encodeAccessList(
	accessList: readonly { address: Address; storageKeys: readonly Hash[] }[],
): Rlp.Encodable[] {
	return accessList.map((item) => [
		item.address,
		item.storageKeys.map((key) => key as Uint8Array),
	]);
}

/**
 * Decode access list from RLP
 * @internal
 */
export function decodeAccessList(
	data: Rlp.Data[],
): { address: Address; storageKeys: Hash[] }[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 2) {
			throw new Error("Invalid access list item");
		}

		const addressData = item.value[0];
		const keysData = item.value[1];

		if (addressData?.type !== "bytes" || addressData.value.length !== 20) {
			throw new Error("Invalid access list address");
		}

		if (keysData?.type !== "list") {
			throw new Error("Invalid access list storage keys");
		}

		const address = addressData.value as Address;
		const storageKeys = keysData.value.map((keyData) => {
			if (keyData.type !== "bytes" || keyData.value.length !== 32) {
				throw new Error("Invalid storage key");
			}
			return keyData.value as Hash;
		});

		return { address, storageKeys };
	});
}

/**
 * Encode authorization list for RLP (EIP-7702)
 * @internal
 */
export function encodeAuthorizationList(
	authList: readonly {
		chainId: bigint;
		address: Address;
		nonce: bigint;
		yParity: number;
		r: Uint8Array;
		s: Uint8Array;
	}[],
): Rlp.Encodable[] {
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
 */
export function decodeAuthorizationList(data: Rlp.Data[]): {
	chainId: bigint;
	address: Address;
	nonce: bigint;
	yParity: number;
	r: Uint8Array;
	s: Uint8Array;
}[] {
	return data.map((item) => {
		if (item.type !== "list" || item.value.length !== 6) {
			throw new Error("Invalid authorization item");
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
			throw new Error("Invalid authorization data");
		}

		return {
			chainId: decodeBigint(chainIdData.value),
			address: addressData.value as Address,
			nonce: decodeBigint(nonceData.value),
			yParity: yParityData.value[0]!,
			r: rData.value,
			s: sData.value,
		};
	});
}
