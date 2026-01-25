import * as Layer from "effect/Layer";
import { Bip39Live } from "./Bip39/index.js";
import { Blake2Live } from "./Blake2/index.js";
import { Bls12381Live } from "./Bls12381/Bls12381Live.js";
import { Bn254Live } from "./Bn254/index.js";
import { ChaCha20Poly1305Live } from "./ChaCha20Poly1305/index.js";
import { Ed25519Live } from "./Ed25519/Ed25519Live.js";
import { EIP712Live } from "./EIP712/index.js";
import { HDWalletLive } from "./HDWallet/index.js";
import { HMACLive } from "./HMAC/index.js";
import { KeccakLive } from "./Keccak256/index.js";
import { KeystoreLive } from "./Keystore/index.js";
import { KZGLive } from "./KZG/index.js";
import { P256Live } from "./P256/P256Live.js";
import { Ripemd160Live } from "./Ripemd160/index.js";
import { Secp256k1Live } from "./Secp256k1/Secp256k1Live.js";
import { SHA256Live } from "./SHA256/index.js";

/**
 * Combined production layer providing all cryptographic services.
 * Includes: Keccak256, Secp256k1, SHA256, Blake2, Ripemd160, BLS12-381,
 * Ed25519, P256, KZG, HDWallet, BN254, BIP-39, HMAC, EIP-712, ChaCha20Poly1305, and Keystore.
 *
 * @example
 * ```typescript
 * import { CryptoLive, KeccakService, Secp256k1Service } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   const secp = yield* Secp256k1Service
 *   // Use any crypto service
 * }).pipe(Effect.provide(CryptoLive))
 * ```
 * @since 0.0.1
 */
export const CryptoLive = Layer.mergeAll(
	KeccakLive,
	Secp256k1Live,
	SHA256Live,
	Blake2Live,
	Ripemd160Live,
	Bls12381Live,
	Ed25519Live,
	P256Live,
	KZGLive,
	HDWalletLive,
	Bn254Live,
	Bip39Live,
	HMACLive,
	EIP712Live,
	ChaCha20Poly1305Live,
	KeystoreLive,
);
