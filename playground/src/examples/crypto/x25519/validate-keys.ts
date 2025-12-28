import { Bytes, Hex, X25519 } from "@tevm/voltaire";
// Key validation

const validSecret = X25519.generateSecretKey();

const validSecretResult = X25519.validateSecretKey(validSecret);
const keypair = X25519.generateKeypair();

const validPublicResult = X25519.validatePublicKey(keypair.publicKey);
const shortSecret = Bytes.zero(16);

const shortSecretResult = X25519.validateSecretKey(shortSecret);
const shortPublic = Bytes.zero(20);

const shortPublicResult = X25519.validatePublicKey(shortPublic);
const zeroPublic = Bytes.zero(32);

const zeroPublicResult = X25519.validatePublicKey(zeroPublic);
