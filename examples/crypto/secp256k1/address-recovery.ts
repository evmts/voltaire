/**
 * Public key recovery and address derivation
 *
 * Demonstrates:
 * - Recovering public key from signature (ecRecover)
 * - Deriving Ethereum address from public key
 * - Verifying recovered address matches signer
 * - Critical role of recovery ID (v value)
 */

import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";

// Generate keypair
const privateKey = new Uint8Array(32);
crypto.getRandomValues(privateKey);
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Derive Ethereum address from public key
function deriveAddress(pubKey: Uint8Array): string {
	// Hash public key with Keccak256
	const hash = keccak256(pubKey);
	// Take last 20 bytes as address (Ethereum uses last 20 bytes)
	const addressBytes = hash.slice(12);
	return `0x${Buffer.from(addressBytes).toString("hex")}`;
}

const signerAddress = deriveAddress(publicKey);

// Sign a message
const message = "Authenticate me!";
const messageBytes = new TextEncoder().encode(message);
const messageHash = keccak256(messageBytes);
const signature = Secp256k1.sign(messageHash, privateKey);

// Recover public key from signature
const recoveredKey = Secp256k1.recoverPublicKey(signature, messageHash);

// Verify recovered key matches original
const keysMatch = recoveredKey.every((byte, i) => byte === publicKey[i]);

// Derive address from recovered key
const recoveredAddress = deriveAddress(recoveredKey);

// Correct v value
const correctSig = { ...signature };
const recoveredCorrect = Secp256k1.recoverPublicKey(correctSig, messageHash);
const correctAddress = deriveAddress(recoveredCorrect);

// Wrong v value (flip between 27 and 28)
const wrongV = signature.v === 27 ? 28 : 27;
const wrongSig = { ...signature, v: wrongV };
const recoveredWrong = Secp256k1.recoverPublicKey(wrongSig, messageHash);
const wrongAddress = deriveAddress(recoveredWrong);
