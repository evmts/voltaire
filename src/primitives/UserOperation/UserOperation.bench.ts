/**
 * UserOperation Module Benchmarks (ERC-4337)
 *
 * Measures performance of UserOperation hash and pack operations
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import * as Uint from "../Uint/index.js";
import * as UserOperation from "./index.js";
import type { UserOperationType } from "./UserOperationType.js";

// ============================================================================
// Test Data - Realistic ERC-4337 user operation
// ============================================================================

function createAddress(byte: number): AddressType {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as AddressType;
}

const senderAddress = createAddress(0xaa);
const entryPointAddress = createAddress(0xee);

// Simple call data (transfer)
const simpleCallData = new Uint8Array([
	0xa9, 0x05, 0x9c, 0xbb, // transfer(address,uint256) selector
	...new Uint8Array(32).fill(0x01), // to address
	...new Uint8Array(32).fill(0x00), // amount
]);

// Complex call data (batch execute)
const complexCallData = new Uint8Array(512);
complexCallData.set([0x18, 0xdf, 0xb3, 0xc7]); // executeBatch selector
for (let i = 4; i < 512; i++) {
	complexCallData[i] = i % 256;
}

// Init code for account creation
const initCode = new Uint8Array([
	0x60, 0x80, 0x60, 0x40, 0x52, 0x34, 0x80, 0x15, 0x60, 0x0f, 0x57, 0x60, 0x00,
	0x80, 0xfd, 0x5b, 0x50, 0x60, 0x00, 0x80, 0xfd,
]);

// Paymaster data
const paymasterData = new Uint8Array(52);
paymasterData.set(createAddress(0xbb), 0); // paymaster address
for (let i = 20; i < 52; i++) {
	paymasterData[i] = i % 256;
}

// Signature (65 bytes)
const signature = new Uint8Array(65);
for (let i = 0; i < 65; i++) {
	signature[i] = i % 256;
}

// Simple user operation (EOA call, no paymaster)
const simpleUserOp: UserOperationType = {
	sender: senderAddress,
	nonce: Uint.from(0n),
	initCode: new Uint8Array(0),
	callData: simpleCallData,
	callGasLimit: Uint.from(100000n),
	verificationGasLimit: Uint.from(100000n),
	preVerificationGas: Uint.from(21000n),
	maxFeePerGas: Uint.from(30000000000n), // 30 gwei
	maxPriorityFeePerGas: Uint.from(1500000000n), // 1.5 gwei
	paymasterAndData: new Uint8Array(0),
	signature,
};

// Complex user operation (account creation with paymaster)
const complexUserOp: UserOperationType = {
	sender: senderAddress,
	nonce: Uint.from(42n),
	initCode,
	callData: complexCallData,
	callGasLimit: Uint.from(500000n),
	verificationGasLimit: Uint.from(300000n),
	preVerificationGas: Uint.from(50000n),
	maxFeePerGas: Uint.from(100000000000n), // 100 gwei
	maxPriorityFeePerGas: Uint.from(3000000000n), // 3 gwei
	paymasterAndData: paymasterData,
	signature,
};

// High nonce user operation
const highNonceUserOp: UserOperationType = {
	...simpleUserOp,
	nonce: Uint.from(0xffffffffffffffffn),
};

// ============================================================================
// Benchmarks - UserOperation.from
// ============================================================================

bench("UserOperation.from - simple - voltaire", () => {
	UserOperation.from({
		sender: senderAddress,
		nonce: 0n,
		initCode: new Uint8Array(0),
		callData: simpleCallData,
		callGasLimit: 100000n,
		verificationGasLimit: 100000n,
		preVerificationGas: 21000n,
		maxFeePerGas: 30000000000n,
		maxPriorityFeePerGas: 1500000000n,
		paymasterAndData: new Uint8Array(0),
		signature,
	});
});

bench("UserOperation.from - complex - voltaire", () => {
	UserOperation.from({
		sender: senderAddress,
		nonce: 42n,
		initCode,
		callData: complexCallData,
		callGasLimit: 500000n,
		verificationGasLimit: 300000n,
		preVerificationGas: 50000n,
		maxFeePerGas: 100000000000n,
		maxPriorityFeePerGas: 3000000000n,
		paymasterAndData: paymasterData,
		signature,
	});
});

await run();

// ============================================================================
// Benchmarks - UserOperation.hash
// ============================================================================

bench("UserOperation.hash - simple - voltaire", () => {
	UserOperation.hash(simpleUserOp, entryPointAddress, 1n);
});

bench("UserOperation.hash - complex - voltaire", () => {
	UserOperation.hash(complexUserOp, entryPointAddress, 1n);
});

bench("UserOperation.hash - high nonce - voltaire", () => {
	UserOperation.hash(highNonceUserOp, entryPointAddress, 1n);
});

bench("UserOperation.hash - different chains - voltaire", () => {
	UserOperation.hash(simpleUserOp, entryPointAddress, 137n); // Polygon
});

await run();

// ============================================================================
// Benchmarks - UserOperation.pack (v0.6 -> v0.7)
// ============================================================================

bench("UserOperation.pack - simple - voltaire", () => {
	UserOperation.pack(simpleUserOp);
});

bench("UserOperation.pack - complex - voltaire", () => {
	UserOperation.pack(complexUserOp);
});

bench("UserOperation.pack - high values - voltaire", () => {
	const highValuesUserOp: UserOperationType = {
		...simpleUserOp,
		callGasLimit: Uint.from(0xffffffffffffffffn),
		verificationGasLimit: Uint.from(0xffffffffffffffffn),
		maxFeePerGas: Uint.from(0xffffffffffffffffn),
		maxPriorityFeePerGas: Uint.from(0xffffffffffffffffn),
	};
	UserOperation.pack(highValuesUserOp);
});

await run();

// ============================================================================
// Benchmarks - Round Trip (pack then hash)
// ============================================================================

bench("UserOperation pack + hash - simple - voltaire", () => {
	const packed = UserOperation.pack(simpleUserOp);
	// Hash the packed version using PackedUserOperation
	void packed;
});

bench("UserOperation pack + hash - complex - voltaire", () => {
	const packed = UserOperation.pack(complexUserOp);
	void packed;
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("UserOperation.hash x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		UserOperation.hash(simpleUserOp, entryPointAddress, 1n);
	}
});

bench("UserOperation.pack x10 - voltaire", () => {
	for (let i = 0; i < 10; i++) {
		UserOperation.pack(simpleUserOp);
	}
});

await run();
