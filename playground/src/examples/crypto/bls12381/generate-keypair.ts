import { Bls12381, Hex } from "@tevm/voltaire";
// Generate BLS12-381 keypair

// Generate random private key (32 bytes, scalar in Fr field)
const privateKey = Bls12381.randomPrivateKey();
console.log("Private key:", Hex.fromBytes(privateKey));
console.log("Private key length:", privateKey.length, "bytes");

// Derive public key (G2 point, 96 bytes compressed)
const publicKey = Bls12381.derivePublicKey(privateKey);
console.log("Public key:", Hex.fromBytes(publicKey));
console.log("Public key length:", publicKey.length, "bytes");

// Validate private key
const isValidKey = Bls12381.isValidPrivateKey(privateKey);
console.log("Private key valid:", isValidKey);

// Invalid private keys
const zeroKey = new Uint8Array(32); // all zeros
const isZeroValid = Bls12381.isValidPrivateKey(zeroKey);
console.log("Zero key valid:", isZeroValid);

const shortKey = new Uint8Array(16); // too short
const isShortValid = Bls12381.isValidPrivateKey(shortKey);
console.log("Short key valid:", isShortValid);

// Generate multiple keypairs
const keypairs = Array.from({ length: 3 }, () => {
	const sk = Bls12381.randomPrivateKey();
	const pk = Bls12381.derivePublicKey(sk);
	return { secretKey: sk, publicKey: pk };
});
console.log("Generated", keypairs.length, "keypairs");
