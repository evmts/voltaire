import { Bytes, Ed25519 } from "@tevm/voltaire";
// Validate Ed25519 keys

// Generate valid keypair
const seed = Bytes.random(32);
const keypair = Ed25519.keypairFromSeed(seed);
const secretValid = Ed25519.validateSecretKey(keypair.secretKey);
const publicValid = Ed25519.validatePublicKey(keypair.publicKey);
const seedValid = Ed25519.validateSeed(seed);
const shortSecretKey = Bytes.zero(16);
const longSecretKey = Bytes.zero(64);
const shortPublicKey = Bytes.zero(16);
const longPublicKey = Bytes.zero(64);
const shortSeed = Bytes.zero(16);
const zeroSecretKey = Bytes.zero(32);
const onesSecretKey = Bytes(Array(32).fill(0xff));
const identityPublicKey = Bytes([0x01, ...Array(31).fill(0)]);
