/**
 * BIP-39 mnemonic module for Effect.
 * Generates and validates mnemonic phrases for HD wallet derivation.
 * @module
 * @since 0.0.1
 */
export { Bip39Service, Bip39Live, Bip39Test, type Bip39ServiceShape } from './Bip39Service.js'
export { generateMnemonic, validateMnemonic, mnemonicToSeed, mnemonicToSeedSync, getWordCount } from './operations.js'
