import { Hash } from "../../../primitives/Hash/index.js";
import * as PrivateKey from "../../../primitives/PrivateKey/index.js";
import * as PublicKey from "../../../primitives/PublicKey/index.js";

// Create key pair
const privateKey = PrivateKey.from(
	"0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
);
const publicKey = PublicKey.fromPrivateKey(privateKey);

// Sign a message
const message1 = "Hello, Voltaire!";
const hash1 = Hash.keccak256String(message1);
const signature1 = PrivateKey._sign(privateKey, hash1);

// Verify signature
const isValid = PublicKey._verify(publicKey, hash1, signature1);
const message2 = "Wrong message";
const hash2 = Hash.keccak256String(message2);
const isInvalid = PublicKey._verify(publicKey, hash2, signature1);
const wrongPrivateKey = PrivateKey.from(
	"0x8da4ef21b864d2cc526dbdb2a120bd2874c36c9d0a1fb7f8c63d7f7a8b41de8f",
);
const wrongPublicKey = PublicKey.fromPrivateKey(wrongPrivateKey);
const isWrongKey = PublicKey._verify(wrongPublicKey, hash1, signature1);
const messages = [
	"Transaction 1",
	"Transaction 2",
	"Smart contract call",
	"Token transfer",
];

for (const msg of messages) {
	const hash = Hash.keccak256String(msg);
	const sig = PrivateKey._sign(privateKey, hash);
	const valid = PublicKey._verify(publicKey, hash, sig);
}
