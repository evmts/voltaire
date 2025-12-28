import { Hash, Hex, Secp256k1 } from "@tevm/voltaire";
// Sign message with secp256k1

// Create message and hash it
const message = "Hello, Ethereum!";
const messageHash = Hash.keccak256String(message);

// Generate keypair
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Sign the message hash
const signature = Secp256k1.sign(messageHash, privateKey);
