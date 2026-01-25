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
export { KeccakService, KeccakLive, KeccakTest, hash as keccakHash } from './Keccak256/index.js'
export * from './Secp256k1/index.js'
export { SHA256Service, SHA256Live, SHA256Test, hash as sha256Hash } from './SHA256/index.js'
export { Blake2Service, Blake2Live, Blake2Test, hash as blake2Hash } from './Blake2/index.js'
export { Ripemd160Service, Ripemd160Live, Ripemd160Test, hash as ripemd160Hash } from './Ripemd160/index.js'
export { Bls12381Service, Bls12381Live, sign as bls12381Sign, verify as bls12381Verify, aggregate as bls12381Aggregate, type Bls12381ServiceShape } from './Bls12381/index.js'
export { Ed25519Service, Ed25519Live, Ed25519Test, sign as ed25519Sign, verify as ed25519Verify, getPublicKey as ed25519GetPublicKey, type Ed25519ServiceShape } from './Ed25519/index.js'
export { P256Service, P256Live, sign as p256Sign, verify as p256Verify, type P256ServiceShape } from './P256/index.js'
export { KZGService, KZGLive, KZGTest, blobToKzgCommitment, computeBlobKzgProof, verifyBlobKzgProof, type KZGServiceShape } from './KZG/index.js'
export { HDWalletService, HDWalletLive, HDWalletTest, derive as hdwalletDerive, generateMnemonic, fromSeed, mnemonicToSeed, getPrivateKey as hdwalletGetPrivateKey, getPublicKey as hdwalletGetPublicKey, type HDWalletServiceShape, type HDNode, type HDPath } from './HDWallet/index.js'
export { Bn254Service, Bn254Live, Bn254Test, g1Add, g1Mul, g1Generator, g2Add, g2Mul, g2Generator, pairingCheck, type Bn254ServiceShape } from './Bn254/index.js'
export { Bip39Service, Bip39Live, Bip39Test, generateMnemonic as bip39GenerateMnemonic, validateMnemonic, mnemonicToSeed as bip39MnemonicToSeed, mnemonicToSeedSync, getWordCount, type Bip39ServiceShape } from './Bip39/index.js'
export { HMACService, HMACLive, HMACTest, hmacSha256, hmacSha512, type HMACServiceShape } from './HMAC/index.js'
export { EIP712Service, EIP712Live, EIP712Test, hashTypedData, signTypedData, verifyTypedData, recoverAddress as eip712RecoverAddress, hashDomain, hashStruct, type EIP712ServiceShape } from './EIP712/index.js'
export { AesGcmService, AesGcmLive, AesGcmTest, encrypt as aesGcmEncrypt, decrypt as aesGcmDecrypt, generateKey as aesGcmGenerateKey, generateNonce as aesGcmGenerateNonce, type AesGcmServiceShape } from './AesGcm/index.js'
export { KeystoreService, KeystoreLive, KeystoreTest, encrypt as keystoreEncrypt, decrypt as keystoreDecrypt, type KeystoreServiceShape, type DecryptError as KeystoreDecryptError } from './Keystore/index.js'
export { ChaCha20Poly1305Service, ChaCha20Poly1305Live, ChaCha20Poly1305Test, encrypt as chaCha20Poly1305Encrypt, decrypt as chaCha20Poly1305Decrypt, generateKey as chaCha20Poly1305GenerateKey, generateNonce as chaCha20Poly1305GenerateNonce, type ChaCha20Poly1305ServiceShape } from './ChaCha20Poly1305/index.js'
export { X25519Service, X25519Live, X25519Test, generateKeyPair as x25519GenerateKeyPair, getPublicKey as x25519GetPublicKey, computeSecret as x25519ComputeSecret, type X25519ServiceShape } from './X25519/index.js'
export { ModExpService, ModExpLive, ModExpTest, modexp, modexpBytes, calculateGas as modexpCalculateGas, type ModExpServiceShape } from './ModExp/index.js'
export { SignersService, SignersLive, SignersTest, fromPrivateKey, getAddress as signersGetAddress, recoverTransactionAddress, type SignersServiceShape, type Signer } from './Signers/index.js'
export { CryptoLive } from './CryptoLive.js'
export { CryptoTest } from './CryptoTest.js'
