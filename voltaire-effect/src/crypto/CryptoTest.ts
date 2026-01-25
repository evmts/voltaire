import * as Layer from 'effect/Layer'
import { KeccakTest } from './Keccak256/index.js'
import { Secp256k1Test } from './Secp256k1/index.js'
import { SHA256Test } from './SHA256/index.js'
import { Blake2Test } from './Blake2/index.js'
import { Ripemd160Test } from './Ripemd160/index.js'
import { Ed25519Test } from './Ed25519/index.js'
import { KZGTest } from './KZG/index.js'
import { HDWalletTest } from './HDWallet/HDWalletService.js'
import { Bn254Test } from './Bn254/index.js'
import { Bip39Test } from './Bip39/index.js'
import { HMACTest } from './HMAC/index.js'
import { EIP712Test } from './EIP712/index.js'
import { ChaCha20Poly1305Test } from './ChaCha20Poly1305/index.js'
import { KeystoreTest } from './Keystore/index.js'

/**
 * Combined test layer providing mock implementations for all cryptographic services.
 * Returns deterministic values for unit testing without cryptographic overhead.
 *
 * @example
 * ```typescript
 * import { CryptoTest, KeccakService } from 'voltaire-effect/crypto'
 * import * as Effect from 'effect/Effect'
 *
 * const testProgram = Effect.gen(function* () {
 *   const keccak = yield* KeccakService
 *   const hash = yield* keccak.hash(new Uint8Array([1, 2, 3]))
 *   // Returns zero-filled array for testing
 * }).pipe(Effect.provide(CryptoTest))
 * ```
 * @since 0.0.1
 */
export const CryptoTest = Layer.mergeAll(
  KeccakTest,
  Secp256k1Test,
  SHA256Test,
  Blake2Test,
  Ripemd160Test,
  Ed25519Test,
  KZGTest,
  HDWalletTest,
  Bn254Test,
  Bip39Test,
  HMACTest,
  EIP712Test,
  ChaCha20Poly1305Test,
  KeystoreTest
)
