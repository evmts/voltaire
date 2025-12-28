import { Address, Hash, Hex, Secp256k1 } from "@tevm/voltaire";

// secp256k1 - Ethereum's signature curve

// Generate random private key (32 bytes)
const privateKey = Secp256k1.PrivateKey.random();

// Derive public key (65 bytes uncompressed, starting with 0x04)
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Derive Ethereum address from public key
const address = Address.fromPublicKey(publicKey);
const checksummed = Address.toChecksummed(address);

// Sign a message hash (must be 32 bytes)
const message = "Hello, Ethereum!";
const messageHash = Hash.keccak256String(message);
const signature = Secp256k1.sign(messageHash, privateKey);

// Signature components
const r = Hex.fromBytes(signature.r);
const s = Hex.fromBytes(signature.s);
const v = signature.v; // Recovery id (0 or 1)

// Verify signature
const isValid = Secp256k1.verify(signature, messageHash, publicKey);
// Result: true

// Recover public key from signature
const recoveredPubKey = Secp256k1.recover(signature, messageHash);
const recoveryMatches =
	recoveredPubKey !== null &&
	Hex.fromBytes(publicKey) === Hex.fromBytes(recoveredPubKey);

// Compact signature format (64 bytes)
const compactSig = signature.toCompact();

// ECDH shared secret
const privateKey2 = Secp256k1.PrivateKey.random();
const publicKey2 = Secp256k1.derivePublicKey(privateKey2);
const sharedSecret1 = Secp256k1.ecdh(privateKey, publicKey2);
const sharedSecret2 = Secp256k1.ecdh(privateKey2, publicKey);
const ecdhMatches =
	Hex.fromBytes(sharedSecret1) === Hex.fromBytes(sharedSecret2);

// Validate private key (must be < curve order)
try {
	Secp256k1.PrivateKey.validate(privateKey);
} catch (e) {
	// Invalid private key
}
