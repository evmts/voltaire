import { Hash, Hex, X25519 } from "@tevm/voltaire";

// X25519 - Elliptic curve Diffie-Hellman key exchange

// Generate keypairs for Alice and Bob
const aliceKeypair = X25519.generateKeypair();
const bobKeypair = X25519.generateKeypair();
console.log("Alice public key:", Hex.fromBytes(aliceKeypair.publicKey));
console.log("Bob public key:", Hex.fromBytes(bobKeypair.publicKey));

// Compute shared secrets (should be identical)
const aliceShared = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);
const bobShared = X25519.scalarmult(
	bobKeypair.secretKey,
	aliceKeypair.publicKey,
);

// Verify they match
const match = aliceShared.every((byte, i) => byte === bobShared[i]);
console.log("Shared secrets match:", match);

// Derive symmetric key from shared secret
const symmetricKey = Hash.keccak256(aliceShared);
console.log("Derived symmetric key:", Hex.fromBytes(symmetricKey));

// Three-party key exchange example
const carolKeypair = X25519.generateKeypair();
console.log("Carol public key:", Hex.fromBytes(carolKeypair.publicKey));

// Each pair can derive a unique shared secret
const aliceBob = X25519.scalarmult(
	aliceKeypair.secretKey,
	bobKeypair.publicKey,
);
const aliceCarol = X25519.scalarmult(
	aliceKeypair.secretKey,
	carolKeypair.publicKey,
);
const bobCarol = X25519.scalarmult(
	bobKeypair.secretKey,
	carolKeypair.publicKey,
);
console.log("Alice-Bob shared:", Hex.fromBytes(aliceBob));
console.log("Alice-Carol shared:", Hex.fromBytes(aliceCarol));
console.log("Bob-Carol shared:", Hex.fromBytes(bobCarol));

// Ephemeral key exchange pattern
// Sender generates ephemeral keypair
const ephemeral = X25519.generateKeypair();
const recipientPublic = bobKeypair.publicKey; // Recipient's long-term public key

// Sender computes shared secret with recipient's public key
const senderShared = X25519.scalarmult(ephemeral.secretKey, recipientPublic);

// Recipient receives ephemeral public key and computes same secret
const receiverShared = X25519.scalarmult(
	bobKeypair.secretKey,
	ephemeral.publicKey,
);
const ephemeralMatches =
	Hex.fromBytes(senderShared) === Hex.fromBytes(receiverShared);
console.log("Ephemeral key exchange matches:", ephemeralMatches);
