import {
	Bytes,
	Bytes16,
	Bytes32,
	Hex,
	P256,
	BrandedHash as Hash,
	BrandedPrivateKey as PrivateKey,
} from "@tevm/voltaire";

// In production, use crypto.getRandomValues()
const privateKey = PrivateKey.random();

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
const validPrivate = Bytes.from(Array(32).fill(1));

// Invalid private key (all zeros)
const zeroKey = Bytes32.zero();

// Invalid private key (wrong length)
const shortKey = Bytes16.zero();

// Invalid public key (wrong length)
const invalidPubKey = Bytes32.zero();

const privateKey2 = PrivateKey.random();
const publicKey2 = P256.derivePublicKey(privateKey2);

const testMsg = "shared message";
const testMsgHash = Hash.keccak256String(testMsg);

const sigA = P256.sign(testMsgHash, privateKey);
const sigB = P256.sign(testMsgHash, privateKey2);

const sameSignature = Hex.fromBytes(sigA.r) === Hex.fromBytes(sigB.r);

const validA = P256.verify(sigA, testMsgHash, publicKey);
const validB = P256.verify(sigB, testMsgHash, publicKey2);
