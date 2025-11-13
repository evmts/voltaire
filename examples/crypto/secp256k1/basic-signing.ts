/**
 * Basic secp256k1 signing and verification
 *
 * Demonstrates:
 * - Signing a message hash with a private key
 * - Deriving public key from private key
 * - Verifying signature with public key
 * - RFC 6979 deterministic signatures
 */

import * as Secp256k1 from "../../../src/crypto/Secp256k1/index.js";
import { keccak256 } from "../../../src/primitives/Hash/BrandedHash/keccak256.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Generate random private key (in production, use secure key management)
const privateKeyBytes = new Uint8Array(32);
crypto.getRandomValues(privateKeyBytes);
const privateKey = Hex.fromBytes(privateKeyBytes);

// Create message hash
const message = "Hello, Ethereum!";
const messageBytes = new TextEncoder().encode(message);
const messageHash = keccak256(messageBytes);

// Sign the message hash
const signature = Secp256k1.sign(messageHash, privateKey);

// Derive public key from private key
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Verify signature
const isValid = Secp256k1.verify(signature, messageHash, publicKey);

// Test with wrong public key
const wrongKeyBytes = new Uint8Array(64);
crypto.getRandomValues(wrongKeyBytes);
const wrongKey = Hex.fromBytes(wrongKeyBytes);
const invalidVerification = Secp256k1.verify(signature, messageHash, wrongKey);
const sig1 = Secp256k1.sign(messageHash, privateKey);
const sig2 = Secp256k1.sign(messageHash, privateKey);

const isDeterministic =
	sig1.r.every((byte, i) => byte === sig2.r[i]) &&
	sig1.s.every((byte, i) => byte === sig2.s[i]) &&
	sig1.v === sig2.v;
