/**
 * Bitcoin Address Derivation Example
 *
 * Demonstrates Bitcoin P2PKH address generation:
 * - SHA-256 hash of public key
 * - RIPEMD-160 hash of SHA-256 hash
 * - Base58Check encoding with checksum
 * - Double SHA-256 for checksum
 */

import { Ripemd160 } from "../../../src/crypto/ripemd160/Ripemd160.js";
import { SHA256 } from "../../../src/crypto/sha256/SHA256.js";

// Helper: Double SHA-256 (used in Bitcoin)
function doubleSha256(data: Uint8Array): Uint8Array {
	return SHA256.hash(SHA256.hash(data));
}

// Helper: Simple Base58 encoding (Bitcoin alphabet)
const BASE58_ALPHABET =
	"123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(bytes: Uint8Array): string {
	const digits = [0];

	for (const byte of bytes) {
		let carry = byte;
		for (let j = 0; j < digits.length; j++) {
			carry += digits[j] << 8;
			digits[j] = carry % 58;
			carry = (carry / 58) | 0;
		}
		while (carry > 0) {
			digits.push(carry % 58);
			carry = (carry / 58) | 0;
		}
	}

	// Convert leading zeros
	let result = "";
	for (const byte of bytes) {
		if (byte !== 0) break;
		result += "1";
	}

	// Append base58 encoded value
	for (let i = digits.length - 1; i >= 0; i--) {
		result += BASE58_ALPHABET[digits[i]];
	}

	return result;
}

// Bitcoin P2PKH address derivation
function publicKeyToAddress(publicKey: Uint8Array): string {
	const sha256Hash = SHA256.hash(publicKey);
	const ripemd160Hash = Ripemd160.hash(sha256Hash);
	const versionedPayload = new Uint8Array(21);
	versionedPayload[0] = 0x00; // Mainnet P2PKH
	versionedPayload.set(ripemd160Hash, 1);
	const checksum = doubleSha256(versionedPayload);
	const addressBytes = new Uint8Array(25);
	addressBytes.set(versionedPayload, 0);
	addressBytes.set(checksum.slice(0, 4), 21);
	const address = base58Encode(addressBytes);

	return address;
}

// This is the public key from Bitcoin's genesis block coinbase
// Satoshi's famous: "The Times 03/Jan/2009 Chancellor on brink of second bailout for banks"
const genesisPublicKey = new Uint8Array([
	0x04, 0x67, 0x8a, 0xfd, 0xb0, 0xfe, 0x55, 0x48, 0x27, 0x19, 0x67, 0xf1, 0xa6,
	0x71, 0x30, 0xb7, 0x10, 0x5c, 0xd6, 0xa8, 0x28, 0xe0, 0x39, 0x09, 0xa6, 0x79,
	0x62, 0xe0, 0xea, 0x1f, 0x61, 0xde, 0xb6, 0x49, 0xf6, 0xbc, 0x3f, 0x4c, 0xef,
	0x38, 0xc4, 0xf3, 0x55, 0x04, 0xe5, 0x1e, 0xc1, 0x12, 0xde, 0x5c, 0x38, 0x4d,
	0xf7, 0xba, 0x0b, 0x8d, 0x57, 0x8a, 0x4c, 0x70, 0x2b, 0x6b, 0xf1, 0x1d, 0x5f,
]);

const address1 = publicKeyToAddress(genesisPublicKey);

// Random example compressed public key (33 bytes, starts with 02 or 03)
const compressedPubKey = new Uint8Array([
	0x02, 0x50, 0x86, 0x3a, 0xd6, 0x4a, 0x87, 0xae, 0x8a, 0x2f, 0xe8, 0x3c, 0x1a,
	0xf1, 0xa8, 0x40, 0x3c, 0xb5, 0x3f, 0x53, 0xe4, 0x86, 0xd8, 0x51, 0x1d, 0xad,
	0x8a, 0x04, 0x88, 0x7e, 0x5b, 0x23, 0x52,
]);

const address2 = publicKeyToAddress(compressedPubKey);

const testData = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x04]);
const checksum1 = doubleSha256(testData);

// Change one bit
const testData2 = new Uint8Array([0x00, 0x01, 0x02, 0x03, 0x05]); // Last byte changed
const checksum2 = doubleSha256(testData2);
