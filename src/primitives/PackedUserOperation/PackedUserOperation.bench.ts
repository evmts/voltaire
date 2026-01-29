/**
 * PackedUserOperation Module Benchmarks (ERC-4337 v0.7)
 *
 * Measures performance of PackedUserOperation hash and unpack operations
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import * as Uint from "../Uint/index.js";
import * as PackedUserOperation from "./index.js";
import type { PackedUserOperationType } from "./PackedUserOperationType.js";

// ============================================================================
// Test Data - Realistic ERC-4337 v0.7 packed user operation
// ============================================================================

function createAddress(byte: number): AddressType {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as AddressType;
}

function packGasLimits(
	verificationGasLimit: bigint,
	callGasLimit: bigint,
): Uint8Array {
	const packed = new Uint8Array(32);
	let v = verificationGasLimit;
	for (let i = 15; i >= 0; i--) {
		packed[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	let c = callGasLimit;
	for (let i = 31; i >= 16; i--) {
		packed[i] = Number(c & 0xffn);
		c >>= 8n;
	}
	return packed;
}

function packGasFees(
	maxPriorityFeePerGas: bigint,
	maxFeePerGas: bigint,
): Uint8Array {
	const packed = new Uint8Array(32);
	let p = maxPriorityFeePerGas;
	for (let i = 15; i >= 0; i--) {
		packed[i] = Number(p & 0xffn);
		p >>= 8n;
	}
	let m = maxFeePerGas;
	for (let i = 31; i >= 16; i--) {
		packed[i] = Number(m & 0xffn);
		m >>= 8n;
	}
	return packed;
}

const senderAddress = createAddress(0xaa);
const entryPointAddress = createAddress(0xee);

// Simple call data
const simpleCallData = new Uint8Array([
	0xa9, 0x05, 0x9c, 0xbb, // transfer selector
	...new Uint8Array(64).fill(0x01),
]);

// Complex call data
const complexCallData = new Uint8Array(512);
complexCallData.set([0x18, 0xdf, 0xb3, 0xc7]);
for (let i = 4; i < 512; i++) {
	complexCallData[i] = i % 256;
}

// Init code
const initCode = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x60, 0x0f, 0x57,
]);

// Paymaster data
const paymasterData = new Uint8Array(52);
paymasterData.set(createAddress(0xbb), 0);
for (let i = 20; i < 52; i++) {
	paymasterData[i] = i % 256;
}

// Signature
const signature = new Uint8Array(65);
for (let i = 0; i < 65; i++) {
	signature[i] = i % 256;
}

// Simple packed user operation
const simplePackedUserOp: PackedUserOperationType = {
	sender: senderAddress,
	nonce: Uint.from(0n),
	initCode: new Uint8Array(0),
	callData: simpleCallData,
	accountGasLimits: packGasLimits(100000n, 100000n),
	preVerificationGas: Uint.from(21000n),
	gasFees: packGasFees(1500000000n, 30000000000n),
	paymasterAndData: new Uint8Array(0),
	signature,
};

// Complex packed user operation
const complexPackedUserOp: PackedUserOperationType = {
	sender: senderAddress,
	nonce: Uint.from(42n),
	initCode,
	callData: complexCallData,
	accountGasLimits: packGasLimits(300000n, 500000n),
	preVerificationGas: Uint.from(50000n),
	gasFees: packGasFees(3000000000n, 100000000000n),
	paymasterAndData: paymasterData,
	signature,
};

// High values packed user operation
const highValuesPackedUserOp: PackedUserOperationType = {
	...simplePackedUserOp,
	accountGasLimits: packGasLimits(0xffffffffffffffffn, 0xffffffffffffffffn),
	gasFees: packGasFees(0xffffffffffffffffn, 0xffffffffffffffffn),
};

// ============================================================================
// Benchmarks - PackedUserOperation.from
// ============================================================================

bench("PackedUserOperation.from - simple - voltaire", () => {
	PackedUserOperation.from({
		sender: senderAddress,
		nonce: 0n,
		initCode: new Uint8Array(0),
		callData: simpleCallData,
		accountGasLimits: packGasLimits(100000n, 100000n),
		preVerificationGas: 21000n,
		gasFees: packGasFees(1500000000n, 30000000000n),
		paymasterAndData: new Uint8Array(0),
		signature,
	});
});

bench("PackedUserOperation.from - complex - voltaire", () => {
	PackedUserOperation.from({
		sender: senderAddress,
		nonce: 42n,
		initCode,
		callData: complexCallData,
		accountGasLimits: packGasLimits(300000n, 500000n),
		preVerificationGas: 50000n,
		gasFees: packGasFees(3000000000n, 100000000000n),
		paymasterAndData: paymasterData,
		signature,
	});
});

await run();

// ============================================================================
// Benchmarks - PackedUserOperation.hash
// ============================================================================

bench("PackedUserOperation.hash - simple - voltaire", () => {
	PackedUserOperation.hash(simplePackedUserOp, entryPointAddress, 1n);
});

bench("PackedUserOperation.hash - complex - voltaire", () => {
	PackedUserOperation.hash(complexPackedUserOp, entryPointAddress, 1n);
});

bench("PackedUserOperation.hash - high values - voltaire", () => {
	PackedUserOperation.hash(highValuesPackedUserOp, entryPointAddress, 1n);
});

bench("PackedUserOperation.hash - different chains - voltaire", () => {
	PackedUserOperation.hash(simplePackedUserOp, entryPointAddress, 137n);
});

await run();

// ============================================================================
// Benchmarks - PackedUserOperation.unpack (v0.7 -> v0.6)
// ============================================================================

bench("PackedUserOperation.unpack - simple - voltaire", () => {
	PackedUserOperation.unpack(simplePackedUserOp);
});

bench("PackedUserOperation.unpack - complex - voltaire", () => {
	PackedUserOperation.unpack(complexPackedUserOp);
});

bench("PackedUserOperation.unpack - high values - voltaire", () => {
	PackedUserOperation.unpack(highValuesPackedUserOp);
});

await run();

// ============================================================================
// Benchmarks - Round Trip (unpack then hash)
// ============================================================================

bench("PackedUserOperation unpack + access fields - voltaire", () => {
	const unpacked = PackedUserOperation.unpack(simplePackedUserOp);
	void unpacked.callGasLimit;
	void unpacked.verificationGasLimit;
	void unpacked.maxFeePerGas;
	void unpacked.maxPriorityFeePerGas;
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("PackedUserOperation.hash x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		PackedUserOperation.hash(simplePackedUserOp, entryPointAddress, 1n);
	}
});

bench("PackedUserOperation.unpack x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		PackedUserOperation.unpack(simplePackedUserOp);
	}
});

await run();
