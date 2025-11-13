import * as P256 from "../../../src/crypto/P256/index.js";
import * as Hash from "../../../src/primitives/Hash/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// In production, use crypto.getRandomValues()
const privateKeyBytes = new Uint8Array(32);
crypto.getRandomValues(privateKeyBytes);
const privateKey = Hex.fromBytes(privateKeyBytes);

const publicKey = P256.derivePublicKey(privateKey);

const message = "Hello, P-256!";
const messageHash = Hash.keccak256String(message);

const signature = P256.sign(messageHash, privateKey);

const isValid = P256.verify(signature, messageHash, publicKey);

// Verify with wrong message fails
const wrongHash = Hash.keccak256String("Wrong message");
const isInvalid = P256.verify(signature, wrongHash, publicKey);

const testMessage = "test";
const testHash = Hash.keccak256String(testMessage);

// Sign the same message twice
const sig1 = P256.sign(testHash, privateKey);
const sig2 = P256.sign(testHash, privateKey);

const rMatch = Hex.fromBytes(sig1.r) === Hex.fromBytes(sig2.r);
const sMatch = Hex.fromBytes(sig1.s) === Hex.fromBytes(sig2.s);

const messages = ["message1", "message2", "message3"];

messages.forEach((msg, i) => {
	const hash = Hash.keccak256String(msg);
	const sig = P256.sign(hash, privateKey);
	const valid = P256.verify(sig, hash, publicKey);
});

// Valid private key
const validPrivateBytes = new Uint8Array(32).fill(1);
const validPrivate = Hex.fromBytes(validPrivateBytes);

// Invalid private key (all zeros)
const zeroKey = Hex(`0x${"00".repeat(32)}`);

// Invalid private key (wrong length)
const shortKey = Hex(`0x${"ab".repeat(16)}`);

// Invalid public key (wrong length)
const invalidPubKey = Hex(`0x${"ab".repeat(32)}`);

const privateKey2Bytes = new Uint8Array(32);
crypto.getRandomValues(privateKey2Bytes);
const privateKey2 = Hex.fromBytes(privateKey2Bytes);
const publicKey2 = P256.derivePublicKey(privateKey2 as any);

const testMsg = "shared message";
const testMsgHash = Hash.keccak256String(testMsg);

const sigA = P256.sign(testMsgHash, privateKey);
const sigB = P256.sign(testMsgHash, privateKey2);

const sameSignature = Hex.fromBytes(sigA.r) === Hex.fromBytes(sigB.r);

const validA = P256.verify(sigA, testMsgHash, publicKey);
const validB = P256.verify(sigB, testMsgHash, publicKey2);
