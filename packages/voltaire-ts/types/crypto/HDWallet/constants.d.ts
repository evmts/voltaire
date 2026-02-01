/**
 * First hardened child index offset for BIP-32 derivation.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {number}
 * @example
 * ```javascript
 * import { HARDENED_OFFSET } from './crypto/HDWallet/constants.js';
 * const hardenedIndex = 0 + HARDENED_OFFSET; // 0x80000000
 * ```
 */
export const HARDENED_OFFSET: number;
/**
 * Standard BIP-44 coin type constants.
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {Readonly<{ BTC: 0, BTC_TESTNET: 1, ETH: 60, ETC: 61 }>}
 * @example
 * ```javascript
 * import { CoinType } from './crypto/HDWallet/constants.js';
 * console.log(CoinType.ETH); // 60
 * ```
 */
export const CoinType: Readonly<{
    BTC: 0;
    BTC_TESTNET: 1;
    ETH: 60;
    ETC: 61;
}>;
/**
 * Standard BIP-44 path template functions.
 *
 * Format: m / purpose' / coin_type' / account' / change / address_index
 *
 * @see https://voltaire.tevm.sh/crypto for crypto documentation
 * @since 0.0.0
 * @type {Readonly<{ ETH: (account?: number, index?: number) => string, BTC: (account?: number, index?: number) => string }>}
 * @example
 * ```javascript
 * import { BIP44_PATH } from './crypto/HDWallet/constants.js';
 * const ethPath = BIP44_PATH.ETH(0, 0); // "m/44'/60'/0'/0/0"
 * const btcPath = BIP44_PATH.BTC(0, 1); // "m/44'/0'/0'/0/1"
 * ```
 */
export const BIP44_PATH: Readonly<{
    ETH: (account?: number, index?: number) => string;
    BTC: (account?: number, index?: number) => string;
}>;
//# sourceMappingURL=constants.d.ts.map