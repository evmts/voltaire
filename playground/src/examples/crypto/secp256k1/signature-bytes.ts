// Signature serialization to bytes
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create signature
const messageHash = Hash.keccak256String("Serialize signature");
const privateKey = Secp256k1.PrivateKey.random();
const signature = Secp256k1.sign(messageHash, privateKey);

// Serialize to bytes (64 bytes: r + s)
const bytes = Secp256k1.Signature.toBytes(signature);

// Deserialize from bytes (needs yParity separately)
const fromBytes = Secp256k1.Signature.fromBytes(bytes, signature.yParity);
