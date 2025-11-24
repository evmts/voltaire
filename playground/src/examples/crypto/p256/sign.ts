import * as P256 from "../../../crypto/P256/index.js";
import { Hash } from "../../../primitives/Hash/index.js";

// Generate keypair
const privateKey = crypto.getRandomValues(new Uint8Array(32));
const publicKey = P256.derivePublicKey(privateKey);

// Sign different messages
const messages = [
	"Transaction: Transfer 1.5 ETH",
	"Authentication challenge",
	"WebAuthn assertion",
];
for (const message of messages) {
	const messageHash = Hash.keccak256String(message);
	const signature = P256.sign(messageHash, privateKey);
}
// Same input produces same signature
const testMessage = "Test message";
const testHash = Hash.keccak256String(testMessage);

const sig1 = P256.sign(testHash, privateKey);
const sig2 = P256.sign(testHash, privateKey);
// P256 uses low-s to prevent signature malleability
const signature = P256.sign(testHash, privateKey);

// Convert s to bigint
let sValue = 0n;
for (let i = 0; i < signature.s.length; i++) {
	sValue = (sValue << 8n) | BigInt(signature.s[i] ?? 0);
}

const halfOrder = P256.CURVE_ORDER / 2n;
