/**
 * WASM implementation of PrivateKeySigner
 * Provides wallet/signer functionality using WASM Zig primitives
 */

import { secp256k1 } from "@noble/curves/secp256k1.js";
import * as BrandedAddress from "../../primitives/Address/BrandedAddress/index.js";
import { Address } from "../../primitives/Address/index.js";
import * as primitives from "../../wasm-loader/loader.js";
import { Keccak256Wasm } from "../keccak256.wasm.js";

export interface PrivateKeySignerOptions {
	privateKey: string | Uint8Array;
}

export interface Signer {
	address: string;
	publicKey: Uint8Array;
	signMessage(message: string | Uint8Array): Promise<string>;
	signTransaction(transaction: any): Promise<any>;
	signTypedData(typedData: any): Promise<string>;
}

export class PrivateKeySignerImpl implements Signer {
	public readonly address: string;
	public readonly publicKey: Uint8Array;
	private readonly signWithPrivateKey: (hash: Uint8Array) => Uint8Array;

	private constructor(privateKey: Uint8Array) {
		// Private key only exists in this closure
		this.signWithPrivateKey = (hash: Uint8Array) => {
			const sig = primitives.secp256k1Sign(hash, privateKey);
			// Return 65-byte signature: r[32] + s[32] + v[1]
			const result = new Uint8Array(65);
			result.set(sig.r, 0);
			result.set(sig.s, 32);
			result[64] = sig.v;
			return result;
		};

		// Derive public key from private key
		const pubKey = secp256k1.getPublicKey(privateKey, false);
		this.publicKey = pubKey.slice(1); // Remove 0x04 prefix for uncompressed

		// Derive address from public key (keccak256(pubkey)[12:])
		const pubkeyHash = Keccak256Wasm.hash(this.publicKey);
		const addressBytes = pubkeyHash.slice(-20);
		const addressObj = Address.fromBytes(addressBytes);
		this.address = BrandedAddress.toChecksummed(addressObj);
	}

	static fromPrivateKey(
		options: PrivateKeySignerOptions,
	): PrivateKeySignerImpl {
		let privateKeyBytes: Uint8Array;

		if (typeof options.privateKey === "string") {
			const hex = options.privateKey.startsWith("0x")
				? options.privateKey.slice(2)
				: options.privateKey;
			if (hex.length !== 64) {
				throw new Error("Private key must be 32 bytes (64 hex characters)");
			}
			privateKeyBytes = new Uint8Array(
				hex.match(/.{1,2}/g)?.map((byte) => Number.parseInt(byte, 16)) ?? [],
			);
		} else {
			privateKeyBytes = new Uint8Array(options.privateKey);
		}

		if (privateKeyBytes.length !== 32) {
			throw new Error("Private key must be 32 bytes");
		}

		return new PrivateKeySignerImpl(privateKeyBytes);
	}

	async signMessage(message: string | Uint8Array): Promise<string> {
		// Hash message with EIP-191 prefix
		const msgBytes =
			typeof message === "string" ? new TextEncoder().encode(message) : message;
		const prefix = new TextEncoder().encode(
			`\x19Ethereum Signed Message:\n${msgBytes.length}`,
		);
		const combined = new Uint8Array(prefix.length + msgBytes.length);
		combined.set(prefix);
		combined.set(msgBytes, prefix.length);
		const messageHash = Keccak256Wasm.hash(combined);

		// Sign the hash
		const signature: Uint8Array = this.signWithPrivateKey(messageHash);
		return `0x${Array.from(signature)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`;
	}

	async signTransaction(transaction: any): Promise<any> {
		const Transaction = await import(
			"../../primitives/Transaction/index.js"
		).then((m) => m);

		// Get signing hash
		const signingHash = Transaction.getSigningHash(transaction);

		// Sign the hash
		const signature: Uint8Array = this.signWithPrivateKey(signingHash);

		// Parse signature (65 bytes: r[32] + s[32] + v[1])
		const r = signature.slice(0, 32);
		const s = signature.slice(32, 64);
		const v = signature[64] ?? 0;

		// Convert v from 0-1 to appropriate format based on tx type
		let yParity: number;
		if (transaction.type === 0) {
			// Legacy: v includes chain ID
			const chainId = transaction.chainId ?? 0n;
			const vValue = BigInt(v) + 35n + chainId * 2n;
			return { ...transaction, v: vValue, r, s };
		}
		// EIP-2930, EIP-1559, EIP-4844, EIP-7702: use yParity
		yParity = v;

		return { ...transaction, yParity, r, s };
	}

	async signTypedData(typedData: any): Promise<string> {
		const { Eip712Wasm } = await import("../eip712.wasm.js");

		// Hash typed data according to EIP-712
		const hash = Eip712Wasm.hashTypedData(typedData);

		// Sign the hash
		const signature: Uint8Array = this.signWithPrivateKey(hash);

		// Return as hex string (0x + r + s + v)
		return `0x${Array.from(signature)
			.map((b) => b.toString(16).padStart(2, "0"))
			.join("")}`;
	}
}

export default PrivateKeySignerImpl;
