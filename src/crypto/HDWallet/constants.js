/**
 * First hardened child index
 * @type {number}
 */
export const HARDENED_OFFSET = 0x80000000;

/**
 * Standard BIP-44 coin types
 * @type {Readonly<{ BTC: 0, BTC_TESTNET: 1, ETH: 60, ETC: 61 }>}
 */
export const CoinType = Object.freeze({
	/** Bitcoin */
	BTC: 0,
	/** Bitcoin Testnet */
	BTC_TESTNET: 1,
	/** Ethereum */
	ETH: 60,
	/** Ethereum Classic */
	ETC: 61,
});

/**
 * Standard BIP-44 path templates
 * Format: m / purpose' / coin_type' / account' / change / address_index
 * @type {Readonly<{ ETH: (account?: number, index?: number) => string, BTC: (account?: number, index?: number) => string }>}
 */
export const BIP44_PATH = Object.freeze({
	/** Ethereum: m/44'/60'/0'/0/x */
	ETH: (account = 0, index = 0) => `m/44'/60'/${account}'/0/${index}`,
	/** Bitcoin: m/44'/0'/0'/0/x */
	BTC: (account = 0, index = 0) => `m/44'/0'/${account}'/0/${index}`,
});
