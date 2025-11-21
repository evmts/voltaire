import { describe, expect, test } from "vitest";
import * as EntryPoint from "../EntryPoint/index.js";
import * as UserOperation from "../UserOperation/index.js";
import * as PackedUserOperation from "./index.js";

describe("PackedUserOperation", () => {
	test("creates PackedUserOperation from params", () => {
		const accountGasLimits = new Uint8Array(32);
		const gasFees = new Uint8Array(32);

		const packed = PackedUserOperation.from({
			sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			nonce: 0n,
			initCode: "0x",
			callData: "0x",
			accountGasLimits,
			preVerificationGas: 50000n,
			gasFees,
			paymasterAndData: "0x",
			signature: "0x",
		});

		expect(packed.sender).toBeInstanceOf(Uint8Array);
		expect(packed.accountGasLimits.length).toBe(32);
		expect(packed.gasFees.length).toBe(32);
	});

	test("computes hash", () => {
		const accountGasLimits = new Uint8Array(32);
		const gasFees = new Uint8Array(32);

		const packed = PackedUserOperation.from({
			sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			nonce: 0n,
			initCode: "0x",
			callData: "0x",
			accountGasLimits,
			preVerificationGas: 50000n,
			gasFees,
			paymasterAndData: "0x",
			signature: "0x",
		});

		const hash = PackedUserOperation.hash(packed, EntryPoint.ENTRYPOINT_V07, 1);
		expect(hash).toBeInstanceOf(Uint8Array);
		expect(hash.length).toBe(32);
	});

	test("unpacks to UserOperation", () => {
		const userOp = UserOperation.from({
			sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			nonce: 0n,
			initCode: "0x",
			callData: "0x",
			callGasLimit: 100000n,
			verificationGasLimit: 200000n,
			preVerificationGas: 50000n,
			maxFeePerGas: 1000000000n,
			maxPriorityFeePerGas: 1000000000n,
			paymasterAndData: "0x",
			signature: "0x",
		});

		const packed = UserOperation.pack(userOp);
		const unpacked = PackedUserOperation.unpack(packed);

		expect(unpacked.callGasLimit).toBe(userOp.callGasLimit);
		expect(unpacked.verificationGasLimit).toBe(userOp.verificationGasLimit);
		expect(unpacked.maxFeePerGas).toBe(userOp.maxFeePerGas);
		expect(unpacked.maxPriorityFeePerGas).toBe(userOp.maxPriorityFeePerGas);
	});

	test("round-trip pack/unpack", () => {
		const original = UserOperation.from({
			sender: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
			nonce: 5n,
			initCode: "0x1234",
			callData: "0xabcd",
			callGasLimit: 100000n,
			verificationGasLimit: 200000n,
			preVerificationGas: 50000n,
			maxFeePerGas: 1500000000n,
			maxPriorityFeePerGas: 1000000000n,
			paymasterAndData: "0xef01",
			signature: "0x9876",
		});

		const packed = UserOperation.pack(original);
		const unpacked = PackedUserOperation.unpack(packed);

		expect(unpacked.nonce).toBe(original.nonce);
		expect(unpacked.callGasLimit).toBe(original.callGasLimit);
		expect(unpacked.verificationGasLimit).toBe(original.verificationGasLimit);
		expect(unpacked.maxFeePerGas).toBe(original.maxFeePerGas);
		expect(unpacked.maxPriorityFeePerGas).toBe(original.maxPriorityFeePerGas);
	});
});
