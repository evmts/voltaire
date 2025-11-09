import * as Ed25519 from "../../../src/crypto/Ed25519/index.js";
import { Hex } from "../../../src/primitives/Hex/index.js";

// Alice's identity key (long-term)
const aliceSeed = new Uint8Array(32);
crypto.getRandomValues(aliceSeed);
const aliceIdentity = Ed25519.keypairFromSeed(aliceSeed);

// Bob's identity key
const bobSeed = new Uint8Array(32);
crypto.getRandomValues(bobSeed);
const bobIdentity = Ed25519.keypairFromSeed(bobSeed);

// Bob creates signed prekey bundle
const prekeyData = new Uint8Array(32);
crypto.getRandomValues(prekeyData);

// Sign prekey with identity key
const prekeySignature = Ed25519.sign(prekeyData, bobIdentity.secretKey);

const prekeyValid = Ed25519.verify(
	prekeySignature,
	prekeyData,
	bobIdentity.publicKey,
);

if (prekeyValid) {
} else {
}

// Combine both public keys
const safetyNumberData = new Uint8Array([
	...aliceIdentity.publicKey,
	...bobIdentity.publicKey,
]);

const message = new TextEncoder().encode("Hello Bob! This is Alice.");

// Sign message with identity key
const messageSignature = Ed25519.sign(message, aliceIdentity.secretKey);

// Bob verifies
const msgValid = Ed25519.verify(
	messageSignature,
	message,
	aliceIdentity.publicKey,
);

// Device 1 (phone)
const device1Seed = new Uint8Array(32);
crypto.getRandomValues(device1Seed);
const device1Identity = Ed25519.keypairFromSeed(device1Seed);

// Device 2 (desktop)
const device2Seed = new Uint8Array(32);
crypto.getRandomValues(device2Seed);
const device2Identity = Ed25519.keypairFromSeed(device2Seed);

// Device 3 (tablet)
const device3Seed = new Uint8Array(32);
crypto.getRandomValues(device3Seed);
const device3Identity = Ed25519.keypairFromSeed(device3Seed);

const crossDeviceMsg = new TextEncoder().encode("Sync message across devices");

// Sign with each device
const sig1 = Ed25519.sign(crossDeviceMsg, device1Identity.secretKey);
const sig2 = Ed25519.sign(crossDeviceMsg, device2Identity.secretKey);
const sig3 = Ed25519.sign(crossDeviceMsg, device3Identity.secretKey);

const oldIdentity = aliceIdentity;
const newSeed = new Uint8Array(32);
crypto.getRandomValues(newSeed);
const newIdentity = Ed25519.keypairFromSeed(newSeed);

// Sign new identity with old identity (proof of rotation)
const rotationProof = Ed25519.sign(
	newIdentity.publicKey,
	oldIdentity.secretKey,
);

const rotationValid = Ed25519.verify(
	rotationProof,
	newIdentity.publicKey,
	oldIdentity.publicKey,
);

// Anonymous sender signs with ephemeral key
const ephemeralSeed = new Uint8Array(32);
crypto.getRandomValues(ephemeralSeed);
const ephemeralKey = Ed25519.keypairFromSeed(ephemeralSeed);

const sealedMessage = new TextEncoder().encode("Anonymous message");
const sealedSig = Ed25519.sign(sealedMessage, ephemeralKey.secretKey);

// Recipient verifies ephemeral signature
const sealedValid = Ed25519.verify(
	sealedSig,
	sealedMessage,
	ephemeralKey.publicKey,
);

// Group admin signs member list
const groupMembers = new Uint8Array([
	...aliceIdentity.publicKey,
	...bobIdentity.publicKey,
	...device1Identity.publicKey,
]);

// Admin identity
const adminSeed = new Uint8Array(32);
crypto.getRandomValues(adminSeed);
const adminIdentity = Ed25519.keypairFromSeed(adminSeed);

const memberListSig = Ed25519.sign(groupMembers, adminIdentity.secretKey);

// Members verify
const listValid = Ed25519.verify(
	memberListSig,
	groupMembers,
	adminIdentity.publicKey,
);
