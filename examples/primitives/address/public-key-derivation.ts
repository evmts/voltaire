/**
 * Public Key to Address Derivation Example
 *
 * Demonstrates:
 * - Deriving addresses from public keys (secp256k1)
 * - Deriving addresses from private keys
 * - Understanding the keccak256 derivation process
 * - Verifying address ownership
 */

import { Address } from "../../../src/primitives/Address/index.js";
import { Bytes } from "../../../src/primitives/Bytes/index.js";

// secp256k1 public key coordinates (256 bits each)
const publicKeyX =
	0x8318535b54105d4a7aae60c08fc45f9687181b4fdfc625bd1a753fa7397fed75n;
const publicKeyY =
	0x3547f11ca8696646f2f3acb08e31016afac23e630c5d11f59f61fef57b0d2aa5n;

// Derive address from public key
const addressFromPubKey = Address.fromPublicKey(publicKeyX, publicKeyY);

// Private key (32 bytes) - DO NOT use this in production!
const privateKeyHex =
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const privateKey = Bytes.fromHex(privateKeyHex);

// Derive address from private key
// Process: private key → public key (via secp256k1) → address (via keccak256)
const addressFromPrivKey = Address.fromPrivateKey(privateKey);

// Example known test keys (from hardhat/foundry)
const testKeys = [
	{
		name: "Test Account 1",
		privateKey:
			"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
		expectedAddr: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
	},
	{
		name: "Test Account 2",
		privateKey:
			"0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
		expectedAddr: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
	},
];

for (const test of testKeys) {
	const pk = Bytes.fromHex(test.privateKey);
	const derived = Address.fromPrivateKey(pk);
	const expected = Address.fromHex(test.expectedAddr);
}

function canSign(address: Address, privateKey: Uint8Array): boolean {
	try {
		const derivedAddr = Address.fromPrivateKey(privateKey);
		return derivedAddr.equals(address);
	} catch {
		return false;
	}
}

const myAddress = Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266");
const myPrivateKey = Bytes.fromHex(
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
);
const wrongPrivateKey = Bytes.fromHex(
	"0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
);

// Invalid private key size
try {
	const wrongSize = new Uint8Array(16); // Must be 32 bytes
	Address.fromPrivateKey(wrongSize);
} catch (e) {}

// All-zero private key (invalid)
try {
	const zeroKey = new Uint8Array(32); // All zeros
	Address.fromPrivateKey(zeroKey);
} catch (e) {}
