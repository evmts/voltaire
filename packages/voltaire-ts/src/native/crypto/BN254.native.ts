/**
 * BN254 (alt_bn128) synchronous native implementation using Zig C ABI (EIP-196 / EIP-197).
 * Wires G1.add, G1.mul, Pairing.pairingCheck, and raw EIP-196/197 helpers directly
 * to `primitives_bn254_ecadd`, `primitives_bn254_ecmul`, and `primitives_bn254_ecpairing`.
 */

import type { BN254 as BN254JS } from "../../crypto/bn254/BN254.js";
import { deserializeG1 } from "../../crypto/bn254/deserializeG1.js";
import { deserializeG2 } from "../../crypto/bn254/deserializeG2.js";
import { Bn254Error } from "../../crypto/bn254/errors.js";
import * as Fp from "../../crypto/bn254/Fp/index.js";
import * as Fp2 from "../../crypto/bn254/Fp2/index.js";
import * as Fr from "../../crypto/bn254/Fr/index.js";
import * as G1JS from "../../crypto/bn254/G1/index.js";
import type { G1PointType } from "../../crypto/bn254/G1PointType.js";
import * as G2JS from "../../crypto/bn254/G2/index.js";
import type { G2PointType } from "../../crypto/bn254/G2PointType.js";
import * as PairingJS from "../../crypto/bn254/Pairing/index.js";
import { serializeG1 } from "../../crypto/bn254/serializeG1.js";
import { serializeG2 } from "../../crypto/bn254/serializeG2.js";
import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";

function writeBigInt32BE(target: Uint8Array, offset: number, value: bigint): void {
	let v = value;
	for (let i = 31; i >= 0; i--) {
		target[offset + i] = Number(v & 0xffn);
		v >>= 8n;
	}
}

function encodeG1Eip196(point: G1PointType, target: Uint8Array, offset: number): void {
	if (G1JS.isZero(point)) {
		target.fill(0, offset, offset + 64);
		return;
	}
	const affine = G1JS.toAffine(point);
	writeBigInt32BE(target, offset, affine.x);
	writeBigInt32BE(target, offset + 32, affine.y);
}

function encodeG2Eip197(point: G2PointType, target: Uint8Array, offset: number): void {
	if (G2JS.isZero(point)) {
		target.fill(0, offset, offset + 128);
		return;
	}
	const affine = G2JS.toAffine(point);
	// EIP-197 encodes Fp2 coordinates as imaginary (c1) followed by real (c0)
	writeBigInt32BE(target, offset, affine.x.c1);
	writeBigInt32BE(target, offset + 32, affine.x.c0);
	writeBigInt32BE(target, offset + 64, affine.y.c1);
	writeBigInt32BE(target, offset + 96, affine.y.c0);
}

/**
 * Raw EIP-196 BN254 ECADD over big-endian byte input (up to 128 bytes) -> 64-byte G1 output.
 */
export function ecadd(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(64);
	const code = lib.primitives_bn254_ecadd(
		safeBufferPtr(input),
		input.length,
		out,
		64,
	);
	checkError(code, "bn254_ecadd");
	return out;
}

/**
 * Raw EIP-196 BN254 ECMUL over big-endian byte input (up to 96 bytes) -> 64-byte G1 output.
 */
export function ecmul(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(64);
	const code = lib.primitives_bn254_ecmul(
		safeBufferPtr(input),
		input.length,
		out,
		64,
	);
	checkError(code, "bn254_ecmul");
	return out;
}

/**
 * Raw EIP-197 BN254 ECPAIRING over `192 * k` bytes -> boolean pairing check result.
 */
export function ecpairing(input: Uint8Array): boolean {
	if (input.length % 192 !== 0) {
		throw new Bn254Error(
			`BN254 pairing input must be a multiple of 192 bytes, got ${input.length}`,
			{ code: "INVALID_LENGTH" },
		);
	}
	const lib = loadNativeSync();
	const out = allocateOutput(32);
	const code = lib.primitives_bn254_ecpairing(
		safeBufferPtr(input),
		input.length,
		out,
		32,
	);
	checkError(code, "bn254_ecpairing");
	return out[31] === 1;
}

function g1AddNative(p1: G1PointType, p2: G1PointType): G1PointType {
	const input = new Uint8Array(128);
	encodeG1Eip196(p1, input, 0);
	encodeG1Eip196(p2, input, 64);
	return deserializeG1(ecadd(input));
}

function g1MulNative(point: G1PointType, scalar: bigint): G1PointType {
	if (scalar === 0n || G1JS.isZero(point)) {
		return G1JS.infinity();
	}
	const input = new Uint8Array(96);
	encodeG1Eip196(point, input, 0);
	writeBigInt32BE(input, 64, Fr.mod(scalar));
	return deserializeG1(ecmul(input));
}

function pairingCheckNative(
	pairs: Array<[G1PointType, G2PointType]>,
): boolean {
	const input = new Uint8Array(pairs.length * 192);
	for (let i = 0; i < pairs.length; i++) {
		const pair = pairs[i];
		if (!pair) continue;
		const offset = i * 192;
		encodeG1Eip196(pair[0], input, offset);
		encodeG2Eip197(pair[1], input, offset + 64);
	}
	return ecpairing(input);
}

export const G1: typeof G1JS = {
	...G1JS,
	add: g1AddNative,
	mul: g1MulNative,
};

export const G2 = G2JS;

export const Pairing: typeof PairingJS = {
	...PairingJS,
	pairingCheck: pairingCheckNative,
};

export {
	deserializeG1,
	deserializeG2,
	Fp,
	Fp2,
	Fr,
	serializeG1,
	serializeG2,
};

export const BN254 = {
	Fp,
	Fp2,
	Fr,
	G1,
	G2,
	Pairing,
	serializeG1,
	deserializeG1,
	serializeG2,
	deserializeG2,
	ecadd,
	ecmul,
	ecpairing,
} satisfies typeof BN254JS & {
	ecadd: typeof ecadd;
	ecmul: typeof ecmul;
	ecpairing: typeof ecpairing;
};

export default BN254;
