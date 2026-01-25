/**
 * Hierarchical Deterministic wallet module for Effect.
 * Implements BIP-32/BIP-39/BIP-44 for deterministic key derivation.
 * @module
 * @since 0.0.1
 */
export { HDWalletService, HDWalletTest, type HDWalletServiceShape, type HDNode, type HDPath } from './HDWalletService.js'
export { HDWalletLive } from './HDWalletLive.js'
export { derive, generateMnemonic, fromSeed, mnemonicToSeed, getPrivateKey, getPublicKey } from './derive.js'
