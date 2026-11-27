/**
 * BLS12-381 synchronous native implementation using Zig / blst C ABI (EIP-2537).
 * Wires G1.add, G1.mul, G2.add, G2.mul, Pairing.pairingCheck, and raw EIP-2537
 * MSM / map-to-curve helpers directly to `primitives_bls12_381_*`.
 */

import { aggregate, aggregatePublicKeys } from "../../crypto/Bls12381/aggregate.js";
import {
	aggregateVerify,
	batchVerify,
	fastAggregateVerify,
} from "../../crypto/Bls12381/aggregateVerify.js";
import type { Bls12381 as Bls12381JS } from "../../crypto/Bls12381/Bls12381.js";
import {
	derivePublicKey,
	derivePublicKeyPoint,
} from "../../crypto/Bls12381/derivePublicKey.js";
import { PairingError } from "../../crypto/Bls12381/errors.js";
import * as Fp from "../../crypto/Bls12381/Fp/index.js";
import * as Fp2 from "../../crypto/Bls12381/Fp2/index.js";
import * as Fr from "../../crypto/Bls12381/Fr/index.js";
import * as G1JS from "../../crypto/Bls12381/G1/index.js";
import type { G1PointType } from "../../crypto/Bls12381/G1PointType.js";
import * as G2JS from "../../crypto/Bls12381/G2/index.js";
import type { G2PointType } from "../../crypto/Bls12381/G2PointType.js";
import * as PairingJS from "../../crypto/Bls12381/Pairing/index.js";
import {
	isValidPrivateKey,
	randomPrivateKey,
} from "../../crypto/Bls12381/randomPrivateKey.js";
import { sign, signPoint } from "../../crypto/Bls12381/sign.js";
import { verify, verifyPoint } from "../../crypto/Bls12381/verify.js";
import {
	allocateOutput,
	checkError,
	loadNativeSync,
	safeBufferPtr,
} from "../../native-loader/index.js";

function writeFpSlot64(target: Uint8Array, offset: number, value: bigint): void {
	// EIP-2537: 16 leading zero bytes + 48-byte big-endian Fp coordinate
	target.fill(0, offset, offset + 16);
	let v = value;
	for (let i = 63; i >= 16; i--) {
		target[offset + i] = Number(v & 0xffn);
		v >>= 8n;
	}
}

function readFpSlot64(source: Uint8Array, offset: number): bigint {
	let result = 0n;
	for (let i = 16; i < 64; i++) {
		result = (result << 8n) | BigInt(source[offset + i] ?? 0);
	}
	return result;
}

function writeScalar32BE(target: Uint8Array, offset: number, value: bigint): void {
	let v = value;
	for (let i = 31; i >= 0; i--) {
		target[offset + i] = Number(v & 0xffn);
		v >>= 8n;
	}
}

function encodeG1Eip2537(point: G1PointType, target: Uint8Array, offset: number): void {
	if (G1JS.isZero(point)) {
		target.fill(0, offset, offset + 128);
		return;
	}
	const affine = G1JS.toAffine(point);
	writeFpSlot64(target, offset, affine.x);
	writeFpSlot64(target, offset + 64, affine.y);
}

function decodeG1Eip2537(bytes: Uint8Array): G1PointType {
	const x = readFpSlot64(bytes, 0);
	const y = readFpSlot64(bytes, 64);
	if (x === 0n && y === 0n) {
		return G1JS.infinity();
	}
	return G1JS.fromAffine(x, y);
}

function encodeG2Eip2537(point: G2PointType, target: Uint8Array, offset: number): void {
	if (G2JS.isZero(point)) {
		target.fill(0, offset, offset + 256);
		return;
	}
	const affine = G2JS.toAffine(point);
	writeFpSlot64(target, offset, affine.x.c0);
	writeFpSlot64(target, offset + 64, affine.x.c1);
	writeFpSlot64(target, offset + 128, affine.y.c0);
	writeFpSlot64(target, offset + 192, affine.y.c1);
}

function decodeG2Eip2537(bytes: Uint8Array): G2PointType {
	const xc0 = readFpSlot64(bytes, 0);
	const xc1 = readFpSlot64(bytes, 64);
	const yc0 = readFpSlot64(bytes, 128);
	const yc1 = readFpSlot64(bytes, 192);
	if (xc0 === 0n && xc1 === 0n && yc0 === 0n && yc1 === 0n) {
		return G2JS.infinity();
	}
	return G2JS.fromAffine({ c0: xc0, c1: xc1 }, { c0: yc0, c1: yc1 });
}

/** Raw EIP-2537 BLS12_G1ADD (256-byte input -> 128-byte output). */
export function g1AddBytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(128);
	checkError(
		lib.primitives_bls12_381_g1_add(safeBufferPtr(input), input.length, out, 128),
		"bls12_381_g1_add",
	);
	return out;
}

/** Raw EIP-2537 single-pair BLS12_G1MUL (160-byte input -> 128-byte output). */
export function g1MulBytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(128);
	checkError(
		lib.primitives_bls12_381_g1_mul(safeBufferPtr(input), input.length, out, 128),
		"bls12_381_g1_mul",
	);
	return out;
}

/** Raw EIP-2537 BLS12_G1MSM (`160 * k` bytes -> 128-byte output). */
export function g1MsmBytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(128);
	checkError(
		lib.primitives_bls12_381_g1_msm(safeBufferPtr(input), input.length, out, 128),
		"bls12_381_g1_msm",
	);
	return out;
}

/** Raw EIP-2537 BLS12_G2ADD (512-byte input -> 256-byte output). */
export function g2AddBytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(256);
	checkError(
		lib.primitives_bls12_381_g2_add(safeBufferPtr(input), input.length, out, 256),
		"bls12_381_g2_add",
	);
	return out;
}

/** Raw EIP-2537 single-pair BLS12_G2MUL (288-byte input -> 256-byte output). */
export function g2MulBytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(256);
	checkError(
		lib.primitives_bls12_381_g2_mul(safeBufferPtr(input), input.length, out, 256),
		"bls12_381_g2_mul",
	);
	return out;
}

/** Raw EIP-2537 BLS12_G2MSM (`288 * k` bytes -> 256-byte output). */
export function g2MsmBytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(256);
	checkError(
		lib.primitives_bls12_381_g2_msm(safeBufferPtr(input), input.length, out, 256),
		"bls12_381_g2_msm",
	);
	return out;
}

/** Raw EIP-2537 BLS12_PAIRING_CHECK (`384 * k` bytes -> boolean). */
export function pairingBytes(input: Uint8Array): boolean {
	const lib = loadNativeSync();
	const out = allocateOutput(32);
	checkError(
		lib.primitives_bls12_381_pairing(safeBufferPtr(input), input.length, out, 32),
		"bls12_381_pairing",
	);
	return out[31] === 1;
}

/** Raw EIP-2537 BLS12_MAP_FP_TO_G1 (64-byte Fp slot -> 128-byte G1 point). */
export function mapFpToG1Bytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(128);
	checkError(
		lib.primitives_bls12_381_map_fp_to_g1(
			safeBufferPtr(input),
			input.length,
			out,
			128,
		),
		"bls12_381_map_fp_to_g1",
	);
	return out;
}

/** Raw EIP-2537 BLS12_MAP_FP2_TO_G2 (128-byte Fp2 slots -> 256-byte G2 point). */
export function mapFp2ToG2Bytes(input: Uint8Array): Uint8Array {
	const lib = loadNativeSync();
	const out = allocateOutput(256);
	checkError(
		lib.primitives_bls12_381_map_fp2_to_g2(
			safeBufferPtr(input),
			input.length,
			out,
			256,
		),
		"bls12_381_map_fp2_to_g2",
	);
	return out;
}

function g1AddNative(p1: G1PointType, p2: G1PointType): G1PointType {
	const input = new Uint8Array(256);
	encodeG1Eip2537(p1, input, 0);
	encodeG1Eip2537(p2, input, 128);
	return decodeG1Eip2537(g1AddBytes(input));
}

function g1MulNative(point: G1PointType, scalar: bigint): G1PointType {
	if (scalar === 0n || G1JS.isZero(point)) {
		return G1JS.infinity();
	}
	const input = new Uint8Array(160);
	encodeG1Eip2537(point, input, 0);
	writeScalar32BE(input, 128, Fr.mod(scalar));
	return decodeG1Eip2537(g1MulBytes(input));
}

function g2AddNative(p1: G2PointType, p2: G2PointType): G2PointType {
	const input = new Uint8Array(512);
	encodeG2Eip2537(p1, input, 0);
	encodeG2Eip2537(p2, input, 256);
	return decodeG2Eip2537(g2AddBytes(input));
}

function g2MulNative(point: G2PointType, scalar: bigint): G2PointType {
	if (scalar === 0n || G2JS.isZero(point)) {
		return G2JS.infinity();
	}
	const input = new Uint8Array(288);
	encodeG2Eip2537(point, input, 0);
	writeScalar32BE(input, 256, Fr.mod(scalar));
	return decodeG2Eip2537(g2MulBytes(input));
}

function pairingCheckNative(
	pairs: Array<[G1PointType, G2PointType]>,
): boolean {
	if (pairs.length === 0) return true;
	const input = new Uint8Array(pairs.length * 384);
	for (let i = 0; i < pairs.length; i++) {
		const pair = pairs[i];
		if (!pair) continue;
		if (!G1JS.isOnCurve(pair[0])) {
			throw new PairingError("G1 point not on curve");
		}
		if (!G2JS.isOnCurve(pair[1])) {
			throw new PairingError("G2 point not on curve");
		}
		const offset = i * 384;
		encodeG1Eip2537(pair[0], input, offset);
		encodeG2Eip2537(pair[1], input, offset + 128);
	}
	return pairingBytes(input);
}

export const G1: typeof G1JS = {
	...G1JS,
	add: g1AddNative,
	mul: g1MulNative,
};

export const G2: typeof G2JS = {
	...G2JS,
	add: g2AddNative,
	mul: g2MulNative,
};

export const Pairing: typeof PairingJS = {
	...PairingJS,
	pairingCheck: pairingCheckNative,
};

export {
	aggregate,
	aggregatePublicKeys,
	aggregateVerify,
	batchVerify,
	derivePublicKey,
	derivePublicKeyPoint,
	fastAggregateVerify,
	Fp,
	Fp2,
	Fr,
	isValidPrivateKey,
	randomPrivateKey,
	sign,
	signPoint,
	verify,
	verifyPoint,
};

export const Bls12381 = {
	sign,
	signPoint,
	verify,
	verifyPoint,
	aggregate,
	aggregatePublicKeys,
	aggregateVerify,
	batchVerify,
	fastAggregateVerify,
	derivePublicKey,
	derivePublicKeyPoint,
	randomPrivateKey,
	isValidPrivateKey,
	Fp,
	Fp2,
	Fr,
	G1,
	G2,
	Pairing,
	g1AddBytes,
	g1MulBytes,
	g1MsmBytes,
	g2AddBytes,
	g2MulBytes,
	g2MsmBytes,
	pairingBytes,
	mapFpToG1Bytes,
	mapFp2ToG2Bytes,
} satisfies typeof Bls12381JS & {
	g1AddBytes: typeof g1AddBytes;
	g1MulBytes: typeof g1MulBytes;
	g1MsmBytes: typeof g1MsmBytes;
	g2AddBytes: typeof g2AddBytes;
	g2MulBytes: typeof g2MulBytes;
	g2MsmBytes: typeof g2MsmBytes;
	pairingBytes: typeof pairingBytes;
	mapFpToG1Bytes: typeof mapFpToG1Bytes;
	mapFp2ToG2Bytes: typeof mapFp2ToG2Bytes;
};

export default Bls12381;
