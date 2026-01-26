/**
 * Comprehensive cryptographic services for Effect-based applications.
 *
 * This module provides Effect-wrapped access to all Voltaire cryptographic primitives:
 * - **Hashing**: Keccak256, SHA256, Blake2, RIPEMD160
 * - **Signatures**: Secp256k1, Ed25519, P-256, BLS12-381
 * - **Curves**: BN254 (alt_bn128) for zkSNARKs
 * - **Key Derivation**: HD Wallet (BIP-32/39/44), BIP-39 mnemonics
 * - **Commitments**: KZG (EIP-4844)
 * - **Authentication**: HMAC, EIP-712 typed data
 *
 * @example
 * ```typescript
 * import { CryptoLive, KeccakService, Secp256k1Service } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const program = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   const secp = yield* Secp256k1Service
 *   const hash = yield* keccak.hash(message)
 *   const sig = yield* secp.sign(hash, privateKey)
 *   return sig
 * }).pipe(Effect.provide(CryptoLive))
 * ```
 *
 * @module
 * @since 0.0.1
 */

export {
	AesGcmLive,
	AesGcmService,
	type AesGcmServiceShape,
	AesGcmTest,
	decrypt as aesGcmDecrypt,
	encrypt as aesGcmEncrypt,
	generateKey as aesGcmGenerateKey,
	generateNonce as aesGcmGenerateNonce,
} from "./AesGcm/index.js";
export {
	Bip39Live,
	Bip39Service,
	type Bip39ServiceShape,
	Bip39Test,
	generateMnemonic as bip39GenerateMnemonic,
	getWordCount,
	mnemonicToSeed as bip39MnemonicToSeed,
	mnemonicToSeedSync,
	validateMnemonic,
} from "./Bip39/index.js";
export {
	Blake2Live,
	Blake2Service,
	Blake2Test,
	hash as blake2Hash,
} from "./Blake2/index.js";
export {
	aggregate as bls12381Aggregate,
	Bls12381Live,
	Bls12381Service,
	type Bls12381ServiceShape,
	sign as bls12381Sign,
	verify as bls12381Verify,
} from "./Bls12381/index.js";
export {
	Bn254Error,
	Bn254Live,
	Bn254Service,
	type Bn254ServiceShape,
	Bn254Test,
	g1Add,
	g1Generator,
	g1Mul,
	g2Add,
	g2Generator,
	g2Mul,
	pairingCheck,
} from "./Bn254/index.js";
export {
	ChaCha20Poly1305Live,
	ChaCha20Poly1305Service,
	type ChaCha20Poly1305ServiceShape,
	ChaCha20Poly1305Test,
	decrypt as chaCha20Poly1305Decrypt,
	encrypt as chaCha20Poly1305Encrypt,
	generateKey as chaCha20Poly1305GenerateKey,
	generateNonce as chaCha20Poly1305GenerateNonce,
} from "./ChaCha20Poly1305/index.js";
export { CryptoLive } from "./CryptoLive.js";
export { CryptoTest } from "./CryptoTest.js";
export {
	Ed25519Live,
	Ed25519Service,
	type Ed25519ServiceShape,
	Ed25519Test,
	getPublicKey as ed25519GetPublicKey,
	sign as ed25519Sign,
	verify as ed25519Verify,
} from "./Ed25519/index.js";
export {
	EIP712Live,
	EIP712Service,
	type EIP712ServiceShape,
	EIP712Test,
	hashDomain,
	hashStruct,
	hashTypedData,
	recoverAddress as eip712RecoverAddress,
	signTypedData,
	verifyTypedData,
} from "./EIP712/index.js";
export {
	derive as hdwalletDerive,
	fromMnemonic,
	fromSeed,
	generateMnemonic,
	getPrivateKey as hdwalletGetPrivateKey,
	getPublicKey as hdwalletGetPublicKey,
	HardenedDerivationError,
	type HDNode,
	type HDPath,
	type HDWalletError,
	HDWalletLive,
	HDWalletService,
	type HDWalletServiceShape,
	HDWalletTest,
	InvalidKeyError,
	InvalidPathError,
	InvalidSeedError,
	mnemonicToSeed,
	withPrivateKey as hdwalletWithPrivateKey,
	withSeed as hdwalletWithSeed,
} from "./HDWallet/index.js";
export {
	HMACLive,
	HMACService,
	type HMACServiceShape,
	HMACTest,
	hmacSha256,
	hmacSha512,
} from "./HMAC/index.js";
export {
	hash as keccakHash,
	KeccakLive,
	KeccakService,
	KeccakTest,
} from "./Keccak256/index.js";
export {
	type DecryptError as KeystoreDecryptError,
	decrypt as keystoreDecrypt,
	encrypt as keystoreEncrypt,
	withDecryptedKey as keystoreWithDecryptedKey,
	KeystoreLive,
	KeystoreService,
	type KeystoreServiceShape,
	KeystoreTest,
} from "./Keystore/index.js";
export {
	blobToKzgCommitment,
	computeBlobKzgProof,
	KZGError,
	KZGLive,
	KZGService,
	type KZGServiceShape,
	KZGTest,
	verifyBlobKzgProof,
} from "./KZG/index.js";
export {
	calculateGas as modexpCalculateGas,
	ModExpLive,
	ModExpService,
	type ModExpServiceShape,
	ModExpTest,
	modexp,
	modexpBytes,
} from "./ModExp/index.js";
export {
	P256Live,
	P256Service,
	type P256ServiceShape,
	sign as p256Sign,
	verify as p256Verify,
} from "./P256/index.js";
export {
	hash as ripemd160Hash,
	Ripemd160Live,
	Ripemd160Service,
	Ripemd160Test,
} from "./Ripemd160/index.js";
export * from "./Secp256k1/index.js";
export {
	hash as sha256Hash,
	SHA256Live,
	SHA256Service,
	SHA256Test,
} from "./SHA256/index.js";
// Signers module temporarily disabled - requires @tevm/voltaire exports update
// export {
// 	fromPrivateKey,
// 	getAddress as signersGetAddress,
// 	recoverTransactionAddress,
// 	type Signer,
// 	SignersLive,
// 	SignersService,
// 	type SignersServiceShape,
// 	SignersTest,
// } from "./Signers/index.js";
export {
	computeSecret as x25519ComputeSecret,
	generateKeyPair as x25519GenerateKeyPair,
	getPublicKey as x25519GetPublicKey,
	X25519Live,
	X25519Service,
	type X25519ServiceShape,
	X25519Test,
} from "./X25519/index.js";
