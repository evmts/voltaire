// Key validation
import * as X25519 from "../../../crypto/X25519/index.js";
import * as Hex from "../../../primitives/Hex/index.js";
const validSecret = X25519.generateSecretKey();

const validSecretResult = X25519.validateSecretKey(validSecret);
const keypair = X25519.generateKeypair();

const validPublicResult = X25519.validatePublicKey(keypair.publicKey);
const shortSecret = new Uint8Array(16);

const shortSecretResult = X25519.validateSecretKey(shortSecret);
const shortPublic = new Uint8Array(20);

const shortPublicResult = X25519.validatePublicKey(shortPublic);
const zeroPublic = new Uint8Array(32);

const zeroPublicResult = X25519.validatePublicKey(zeroPublic);
