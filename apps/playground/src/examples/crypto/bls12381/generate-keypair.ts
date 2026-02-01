import { Bls12381, Hex } from "@tevm/voltaire";
// Generate BLS12-381 keypair

// Generate random private key (32 bytes, scalar in Fr field)
const privateKey = Bls12381.randomPrivateKey();

// Derive public key (G2 point, 96 bytes compressed)
const publicKey = Bls12381.derivePublicKey(privateKey);

// Validate private key
const isValidKey = Bls12381.isValidPrivateKey(privateKey);

// Invalid private keys
const zeroKey = new Uint8Array(32); // all zeros
const isZeroValid = Bls12381.isValidPrivateKey(zeroKey);

const shortKey = new Uint8Array(16); // too short
const isShortValid = Bls12381.isValidPrivateKey(shortKey);

// Generate multiple keypairs
const keypairs = Array.from({ length: 3 }, () => {
	const sk = Bls12381.randomPrivateKey();
	const pk = Bls12381.derivePublicKey(sk);
	return { secretKey: sk, publicKey: pk };
});
