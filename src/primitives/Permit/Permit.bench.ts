/**
 * Permit Module Benchmarks (EIP-2612)
 *
 * Measures performance of EIP-2612 permit signature operations
 */

import { bench, run } from "mitata";
import type { AddressType } from "../Address/AddressType.js";
import type { ChainIdType } from "../ChainId/ChainIdType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
import * as Permit from "./index.js";
import type { PermitDomainType, PermitType } from "./PermitType.js";

// ============================================================================
// Test Data - Realistic EIP-2612 permit data
// ============================================================================

function createAddress(byte: number): AddressType {
	const bytes = new Uint8Array(20);
	bytes.fill(byte);
	return bytes as AddressType;
}

function createUint256(value: bigint): Uint256Type {
	const bytes = new Uint8Array(32);
	let v = value;
	for (let i = 31; i >= 0; i--) {
		bytes[i] = Number(v & 0xffn);
		v >>= 8n;
	}
	return bytes as Uint256Type;
}

// Private key for signing (test only - never use in production)
const testPrivateKey = new Uint8Array(32);
for (let i = 0; i < 32; i++) {
	testPrivateKey[i] = (i + 1) % 256;
}

// Common addresses
const ownerAddress = createAddress(0xaa);
const spenderAddress = createAddress(0xbb);
const usdcAddress = createAddress(0xcc);
const daiAddress = createAddress(0xdd);

// USDC permit domain
const usdcDomain: PermitDomainType = {
	name: "USD Coin",
	version: "2",
	chainId: 1n as ChainIdType,
	verifyingContract: usdcAddress,
};

// DAI permit domain (different version format)
const daiDomain: PermitDomainType = {
	name: "Dai Stablecoin",
	version: "1",
	chainId: 1n as ChainIdType,
	verifyingContract: daiAddress,
};

// L2 domain (Polygon)
const polygonDomain: PermitDomainType = {
	name: "USD Coin (PoS)",
	version: "1",
	chainId: 137n as ChainIdType,
	verifyingContract: createAddress(0xee),
};

// Simple permit (small value)
const simplePermit: PermitType = {
	owner: ownerAddress,
	spender: spenderAddress,
	value: createUint256(1000000n), // 1 USDC
	nonce: createUint256(0n),
	deadline: createUint256(1700000000n),
};

// Large value permit
const largeValuePermit: PermitType = {
	owner: ownerAddress,
	spender: spenderAddress,
	value: createUint256(1000000000000n), // 1M USDC
	nonce: createUint256(0n),
	deadline: createUint256(1700000000n),
};

// Max approval permit
const maxApprovalPermit: PermitType = {
	owner: ownerAddress,
	spender: spenderAddress,
	value:
		createUint256(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
	nonce: createUint256(0n),
	deadline:
		createUint256(
			0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffn,
		),
};

// High nonce permit (active user)
const highNoncePermit: PermitType = {
	owner: ownerAddress,
	spender: spenderAddress,
	value: createUint256(500000000n),
	nonce: createUint256(1000n),
	deadline: createUint256(1700000000n),
};

// Mock signature (65 bytes)
const mockSignature = new Uint8Array(65);
for (let i = 0; i < 65; i++) {
	mockSignature[i] = (i * 7 + 42) % 256;
}

// ============================================================================
// Benchmarks - Permit.createPermitSignature
// ============================================================================

bench("createPermitSignature - simple permit - voltaire", () => {
	try {
		Permit.createPermitSignature(simplePermit, usdcDomain, testPrivateKey);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("createPermitSignature - large value - voltaire", () => {
	try {
		Permit.createPermitSignature(largeValuePermit, usdcDomain, testPrivateKey);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("createPermitSignature - max approval - voltaire", () => {
	try {
		Permit.createPermitSignature(maxApprovalPermit, usdcDomain, testPrivateKey);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("createPermitSignature - DAI domain - voltaire", () => {
	try {
		Permit.createPermitSignature(simplePermit, daiDomain, testPrivateKey);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("createPermitSignature - Polygon (L2) - voltaire", () => {
	try {
		Permit.createPermitSignature(simplePermit, polygonDomain, testPrivateKey);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

await run();

// ============================================================================
// Benchmarks - Permit.verifyPermit
// ============================================================================

bench("verifyPermit - simple permit - voltaire", () => {
	try {
		Permit.verifyPermit(simplePermit, mockSignature, usdcDomain);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("verifyPermit - large value - voltaire", () => {
	try {
		Permit.verifyPermit(largeValuePermit, mockSignature, usdcDomain);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("verifyPermit - max approval - voltaire", () => {
	try {
		Permit.verifyPermit(maxApprovalPermit, mockSignature, usdcDomain);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("verifyPermit - high nonce - voltaire", () => {
	try {
		Permit.verifyPermit(highNoncePermit, mockSignature, usdcDomain);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

bench("verifyPermit - different domain - voltaire", () => {
	try {
		Permit.verifyPermit(simplePermit, mockSignature, daiDomain);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

await run();

// ============================================================================
// Benchmarks - PERMIT_TYPES access
// ============================================================================

bench("PERMIT_TYPES access - voltaire", () => {
	void Permit.PERMIT_TYPES;
});

bench("PERMIT_TYPES.Permit access - voltaire", () => {
	void Permit.PERMIT_TYPES.Permit;
});

bench("PERMIT_TYPES.Permit length - voltaire", () => {
	void Permit.PERMIT_TYPES.Permit.length;
});

await run();

// ============================================================================
// Benchmarks - KnownTokens access
// ============================================================================

bench("KnownTokens access - voltaire", () => {
	void Permit.KnownTokens;
});

await run();

// ============================================================================
// Benchmarks - Batch Operations
// ============================================================================

bench("createPermitSignature x5 - voltaire", () => {
	const permits = [
		simplePermit,
		largeValuePermit,
		maxApprovalPermit,
		highNoncePermit,
		simplePermit,
	];
	for (const permit of permits) {
		try {
			Permit.createPermitSignature(permit, usdcDomain, testPrivateKey);
		} catch {
			// May throw if EIP712 not fully implemented
		}
	}
});

bench("verifyPermit x5 - voltaire", () => {
	const permits = [
		simplePermit,
		largeValuePermit,
		maxApprovalPermit,
		highNoncePermit,
		simplePermit,
	];
	for (const permit of permits) {
		try {
			Permit.verifyPermit(permit, mockSignature, usdcDomain);
		} catch {
			// May throw if EIP712 not fully implemented
		}
	}
});

await run();

// ============================================================================
// Benchmarks - Full Workflow
// ============================================================================

bench("Permit workflow - create and verify - voltaire", () => {
	try {
		// Create signature
		const signature = Permit.createPermitSignature(
			simplePermit,
			usdcDomain,
			testPrivateKey,
		);
		// Verify signature
		Permit.verifyPermit(simplePermit, signature, usdcDomain);
	} catch {
		// May throw if EIP712 not fully implemented
	}
});

await run();
