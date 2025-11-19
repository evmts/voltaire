/**
 * Gas cost constants for EVM operations
 * Based on Yellow Paper Appendix G and various EIPs
 *
 * @see https://ethereum.github.io/yellowpaper/paper.pdf
 * @see EIP-2929 (Gas cost increases for state access)
 * @see EIP-3529 (Refund reduction)
 */
export const GAS_COSTS = {
	/** Base transaction cost (21000 gas) */
	TRANSACTION: 21000n,

	/** Contract creation base cost */
	CREATE: 32000n,

	/** Additional cost for non-zero value transfer */
	CALL_VALUE: 9000n,

	/** Gas stipend provided to called contract when value > 0 */
	CALL_STIPEND: 2300n,

	/** Cold SLOAD cost (EIP-2929) */
	SLOAD: 2100n,

	/** SSTORE from zero to non-zero (most expensive) */
	SSTORE_SET: 20000n,

	/** SSTORE from non-zero to non-zero */
	SSTORE_RESET: 5000n,

	/** SSTORE clear refund (pre-London: 15000, post-London: none) */
	SSTORE_CLEAR: 15000n,

	/** LOG0 base cost */
	LOG: 375n,

	/** Cost per LOG topic */
	LOG_TOPIC: 375n,

	/** Cost per byte of LOG data */
	LOG_DATA: 8n,

	/** Zero byte in calldata (cheaper) */
	CALLDATA_ZERO: 4n,

	/** Non-zero byte in calldata */
	CALLDATA_NONZERO: 16n,

	/** Memory expansion cost per word */
	MEMORY: 3n,

	/** Memory/storage copy cost per word */
	COPY: 3n,

	/** BLOCKHASH opcode */
	BLOCKHASH: 20n,

	/** Cold BALANCE access (EIP-2929) */
	BALANCE: 2600n,

	/** Cold EXTCODECOPY access (EIP-2929) */
	EXTCODECOPY: 2600n,

	/** SELFDESTRUCT cost (no refund post-London) */
	SELFDESTRUCT: 5000n,

	/** Warm storage access cost (EIP-2929) */
	WARM_STORAGE_READ: 100n,

	/** Cold account access cost (EIP-2929) */
	COLD_ACCOUNT_ACCESS: 2600n,

	/** Cost of SLOAD from warm storage */
	SLOAD_WARM: 100n,

	/** Base gas for message call */
	CALL: 100n,

	/** SHA3/KECCAK256 base cost */
	SHA3: 30n,

	/** SHA3/KECCAK256 per word cost */
	SHA3_WORD: 6n,

	/** EXP base cost */
	EXP: 10n,

	/** EXP per byte cost */
	EXP_BYTE: 50n,

	/** JUMPDEST cost */
	JUMPDEST: 1n,

	/** Base cost for most opcodes */
	BASE: 2n,

	/** Very low cost operations (ADD, SUB, etc) */
	VERY_LOW: 3n,

	/** Low cost operations (MUL, DIV, etc) */
	LOW: 5n,

	/** Mid cost operations */
	MID: 8n,

	/** High cost operations */
	HIGH: 10n,
} as const;

/**
 * Block gas limit constants
 */
export const BLOCK_GAS_LIMITS = {
	/** Typical mainnet block gas limit (30M) */
	MAINNET: 30_000_000n,

	/** Minimum gas limit per EIP-1559 */
	MINIMUM: 5000n,
} as const;

/**
 * Transaction type gas costs
 */
export const TRANSACTION_COSTS = {
	/** Minimum gas for simple ETH transfer */
	SIMPLE_TRANSFER: 21000n,

	/** Typical ERC20 transfer cost */
	ERC20_TRANSFER: 65000n,

	/** Typical Uniswap V2 swap cost */
	UNISWAP_SWAP: 150000n,

	/** Contract deployment base */
	CONTRACT_DEPLOY: 32000n,
} as const;
