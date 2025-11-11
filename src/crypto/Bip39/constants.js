/**
 * 128 bits entropy = 12 words
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const mnemonic = Bip39.generateMnemonic(Bip39.ENTROPY_128);
 * ```
 */
export const ENTROPY_128 = 128;

/**
 * 160 bits entropy = 15 words
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const mnemonic = Bip39.generateMnemonic(Bip39.ENTROPY_160);
 * ```
 */
export const ENTROPY_160 = 160;

/**
 * 192 bits entropy = 18 words
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const mnemonic = Bip39.generateMnemonic(Bip39.ENTROPY_192);
 * ```
 */
export const ENTROPY_192 = 192;

/**
 * 224 bits entropy = 21 words
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const mnemonic = Bip39.generateMnemonic(Bip39.ENTROPY_224);
 * ```
 */
export const ENTROPY_224 = 224;

/**
 * 256 bits entropy = 24 words
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const mnemonic = Bip39.generateMnemonic(Bip39.ENTROPY_256);
 * ```
 */
export const ENTROPY_256 = 256;

/**
 * BIP-39 seed length (512 bits / 64 bytes)
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @throws {never}
 * @example
 * ```javascript
 * import * as Bip39 from './crypto/Bip39/index.js';
 * const seed = await Bip39.mnemonicToSeed(mnemonic);
 * console.log(seed.length === Bip39.SEED_LENGTH);
 * ```
 */
export const SEED_LENGTH = 64;
