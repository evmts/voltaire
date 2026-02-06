// Crypto examples - imported as raw strings
// These demonstrate the Voltaire cryptography API

import aesgcm from "./crypto/aesgcm.ts?raw";
import bip39 from "./crypto/bip39.ts?raw";
import blake2 from "./crypto/blake2.ts?raw";
import bls12381 from "./crypto/bls12381.ts?raw";
import bn254 from "./crypto/bn254.ts?raw";
import chacha20poly1305 from "./crypto/chacha20poly1305.ts?raw";
import ed25519 from "./crypto/ed25519.ts?raw";
import eip712 from "./crypto/eip712.ts?raw";
import hdwallet from "./crypto/hdwallet.ts?raw";
import keccak256 from "./crypto/keccak256.ts?raw";
import modexp from "./crypto/modexp.ts?raw";
import p256 from "./crypto/p256.ts?raw";
import ripemd160 from "./crypto/ripemd160.ts?raw";
import secp256k1 from "./crypto/secp256k1.ts?raw";
import sha256 from "./crypto/sha256.ts?raw";
import x25519 from "./crypto/x25519.ts?raw";

export const cryptoExamples: Record<string, string> = {
	"keccak256.ts": keccak256,
	"secp256k1.ts": secp256k1,
	"bls12381.ts": bls12381,
	"bn254.ts": bn254,
	"sha256.ts": sha256,
	"blake2.ts": blake2,
	"ripemd160.ts": ripemd160,
	"ed25519.ts": ed25519,
	"p256.ts": p256,
	"x25519.ts": x25519,
	"eip712.ts": eip712,
	"hdwallet.ts": hdwallet,
	"bip39.ts": bip39,
	"aesgcm.ts": aesgcm,
	"chacha20poly1305.ts": chacha20poly1305,
	"modexp.ts": modexp,
};
