/**
 * EVM Gas Cost Constants
 *
 * All gas constants as direct bigint exports according to the Ethereum
 * Yellow Paper and various EIPs.
 */

// ==========================================================================
// Basic Opcode Costs
// ==========================================================================

/**
 * Very cheap operations (2 gas)
 * ADDRESS, ORIGIN, CALLER, CALLVALUE, CALLDATASIZE, CODESIZE,
 * GASPRICE, RETURNDATASIZE, PC, MSIZE, GAS, CHAINID, SELFBALANCE
 * @type {2n}
 */
export const QuickStep = 2n;

/**
 * Simple arithmetic and logic (3 gas)
 * ADD, SUB, NOT, LT, GT, SLT, SGT, EQ, ISZERO, AND, OR, XOR,
 * CALLDATALOAD, MLOAD, MSTORE, MSTORE8, PUSH, DUP, SWAP
 * @type {3n}
 */
export const FastestStep = 3n;

/**
 * Multiplication and division (5 gas)
 * MUL, DIV, SDIV, MOD, SMOD
 * @type {5n}
 */
export const FastStep = 5n;

/**
 * Advanced arithmetic (8 gas)
 * ADDMOD, MULMOD, SIGNEXTEND
 * @type {8n}
 */
export const MidStep = 8n;

/**
 * Moderate computation (10 gas)
 * JUMPI
 * @type {10n}
 */
export const SlowStep = 10n;

/**
 * External account interaction (20 gas)
 * BALANCE, EXTCODESIZE, BLOCKHASH
 * @type {20n}
 */
export const ExtStep = 20n;

// ==========================================================================
// Hashing Operations
// ==========================================================================

/**
 * Base cost for KECCAK256 (30 gas)
 * @type {30n}
 */
export const Keccak256Base = 30n;

/**
 * Per-word cost for KECCAK256 (6 gas per 32 bytes)
 * @type {6n}
 */
export const Keccak256Word = 6n;

// ==========================================================================
// Storage Operations (EIP-2929 & EIP-2200)
// ==========================================================================

/**
 * SLOAD on warm slot (100 gas)
 * @type {100n}
 */
export const Sload = 100n;

/**
 * Cold SLOAD (2100 gas) - EIP-2929
 * @type {2100n}
 */
export const ColdSload = 2100n;

/**
 * Cold account access (2600 gas) - EIP-2929
 * BALANCE, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, CALL family
 * @type {2600n}
 */
export const ColdAccountAccess = 2600n;

/**
 * Warm storage read (100 gas) - EIP-2929
 * @type {100n}
 */
export const WarmStorageRead = 100n;

/**
 * Minimum gas for SSTORE (2300 gas)
 * @type {2300n}
 */
export const SstoreSentry = 2300n;

/**
 * SSTORE zero to non-zero (20000 gas)
 * @type {20000n}
 */
export const SstoreSet = 20000n;

/**
 * SSTORE modify existing non-zero (5000 gas)
 * @type {5000n}
 */
export const SstoreReset = 5000n;

/**
 * SSTORE clear to zero (5000 gas)
 * @type {5000n}
 */
export const SstoreClear = 5000n;

/**
 * Gas refund for clearing storage (4800 gas) - EIP-3529
 * @type {4800n}
 */
export const SstoreRefund = 4800n;

// ==========================================================================
// Control Flow
// ==========================================================================

/**
 * JUMPDEST marker (1 gas)
 * @type {1n}
 */
export const Jumpdest = 1n;

// ==========================================================================
// Logging Operations
// ==========================================================================

/**
 * Base cost for LOG operations (375 gas)
 * @type {375n}
 */
export const LogBase = 375n;

/**
 * Per-byte cost for LOG data (8 gas)
 * @type {8n}
 */
export const LogData = 8n;

/**
 * Per-topic cost for LOG (375 gas)
 * @type {375n}
 */
export const LogTopic = 375n;

// ==========================================================================
// Contract Creation and Calls
// ==========================================================================

/**
 * Base CREATE cost (32000 gas)
 * @type {32000n}
 */
export const Create = 32000n;

/**
 * Base CALL cost (40 gas)
 * @type {40n}
 */
export const Call = 40n;

/**
 * Gas stipend for value transfer (2300 gas)
 * @type {2300n}
 */
export const CallStipend = 2300n;

/**
 * Additional cost for value transfer (9000 gas)
 * @type {9000n}
 */
export const CallValueTransfer = 9000n;

/**
 * Additional cost for new account creation (25000 gas)
 * @type {25000n}
 */
export const CallNewAccount = 25000n;

/**
 * CALLCODE cost (700 gas) - EIP-150
 * @type {700n}
 */
export const CallCode = 700n;

/**
 * DELEGATECALL cost (700 gas) - EIP-150
 * @type {700n}
 */
export const DelegateCall = 700n;

/**
 * STATICCALL cost (700 gas) - EIP-214
 * @type {700n}
 */
export const StaticCall = 700n;

/**
 * SELFDESTRUCT base cost (5000 gas) - EIP-150
 * @type {5000n}
 */
export const Selfdestruct = 5000n;

/**
 * SELFDESTRUCT refund (24000 gas) - Removed in EIP-3529
 * @type {24000n}
 */
export const SelfdestructRefund = 24000n;

/**
 * 63/64 rule divisor for gas forwarding
 * @type {64n}
 */
export const CallGasRetentionDivisor = 64n;

// ==========================================================================
// Memory Expansion
// ==========================================================================

/**
 * Linear coefficient for memory (3 gas)
 * @type {3n}
 */
export const Memory = 3n;

/**
 * Quadratic coefficient divisor (512)
 * @type {512n}
 */
export const QuadCoeffDiv = 512n;

// ==========================================================================
// Contract Deployment
// ==========================================================================

/**
 * Per-byte cost for deployed code (200 gas)
 * @type {200n}
 */
export const CreateData = 200n;

/**
 * Per-word cost for initcode (2 gas) - EIP-3860
 * @type {2n}
 */
export const InitcodeWord = 2n;

/**
 * Maximum initcode size (49152 bytes) - EIP-3860
 * @type {49152n}
 */
export const MaxInitcodeSize = 49152n;

// ==========================================================================
// Transaction Costs
// ==========================================================================

/**
 * Base transaction cost (21000 gas)
 * @type {21000n}
 */
export const Tx = 21000n;

/**
 * Contract creation transaction base cost (53000 gas)
 * @type {53000n}
 */
export const TxContractCreation = 53000n;

/**
 * Per zero byte in calldata (4 gas)
 * @type {4n}
 */
export const TxDataZero = 4n;

/**
 * Per non-zero byte in calldata (16 gas)
 * @type {16n}
 */
export const TxDataNonZero = 16n;

/**
 * Per word for copy operations (3 gas)
 * @type {3n}
 */
export const Copy = 3n;

/**
 * Maximum refund quotient (1/5) - EIP-3529
 * @type {5n}
 */
export const MaxRefundQuotient = 5n;

// ==========================================================================
// EIP-4844: Blob Transactions
// ==========================================================================

/**
 * BLOBHASH opcode cost (3 gas)
 * @type {3n}
 */
export const BlobHash = 3n;

/**
 * BLOBBASEFEE opcode cost (2 gas)
 * @type {2n}
 */
export const BlobBaseFee = 2n;

// ==========================================================================
// EIP-1153: Transient Storage
// ==========================================================================

/**
 * TLOAD cost (100 gas)
 * @type {100n}
 */
export const TLoad = 100n;

/**
 * TSTORE cost (100 gas)
 * @type {100n}
 */
export const TStore = 100n;
