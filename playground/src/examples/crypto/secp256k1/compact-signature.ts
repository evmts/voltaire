import { Hash, Hex, Secp256k1 } from "@tevm/voltaire";
// Compact signature format (65 bytes)

// Create and sign message
const messageHash = Hash.keccak256String("Compact signature test");
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign(messageHash, privateKey);

// Convert to compact format (r + s + v = 65 bytes)
const compact = Secp256k1.Signature.toCompact(signature);

// Convert back from compact
const fromCompact = Secp256k1.Signature.fromCompact(compact);
