/**
 * Example: EIP-191 Personal Messages and EIP-1271 Contract Signatures
 *
 * Demonstrates:
 * - EIP-191 personal message signing and verification
 * - EIP-1271 contract signature verification
 * - Unified EOA + contract signature verification
 */

import { hash as keccak256 } from "../src/crypto/Keccak256/hash.js";
import { recoverPublicKey } from "../src/crypto/Secp256k1/recoverPublicKey.js";
import { fromPublicKey } from "../src/primitives/Address/fromPublicKey.js";
import * as Address from "../src/primitives/Address/index.js";
import { Bytes } from "../src/primitives/Bytes/index.js";
import * as ContractSignature from "../src/primitives/ContractSignature/index.js";
import * as SignedData from "../src/primitives/SignedData/index.js";

const hash = SignedData.Hash({ keccak256 });
const message = "Hello, Ethereum!";
const messageHash = hash(message);

// Personal message (most common)
const personalMessage = SignedData.from(
	SignedData.VERSION_PERSONAL_MESSAGE,
	Bytes.from([]),
	new TextEncoder().encode("Test message"),
);

// Data with validator
const validatorAddress = Address.fromHex(
	"0x4242424242424242424242424242424242424242",
);
const dataWithValidator = SignedData.from(
	SignedData.VERSION_DATA_WITH_VALIDATOR,
	validatorAddress,
	new TextEncoder().encode("Validated data"),
);

const verify = SignedData.Verify({
	keccak256,
	recoverPublicKey,
	addressFromPublicKey: fromPublicKey,
});

const verifySignature = ContractSignature.VerifySignature({
	keccak256,
	recoverPublicKey,
	addressFromPublicKey: fromPublicKey,
});
