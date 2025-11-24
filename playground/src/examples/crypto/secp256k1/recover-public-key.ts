// Recover public key from signature
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create message and sign
const message = "Recover my public key";
const messageHash = Hash.keccak256String(message);
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signature = Secp256k1.sign(messageHash, privateKey);

// Recover public key from signature
const recoveredKey = Secp256k1.recoverPublicKey(signature, messageHash);

// Verify they match
const match =
	publicKey.length === recoveredKey.length &&
	publicKey.every((byte, i) => byte === recoveredKey[i]);

// Verify signature with recovered key
const valid = Secp256k1.verify(signature, messageHash, recoveredKey);
