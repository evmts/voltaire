import { Address, Hash, Hex, Secp256k1 } from "@tevm/voltaire";

// secp256k1 - Ethereum's signature curve

// Generate random private key (32 bytes)
const privateKey = Secp256k1.randomPrivateKey();
console.log("Private key:", Hex.fromBytes(privateKey));

// Derive public key (65 bytes uncompressed, starting with 0x04)
const publicKey = Secp256k1.derivePublicKey(privateKey);
console.log("Public key:", Hex.fromBytes(publicKey));

// Derive Ethereum address from public key
const address = Address.fromPublicKey(publicKey);
const checksummed = Address.toChecksummed(address);
console.log("Address:", checksummed);

// Sign a message hash (must be 32 bytes)
const message = "Hello, Ethereum!";
const messageHash = Hash.keccak256String(message);
const signature = Secp256k1.sign(messageHash, privateKey);

// Signature components
const r = Hex.fromBytes(signature.r);
const s = Hex.fromBytes(signature.s);
const v = signature.v; // Recovery id (27 or 28)
console.log("Signature r:", r);
console.log("Signature s:", s);
console.log("Signature v:", v);

// Verify signature
const isValid = Secp256k1.verify(signature, messageHash, publicKey);
console.log("Signature valid:", isValid);

// Recover public key from signature
const recoveredPubKey = Secp256k1.recoverPublicKey(signature, messageHash);
const recoveryMatches =
	recoveredPubKey !== null &&
	Hex.fromBytes(publicKey) === Hex.fromBytes(recoveredPubKey);
console.log("Recovery matches:", recoveryMatches);

// Compact signature format (64 bytes)
const compactSig = Secp256k1.Signature.toCompact(signature);
console.log("Compact signature:", Hex.fromBytes(compactSig));

// ECDH shared secret
const privateKey2 = Secp256k1.randomPrivateKey();
const publicKey2 = Secp256k1.derivePublicKey(privateKey2);
const sharedSecret1 = Secp256k1.ecdh(privateKey, publicKey2);
const sharedSecret2 = Secp256k1.ecdh(privateKey2, publicKey);
const ecdhMatches =
	Hex.fromBytes(sharedSecret1) === Hex.fromBytes(sharedSecret2);
console.log("ECDH shared secrets match:", ecdhMatches);

// Validate private key (must be < curve order)
const keyValid = Secp256k1.isValidPrivateKey(privateKey);
console.log("Private key valid:", keyValid);
