// Generate secp256k1 keypair
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Generate random private key (32 bytes)
const privateKey = Secp256k1.PrivateKey.random();

// Derive public key from private key (65 bytes uncompressed)
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Validate keys
const privateValid = Secp256k1.isValidPrivateKey(privateKey);
const publicValid = Secp256k1.isValidPublicKey(publicKey);
