import { Hash, Secp256k1 } from "@tevm/voltaire";
// Verify secp256k1 signature

// Create message hash
const message = "Verify this message";
const messageHash = Hash.keccak256String(message);

// Generate keypair and sign
const privateKey = Secp256k1.PrivateKey.random();
const publicKey = Secp256k1.derivePublicKey(privateKey);
const signature = Secp256k1.sign(messageHash, privateKey);

// Verify valid signature
const isValid = Secp256k1.verify(signature, messageHash, publicKey);

// Try with wrong public key
const wrongPrivateKey = Secp256k1.PrivateKey.random();
const wrongPublicKey = Secp256k1.derivePublicKey(wrongPrivateKey);
const isInvalid = Secp256k1.verify(signature, messageHash, wrongPublicKey);

// Try with wrong message
const wrongMessageHash = Hash.keccak256String("Different message");
const wrongMessage = Secp256k1.verify(signature, wrongMessageHash, publicKey);
