import { Bytes, Hash, P256 } from "@tevm/voltaire";
// In real Secure Enclave, this happens in hardware
// Private key never accessible to main CPU
const secureEnclavePrivateKey = Bytes.random(32);
const publicKey = P256.derivePublicKey(secureEnclavePrivateKey);

const userAuthenticated = true; // Simulated biometric auth

if (!userAuthenticated) {
	process.exit(1);
}

const transaction = {
	to: "0x742d35Cc6634C0532925a3b844Bc454e4438f44e",
	value: "1.5 ETH",
	nonce: 42,
};

// Hash the transaction
const txHash = Hash.keccak256String(JSON.stringify(transaction));

// Sign in Secure Enclave (private key never exposed)
const signature = P256.sign(txHash, secureEnclavePrivateKey);

// Server has the public key from enrollment
const isValid = P256.verify(signature, txHash, publicKey);

// Attest that key was generated in Secure Enclave
const attestationData = {
	keyType: "P256",
	secureEnclave: true,
	deviceId: "iPhone15,2",
	createdAt: Date.now(),
};

const attestationHash = Hash.keccak256String(JSON.stringify(attestationData));
const attestationSignature = P256.sign(
	attestationHash,
	secureEnclavePrivateKey,
);

// Verify attestation
const attestationValid = P256.verify(
	attestationSignature,
	attestationHash,
	publicKey,
);
