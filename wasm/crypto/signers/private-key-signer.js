/**
 * WASM implementation of PrivateKeySigner
 * Provides wallet/signer functionality using WASM Zig primitives
 */

const { secp256k1PubkeyFromPrivate } = require("../../primitives/signature.js");
const { Address } = require("../../primitives/address.js");
const { Hash, eip191HashMessage } = require("../../primitives/keccak.js");
const primitives = require("../../loader.js");

class PrivateKeySignerImpl {
	constructor(privateKey) {
		this.privateKey = privateKey;

		// Derive public key from private key
		this.publicKey = secp256k1PubkeyFromPrivate(privateKey);

		// Derive address from public key (keccak256(pubkey)[12:])
		const pubkeyHash = Hash.keccak256(this.publicKey);
		const addressBytes = pubkeyHash.toBytes().slice(-20);
		const addressObj = Address.fromBytes(addressBytes);
		this.address = addressObj.toChecksumHex();
	}

	static fromPrivateKey(options) {
		let privateKeyBytes;

		if (typeof options.privateKey === "string") {
			const hex = options.privateKey.startsWith("0x")
				? options.privateKey.slice(2)
				: options.privateKey;
			if (hex.length !== 64) {
				throw new Error("Private key must be 32 bytes (64 hex characters)");
			}
			privateKeyBytes = new Uint8Array(
				hex.match(/.{1,2}/g).map((byte) => Number.parseInt(byte, 16)),
			);
		} else {
			privateKeyBytes = new Uint8Array(options.privateKey);
		}

		if (privateKeyBytes.length !== 32) {
			throw new Error("Private key must be 32 bytes");
		}

		return new PrivateKeySignerImpl(privateKeyBytes);
	}

	async signMessage(message) {
		// Hash message with EIP-191 prefix
		const messageHash = eip191HashMessage(message);

		// Sign the hash
		// Note: This requires unaudited_signHash to be exposed via WASM
		// For now, this will throw an error indicating the function is not yet available
		try {
			const signature = primitives.signHash(
				messageHash.toBytes(),
				this.privateKey,
			);
			return `0x${Array.from(signature)
				.map((b) => b.toString(16).padStart(2, "0"))
				.join("")}`;
		} catch (error) {
			throw new Error(
				"signHash not yet exposed via WASM. Please add binding for crypto.unaudited_signHash",
			);
		}
	}

	async signTransaction(transaction) {
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

	async signTypedData(typedData) {
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

module.exports = { PrivateKeySignerImpl };
