/**
 * ModExp (EIP-198 / EIP-2565) synchronous native implementation using Zig C ABI.
 * Wires `modexp` and `modexpBytes` directly to `primitives_modexp`.
 */

import { calculateGas } from "../../crypto/ModExp/calculateGas.js";
import type { ModExp as ModExpJS } from "../../crypto/ModExp/index.js";
import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";

function bytesToBigInt(bytes: Uint8Array): bigint {
	let result = 0n;
	for (let i = 0; i < bytes.length; i++) {
		result = (result << 8n) | BigInt(bytes[i] ?? 0);
	}
	return result;
}

function bigIntToMinimalBytes(value: bigint): Uint8Array {
	if (value === 0n) return new Uint8Array(0);
	const hex = value.toString(16);
	const padded = hex.length % 2 === 1 ? `0${hex}` : hex;
	const out = new Uint8Array(padded.length / 2);
	for (let i = 0; i < out.length; i++) {
		out[i] = Number.parseInt(padded.slice(i * 2, i * 2 + 2), 16);
	}
	return out;
}

function isAllZero(bytes: Uint8Array): boolean {
	for (let i = 0; i < bytes.length; i++) {
		if (bytes[i] !== 0) return false;
	}
	return true;
}

/**
 * Modular exponentiation over EIP-198 big-endian byte arrays via native Zig FFI.
 * Output length matches `modBytes.length`.
 */
export function modexpBytes(
	baseBytes: Uint8Array,
	expBytes: Uint8Array,
	modBytes: Uint8Array,
): Uint8Array {
	if (modBytes.length === 0 || isAllZero(modBytes)) {
		throw new Error("Division by zero: modulus cannot be zero");
	}
	const lib = loadNativeSync();
	const out = allocateOutput(modBytes.length);
	const code = lib.primitives_modexp(
		safeBufferPtr(baseBytes),
		baseBytes.length,
		safeBufferPtr(expBytes),
		expBytes.length,
		modBytes,
		modBytes.length,
		out,
		modBytes.length,
	);
	checkError(code, "modexp");
	return out;
}

/**
 * Arbitrary-precision modular exponentiation `base^exp mod modulus` via native Zig FFI.
 */
export function modexp(base: bigint, exp: bigint, modulus: bigint): bigint {
	if (modulus === 0n) {
		throw new Error("Division by zero: modulus cannot be zero");
	}
	if (modulus === 1n) {
		return 0n;
	}
	if (exp === 0n) {
		return 1n;
	}
	if (base === 0n) {
		return 0n;
	}
	const modBytes = bigIntToMinimalBytes(modulus);
	const baseBytes = bigIntToMinimalBytes(base);
	const expBytes = bigIntToMinimalBytes(exp);
	const out = modexpBytes(baseBytes, expBytes, modBytes);
	return bytesToBigInt(out);
}

export { calculateGas };

export const ModExp = Object.assign(modexp, {
	modexp,
	modexpBytes,
	calculateGas,
}) satisfies typeof ModExpJS;
