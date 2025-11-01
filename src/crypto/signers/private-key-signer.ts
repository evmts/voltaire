/**
 * WASM implementation of PrivateKeySigner
 * Provides wallet/signer functionality using WASM Zig primitives
 */

import { Address } from "../../primitives/Address/Address.wasm.js";
import { Keccak256Wasm } from "../keccak256.wasm.js";
import * as primitives from "../../wasm-loader/loader.js";
import { secp256k1 } from '@noble/curves/secp256k1.js';

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
			return (primitives as any).signHash(hash, privateKey);
		};

		// Derive public key from private key
		const pubKey = secp256k1.getPublicKey(privateKey, false);
		this.publicKey = pubKey.slice(1); // Remove 0x04 prefix for uncompressed

		// Derive address from public key (keccak256(pubkey)[12:])
		const pubkeyHash = Keccak256Wasm.hash(this.publicKey);
		const addressBytes = pubkeyHash.slice(-20);
		const addressObj = Address.fromBytes(addressBytes);
		this.address = addressObj.toChecksumHex();
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
				hex.match(/.{1,2}/g)!.map((byte) => Number.parseInt(byte, 16)),
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
		const msgBytes = typeof message === "string" ? new TextEncoder().encode(message) : message;
		const prefix = new TextEncoder().encode("\x19Ethereum Signed Message:\n" + msgBytes.length);
		const combined = new Uint8Array(prefix.length + msgBytes.length);
		combined.set(prefix);
		combined.set(msgBytes, prefix.length);
		const messageHash = Keccak256Wasm.hash(combined);

		// Sign the hash
		// Note: This requires unaudited_signHash to be exposed via WASM
		// For now, this will throw an error indicating the function is not yet available
		try {
			const signature: Uint8Array = this.signWithPrivateKey(messageHash);
			return `0x${Array.from(signature)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
		} catch (_error) {
			throw new Error(
				"signHash not yet exposed via WASM. Please add binding for crypto.unaudited_signHash",
			);
		}
	}

	async signTransaction(_transaction: any): Promise<any> {
		// Note: Transaction signing requires:
		// 1. Serialize transaction to RLP
		// 2. Hash the serialized transaction
		// 3. Sign the hash
		// 4. Add signature (r, s, v) to transaction
		//
		// This requires additional WASM bindings for transaction serialization
		throw new Error(
			"signTransaction not yet implemented. Requires RLP serialization and signHash bindings",
		);
	}

	async signTypedData(_typedData: any): Promise<string> {
		// Note: EIP-712 signing requires:
		// 1. Hash the typed data according to EIP-712
		// 2. Sign the hash
		//
		// This requires exposing unaudited_signTypedData from eip712.zig
		throw new Error(
			"signTypedData not yet implemented. Requires exposing crypto.eip712.unaudited_signTypedData via WASM",
		);
	}
}

export default PrivateKeySignerImpl;
