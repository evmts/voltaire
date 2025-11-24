// Sign message with secp256k1
import * as Secp256k1 from "../../../crypto/Secp256k1/index.js";
import * as Hash from "../../../primitives/Hash/index.js";
import * as Hex from "../../../primitives/Hex/index.js";

// Create message and hash it
const message = "Hello, Ethereum!";
const messageHash = Hash.keccak256String(message);

// Generate keypair
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);

// Sign the message hash
const signature = Secp256k1.sign(messageHash, privateKey);
