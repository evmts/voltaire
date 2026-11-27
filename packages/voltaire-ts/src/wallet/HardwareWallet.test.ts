import { describe, expect, it } from "vitest";
import { EIP712 } from "../crypto/EIP712/index.js";
import { Keccak256 } from "../crypto/Keccak256/index.js";
import { Secp256k1 } from "../crypto/Secp256k1/index.js";
import type { AddressType } from "../primitives/Address/AddressType.js";
import { Address } from "../primitives/Address/index.js";
import type { HashType } from "../primitives/Hash/HashType.js";
import type { PrivateKeyType } from "../primitives/PrivateKey/PrivateKeyType.js";
import * as Signature from "../primitives/Signature/index.js";
import type { SignatureType } from "../primitives/Signature/SignatureType.js";
import {
	type Any as TransactionType,
	Type as TxType,
} from "../primitives/Transaction/types.js";
import type {
	DeviceInfo,
	EIP712TypedData,
	HardwareWallet,
} from "./hardware/index.js";

/**
 * Deterministic in-memory HardwareWallet implementation backed by Voltaire
 * secp256k1 + Keccak256 + EIP-712 primitives to exercise the full
 * HardwareWallet contract without requiring physical USB/HID devices.
 */
class InMemoryHardwareWallet implements HardwareWallet {
	private connected = false;
	private readonly seed: Uint8Array;
	private readonly info: DeviceInfo;

	constructor(seed: Uint8Array, info: DeviceInfo) {
		this.seed = seed;
		this.info = info;
	}

	private assertConnected(): void {
		if (!this.connected) {
			throw new Error("Hardware wallet not connected");
		}
	}

	private derivePrivateKey(path: string): PrivateKeyType {
		if (!/^m(\/\d+'?)+$/.test(path)) {
			throw new Error(`Invalid derivation path: ${path}`);
		}
		const pathBytes = new TextEncoder().encode(path);
		const input = new Uint8Array(this.seed.length + pathBytes.length);
		input.set(this.seed, 0);
		input.set(pathBytes, this.seed.length);
		return Keccak256.hash(input) as unknown as PrivateKeyType;
	}

	async connect(): Promise<void> {
		this.connected = true;
	}

	async disconnect(): Promise<void> {
		this.connected = false;
	}

	isConnected(): boolean {
		return this.connected;
	}

	async getAddress(path: string): Promise<AddressType> {
		this.assertConnected();
		const privKey = this.derivePrivateKey(path);
		const pubKey = Secp256k1.derivePublicKey(privKey);
		return Address.fromPublicKey(pubKey);
	}

	async getAddresses(basePath: string, count: number): Promise<AddressType[]> {
		this.assertConnected();
		const out: AddressType[] = [];
		for (let i = 0; i < count; i++) {
			out.push(await this.getAddress(`${basePath}/${i}`));
		}
		return out;
	}

	async signTransaction(
		path: string,
		tx: TransactionType,
	): Promise<SignatureType> {
		this.assertConnected();
		const privKey = this.derivePrivateKey(path);
		const payload = new TextEncoder().encode(
			JSON.stringify({
				type: tx.type,
				nonce: tx.nonce.toString(),
				gasLimit: tx.gasLimit.toString(),
				value: tx.value.toString(),
			}),
		);
		const digest = Keccak256.hash(payload) as unknown as HashType;
		const sig = Secp256k1.sign(digest, privKey);
		return Signature.fromSecp256k1(sig.r, sig.s, sig.v);
	}

	async signTypedData(
		path: string,
		typedData: EIP712TypedData,
	): Promise<SignatureType> {
		this.assertConnected();
		const privKey = this.derivePrivateKey(path);
		const digest = EIP712.hashTypedData(
			typedData as unknown as Parameters<typeof EIP712.hashTypedData>[0],
		) as unknown as HashType;
		const sig = Secp256k1.sign(digest, privKey);
		return Signature.fromSecp256k1(sig.r, sig.s, sig.v);
	}

	async signMessage(path: string, message: Uint8Array): Promise<SignatureType> {
		this.assertConnected();
		const privKey = this.derivePrivateKey(path);
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const framed = new Uint8Array(prefix.length + message.length);
		framed.set(prefix, 0);
		framed.set(message, prefix.length);
		const digest = Keccak256.hash(framed) as unknown as HashType;
		const sig = Secp256k1.sign(digest, privKey);
		return Signature.fromSecp256k1(sig.r, sig.s, sig.v);
	}

	async getDeviceInfo(): Promise<DeviceInfo> {
		this.assertConnected();
		return { ...this.info };
	}
}

describe("HardwareWallet interface contract", () => {
	const testSeed = new Uint8Array(32).fill(0x42);
	const deviceInfo: DeviceInfo = {
		manufacturer: "Voltaire",
		model: "SimKey-1",
		version: "1.0.0",
	};

	it("enforces connect/disconnect lifecycle and rejects disconnected calls", async () => {
		const hw: HardwareWallet = new InMemoryHardwareWallet(testSeed, deviceInfo);

		expect(hw.isConnected()).toBe(false);
		await expect(hw.getAddress("m/44'/60'/0'/0/0")).rejects.toThrow(
			"Hardware wallet not connected",
		);
		await expect(hw.getDeviceInfo()).rejects.toThrow(
			"Hardware wallet not connected",
		);

		await hw.connect();
		expect(hw.isConnected()).toBe(true);
		expect(await hw.getDeviceInfo()).toEqual(deviceInfo);

		await hw.disconnect();
		expect(hw.isConnected()).toBe(false);
	});

	it("derives deterministic unique addresses across BIP-44 paths and batch queries", async () => {
		const hw: HardwareWallet = new InMemoryHardwareWallet(testSeed, deviceInfo);
		await hw.connect();

		const addr0 = await hw.getAddress("m/44'/60'/0'/0/0");
		const addr1 = await hw.getAddress("m/44'/60'/0'/0/1");
		const addr0Repeat = await hw.getAddress("m/44'/60'/0'/0/0");

		expect(Address.equals(addr0, addr0Repeat)).toBe(true);
		expect(Address.equals(addr0, addr1)).toBe(false);

		const batch = await hw.getAddresses("m/44'/60'/0'/0", 3);
		expect(batch).toHaveLength(3);
		expect(Address.equals(batch[0] ?? addr1, addr0)).toBe(true);
		expect(Address.equals(batch[1] ?? addr0, addr1)).toBe(true);

		await expect(hw.getAddress("invalid/path")).rejects.toThrow(
			"Invalid derivation path",
		);
		await hw.disconnect();
	});

	it("signs personal messages, EIP-712 typed data, and transactions with recoverable secp256k1 signatures", async () => {
		const hw: HardwareWallet = new InMemoryHardwareWallet(testSeed, deviceInfo);
		await hw.connect();

		const path = "m/44'/60'/0'/0/0";
		const signerAddr = await hw.getAddress(path);

		// 1. EIP-191 personal message signature + recovery
		const message = new TextEncoder().encode("Verify Voltaire hardware wallet");
		const msgSig = await hw.signMessage(path, message);
		expect(Signature.getAlgorithm(msgSig)).toBe("secp256k1");
		expect(Signature.isCanonical(msgSig)).toBe(true);

		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${message.length}`,
		);
		const framed = new Uint8Array(prefix.length + message.length);
		framed.set(prefix, 0);
		framed.set(message, prefix.length);
		const msgHash = Keccak256.hash(framed) as unknown as HashType;
		const recoveredPub = Secp256k1.recoverPublicKey(
			{
				r: Signature.getR(msgSig),
				s: Signature.getS(msgSig),
				v: Signature.getV(msgSig) ?? 27,
			},
			msgHash,
		);
		expect(
			Address.equals(Address.fromPublicKey(recoveredPub), signerAddr),
		).toBe(true);

		// 2. EIP-712 typed data signing + recovery
		const typedData: EIP712TypedData = {
			types: {
				EIP712Domain: [
					{ name: "name", type: "string" },
					{ name: "version", type: "string" },
					{ name: "chainId", type: "uint256" },
				],
				Mail: [
					{ name: "from", type: "string" },
					{ name: "contents", type: "string" },
				],
			},
			primaryType: "Mail",
			domain: {
				name: "Voltaire Mail",
				version: "1",
				chainId: 1,
			},
			message: {
				from: "Alice",
				contents: "Hello hardware wallet",
			},
		};
		const typedSig = await hw.signTypedData(path, typedData);
		expect(Signature.getAlgorithm(typedSig)).toBe("secp256k1");
		expect(Signature.isCanonical(typedSig)).toBe(true);

		const typedDigest = EIP712.hashTypedData(
			typedData as unknown as Parameters<typeof EIP712.hashTypedData>[0],
		) as unknown as HashType;
		const recoveredTypedPub = Secp256k1.recoverPublicKey(
			{
				r: Signature.getR(typedSig),
				s: Signature.getS(typedSig),
				v: Signature.getV(typedSig) ?? 27,
			},
			typedDigest,
		);
		expect(
			Address.equals(Address.fromPublicKey(recoveredTypedPub), signerAddr),
		).toBe(true);

		// 3. Transaction signing
		const tx: TransactionType = {
			type: TxType.EIP1559,
			chainId: 1n,
			nonce: 0n,
			maxPriorityFeePerGas: 1_000_000_000n,
			maxFeePerGas: 20_000_000_000n,
			gasLimit: 21_000n,
			to: signerAddr,
			value: 1_000_000_000_000_000_000n,
			data: new Uint8Array(0),
			accessList: [],
			yParity: 0,
			r: new Uint8Array(32),
			s: new Uint8Array(32),
		};
		const txSig = await hw.signTransaction(path, tx);
		expect(Signature.getAlgorithm(txSig)).toBe("secp256k1");
		expect(Signature.getR(txSig).length).toBe(32);
		expect(Signature.getS(txSig).length).toBe(32);

		await hw.disconnect();
	});
});
