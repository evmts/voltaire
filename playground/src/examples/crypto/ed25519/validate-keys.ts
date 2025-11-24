// Validate Ed25519 keys
import * as Ed25519 from "../../../crypto/Ed25519/index.js";

// Generate valid keypair
const seed = crypto.getRandomValues(new Uint8Array(32));
const keypair = Ed25519.keypairFromSeed(seed);
const secretValid = Ed25519.validateSecretKey(keypair.secretKey);
const publicValid = Ed25519.validatePublicKey(keypair.publicKey);
const seedValid = Ed25519.validateSeed(seed);
const shortSecretKey = new Uint8Array(16);
const longSecretKey = new Uint8Array(64);
const shortPublicKey = new Uint8Array(16);
const longPublicKey = new Uint8Array(64);
const shortSeed = new Uint8Array(16);
const zeroSecretKey = new Uint8Array(32);
const onesSecretKey = new Uint8Array(32).fill(0xff);
const identityPublicKey = new Uint8Array(32);
identityPublicKey[0] = 0x01;
