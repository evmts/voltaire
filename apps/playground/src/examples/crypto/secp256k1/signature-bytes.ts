import { Hash, Hex, Secp256k1 } from "@tevm/voltaire";
// Signature serialization to bytes

// Create signature
const messageHash = Hash.keccak256String("Serialize signature");
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign(messageHash, privateKey);

// Serialize to bytes (64 bytes: r + s)
const bytes = signature.toBytes();

// Deserialize from bytes (needs yParity separately)
const fromBytes = Secp256k1.Signature.fromBytes(bytes, signature.yParity);
