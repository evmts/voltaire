// Verify secp256k1 signature
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";

// Create message hash
const message = "Verify this message";
const messageHash = Hash.keccak256String(message);

// Generate keypair and sign
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signature = Secp256k1.sign(messageHash, privateKey);

// Verify valid signature
const isValid = Secp256k1.verify(signature, messageHash, publicKey);
console.log("Valid signature verified:", isValid);

// Try with wrong public key
const wrongPrivateKey = Secp256k1.PrivateKey.random();
const wrongPublicKey = Secp256k1.derivePublicKey(wrongPrivateKey);
const isInvalid = Secp256k1.verify(signature, messageHash, wrongPublicKey);
console.log("Wrong public key rejected:", !isInvalid);

// Try with wrong message
const wrongMessageHash = Hash.keccak256String("Different message");
const wrongMessage = Secp256k1.verify(signature, wrongMessageHash, publicKey);
console.log("Wrong message rejected:", !wrongMessage);
