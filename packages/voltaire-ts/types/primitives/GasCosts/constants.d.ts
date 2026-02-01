/**
 * Gas cost constants for EVM operations
 * Based on Yellow Paper Appendix G and various EIPs
 *
 * @see https://ethereum.github.io/yellowpaper/paper.pdf
 * @see EIP-2929 (Gas cost increases for state access)
 * @see EIP-3529 (Refund reduction)
 */
export declare const GAS_COSTS: {
    /** Base transaction cost (21000 gas) */
    readonly TRANSACTION: 21000n;
    /** Contract creation base cost */
    readonly CREATE: 32000n;
    /** Additional cost for non-zero value transfer */
    readonly CALL_VALUE: 9000n;
    /** Gas stipend provided to called contract when value > 0 */
    readonly CALL_STIPEND: 2300n;
    /** Cold SLOAD cost (EIP-2929) */
    readonly SLOAD: 2100n;
    /** SSTORE from zero to non-zero (most expensive) */
    readonly SSTORE_SET: 20000n;
    /** SSTORE from non-zero to non-zero */
    readonly SSTORE_RESET: 5000n;
    /** SSTORE clear refund (pre-London: 15000, post-London: none) */
    readonly SSTORE_CLEAR: 15000n;
    /** LOG0 base cost */
    readonly LOG: 375n;
    /** Cost per LOG topic */
    readonly LOG_TOPIC: 375n;
    /** Cost per byte of LOG data */
    readonly LOG_DATA: 8n;
    /** Zero byte in calldata (cheaper) */
    readonly CALLDATA_ZERO: 4n;
    /** Non-zero byte in calldata */
    readonly CALLDATA_NONZERO: 16n;
    /** Memory expansion cost per word */
    readonly MEMORY: 3n;
    /** Memory/storage copy cost per word */
    readonly COPY: 3n;
    /** BLOCKHASH opcode */
    readonly BLOCKHASH: 20n;
    /** Cold BALANCE access (EIP-2929) */
    readonly BALANCE: 2600n;
    /** Cold EXTCODECOPY access (EIP-2929) */
    readonly EXTCODECOPY: 2600n;
    /** SELFDESTRUCT cost (no refund post-London) */
    readonly SELFDESTRUCT: 5000n;
    /** Warm storage access cost (EIP-2929) */
    readonly WARM_STORAGE_READ: 100n;
    /** Cold account access cost (EIP-2929) */
    readonly COLD_ACCOUNT_ACCESS: 2600n;
    /** Cost of SLOAD from warm storage */
    readonly SLOAD_WARM: 100n;
    /** Base gas for message call */
    readonly CALL: 100n;
    /** SHA3/KECCAK256 base cost */
    readonly SHA3: 30n;
    /** SHA3/KECCAK256 per word cost */
    readonly SHA3_WORD: 6n;
    /** EXP base cost */
    readonly EXP: 10n;
    /** EXP per byte cost */
    readonly EXP_BYTE: 50n;
    /** JUMPDEST cost */
    readonly JUMPDEST: 1n;
    /** Base cost for most opcodes */
    readonly BASE: 2n;
    /** Very low cost operations (ADD, SUB, etc) */
    readonly VERY_LOW: 3n;
    /** Low cost operations (MUL, DIV, etc) */
    readonly LOW: 5n;
    /** Mid cost operations */
    readonly MID: 8n;
    /** High cost operations */
    readonly HIGH: 10n;
};
/**
 * Block gas limit constants
 */
export declare const BLOCK_GAS_LIMITS: {
    /** Typical mainnet block gas limit (30M) */
    readonly MAINNET: 30000000n;
    /** Minimum gas limit per EIP-1559 */
    readonly MINIMUM: 5000n;
};
/**
 * Transaction type gas costs
 */
export declare const TRANSACTION_COSTS: {
    /** Minimum gas for simple ETH transfer */
    readonly SIMPLE_TRANSFER: 21000n;
    /** Typical ERC20 transfer cost */
    readonly ERC20_TRANSFER: 65000n;
    /** Typical Uniswap V2 swap cost */
    readonly UNISWAP_SWAP: 150000n;
    /** Contract deployment base */
    readonly CONTRACT_DEPLOY: 32000n;
};
//# sourceMappingURL=constants.d.ts.map