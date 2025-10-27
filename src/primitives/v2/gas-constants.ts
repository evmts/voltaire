/**
 * EVM gas cost constants for opcode execution
 *
 * This module defines all gas cost constants used in EVM execution according
 * to the Ethereum Yellow Paper and various EIPs. Gas costs are critical for
 * preventing denial-of-service attacks and fairly pricing computational resources.
 *
 * @module gas-constants
 */

// ============================================================================
// Basic Opcode Costs
// ============================================================================

/**
 * Gas cost for very cheap operations (2 gas)
 * Operations: ADDRESS, ORIGIN, CALLER, CALLVALUE, CALLDATASIZE, CODESIZE,
 * GASPRICE, RETURNDATASIZE, PC, MSIZE, GAS, CHAINID, SELFBALANCE
 */
export const GasQuickStep = 2;

/**
 * Gas cost for simple arithmetic and logic operations (3 gas)
 * Operations: ADD, SUB, NOT, LT, GT, SLT, SGT, EQ, ISZERO, AND, OR, XOR,
 * CALLDATALOAD, MLOAD, MSTORE, MSTORE8, PUSH operations, DUP operations,
 * SWAP operations
 */
export const GasFastestStep = 3;

/**
 * Gas cost for multiplication and division operations (5 gas)
 * Operations: MUL, DIV, SDIV, MOD, SMOD, EXP (per byte of exponent)
 */
export const GasFastStep = 5;

/**
 * Gas cost for advanced arithmetic operations (8 gas)
 * Operations: ADDMOD, MULMOD, SIGNEXTEND, KECCAK256 (base cost)
 */
export const GasMidStep = 8;

/**
 * Gas cost for operations requiring moderate computation (10 gas)
 * Operations: JUMPI
 */
export const GasSlowStep = 10;

/**
 * Gas cost for operations that interact with other accounts/contracts (20 gas)
 * Operations: BALANCE, EXTCODESIZE, BLOCKHASH
 */
export const GasExtStep = 20;

// ============================================================================
// Hashing Operation Costs
// ============================================================================

/**
 * Base gas cost for KECCAK256 (SHA3) operation (30 gas)
 * This is the fixed cost regardless of input size
 */
export const Keccak256Gas = 30;

/**
 * Additional gas cost per 32-byte word for KECCAK256 (6 gas)
 * Total cost = Keccak256Gas + (word_count * Keccak256WordGas)
 */
export const Keccak256WordGas = 6;

// ============================================================================
// Storage Operation Costs (EIP-2929 & EIP-2200)
// ============================================================================

/**
 * Gas cost for SLOAD on a warm storage slot (100 gas)
 * After EIP-2929, warm access is significantly cheaper than cold
 */
export const SloadGas = 100;

/**
 * Gas cost for first-time (cold) SLOAD access in a transaction (2100 gas)
 * EIP-2929: Prevents underpriced state access attacks
 */
export const ColdSloadCost = 2100;

/**
 * Gas cost for first-time (cold) account access in a transaction (2600 gas)
 * EIP-2929: Applied to BALANCE, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, CALL family
 */
export const ColdAccountAccessCost = 2600;

/**
 * Gas cost for warm storage read operations (100 gas)
 * EIP-2929: Subsequent accesses to the same slot/account in a transaction
 */
export const WarmStorageReadCost = 100;

/**
 * Minimum gas that must remain for SSTORE to succeed (2300 gas)
 * Prevents storage modifications when gas is nearly exhausted
 */
export const SstoreSentryGas = 2300;

/**
 * Gas cost for SSTORE when setting a storage slot from zero to non-zero (20000 gas)
 * This is the most expensive storage operation as it increases state size
 */
export const SstoreSetGas = 20000;

/**
 * Gas cost for SSTORE when changing an existing non-zero value to another non-zero value (5000 gas)
 * Cheaper than initial set since slot is already allocated
 */
export const SstoreResetGas = 5000;

/**
 * Gas cost for SSTORE when clearing a storage slot (non-zero to zero) (5000 gas)
 * Same cost as reset, but eligible for gas refund
 */
export const SstoreClearGas = 5000;

/**
 * Gas refund for clearing storage slot to zero (4800 gas)
 * EIP-3529: Reduced from 15000 to prevent gas refund abuse
 */
export const SstoreRefundGas = 4800;

// ============================================================================
// Control Flow Costs
// ============================================================================

/**
 * Gas cost for JUMPDEST opcode (1 gas)
 * Minimal cost as it's just a marker for valid jump destinations
 */
export const JumpdestGas = 1;

// ============================================================================
// Logging Operation Costs
// ============================================================================

/**
 * Base gas cost for LOG operations (LOG0-LOG4) (375 gas)
 * This is the fixed cost before considering data size and topics
 */
export const LogGas = 375;

/**
 * Gas cost per byte of data in LOG operations (8 gas)
 * Incentivizes efficient event data usage
 */
export const LogDataGas = 8;

/**
 * Gas cost per topic in LOG operations (375 gas)
 * Each additional topic (LOG1, LOG2, etc.) adds this cost
 */
export const LogTopicGas = 375;

// ============================================================================
// Contract Creation and Call Costs
// ============================================================================

/**
 * Base gas cost for CREATE opcode (32000 gas)
 * High cost reflects the expense of deploying new contracts
 */
export const CreateGas = 32000;

/**
 * Base gas cost for CALL operations (40 gas)
 * This is the minimum cost before additional charges
 */
export const CallGas = 40;

/**
 * Gas stipend provided to called contract when transferring value (2300 gas)
 * Ensures called contract has minimum gas to execute basic operations
 */
export const CallStipend = 2300;

/**
 * Additional gas cost when CALL transfers value (ETH) (9000 gas)
 * Makes value transfers more expensive to prevent spam
 */
export const CallValueTransferGas = 9000;

/**
 * Additional gas cost when CALL creates a new account (25000 gas)
 * Reflects the cost of adding a new entry to the state trie
 */
export const CallNewAccountGas = 25000;

// ============================================================================
// Call Operation Specific Costs (EIP-150)
// ============================================================================

/**
 * Gas cost for CALL operations with value transfer (9000 gas)
 * EIP-150: IO-heavy operations cost adjustments
 */
export const CallValueCost = 9000;

/**
 * Gas cost for CALLCODE operations (700 gas)
 * EIP-150: Same base cost as other call operations
 */
export const CallCodeCost = 700;

/**
 * Gas cost for DELEGATECALL operations (700 gas)
 * EIP-150: Introduced in Homestead hardfork
 */
export const DelegateCallCost = 700;

/**
 * Gas cost for STATICCALL operations (700 gas)
 * EIP-214: Introduced in Byzantium hardfork
 */
export const StaticCallCost = 700;

/**
 * Cost for creating a new account during calls (25000 gas)
 * Applied when target account doesn't exist and value > 0
 */
export const NewAccountCost = 25000;

/**
 * Base gas cost for SELFDESTRUCT operation (5000 gas)
 * EIP-150 (Tangerine Whistle): Increased from 0 to 5000 gas
 */
export const SelfdestructGas = 5000;

/**
 * Gas refund for SELFDESTRUCT operation (24000 gas)
 * Incentivizes cleaning up unused contracts
 * Note: Removed in EIP-3529 (London)
 */
export const SelfdestructRefundGas = 24000;

// ============================================================================
// Memory Expansion Costs
// ============================================================================

/**
 * Linear coefficient for memory gas calculation (3 gas)
 * Part of the formula: gas = MemoryGas * words + words² / QuadCoeffDiv
 */
export const MemoryGas = 3;

/**
 * Quadratic coefficient divisor for memory gas calculation (512)
 * Makes memory expansion quadratically expensive to prevent DoS attacks
 */
export const QuadCoeffDiv = 512;

// ============================================================================
// Contract Deployment Costs
// ============================================================================

/**
 * Gas cost per byte of contract deployment code (200 gas)
 * Applied to the bytecode being deployed via CREATE/CREATE2
 */
export const CreateDataGas = 200;

/**
 * Gas cost per 32-byte word of initcode (2 gas)
 * EIP-3860: Prevents deploying excessively large contracts
 */
export const InitcodeWordGas = 2;

/**
 * Maximum allowed initcode size in bytes (49152)
 * EIP-3860: Limit is 49152 bytes (2 * MAX_CODE_SIZE)
 */
export const MaxInitcodeSize = 49152;

// ============================================================================
// Transaction Costs
// ============================================================================

/**
 * Base gas cost for a standard transaction (21000 gas)
 * Minimum cost for any transaction regardless of data or computation
 */
export const TxGas = 21000;

/**
 * Base gas cost for contract creation transaction (53000 gas)
 * Higher than standard tx due to contract deployment overhead
 */
export const TxGasContractCreation = 53000;

/**
 * Gas cost per zero byte in transaction data (4 gas)
 * Cheaper than non-zero bytes to incentivize data efficiency
 */
export const TxDataZeroGas = 4;

/**
 * Gas cost per non-zero byte in transaction data (16 gas)
 * Higher cost reflects increased storage and bandwidth requirements
 */
export const TxDataNonZeroGas = 16;

/**
 * Gas cost per word for copy operations (3 gas)
 * Applied to CODECOPY, EXTCODECOPY, RETURNDATACOPY, etc.
 */
export const CopyGas = 3;

/**
 * Alias for backwards compatibility
 */
export const COPY_GAS = CopyGas;

/**
 * Maximum gas refund as a fraction of gas used (5)
 * EIP-3529: Reduced from 1/2 to 1/5 to prevent refund abuse
 */
export const MaxRefundQuotient = 5;

// ============================================================================
// EIP-4844: Shard Blob Transactions
// ============================================================================

/**
 * Gas cost for BLOBHASH opcode (3 gas)
 * Returns the hash of a blob associated with the transaction
 */
export const BlobHashGas = 3;

/**
 * Gas cost for BLOBBASEFEE opcode (2 gas)
 * Returns the base fee for blob gas
 */
export const BlobBaseFeeGas = 2;

// ============================================================================
// EIP-1153: Transient Storage
// ============================================================================

/**
 * Gas cost for TLOAD (transient storage load) (100 gas)
 * Transient storage is cleared after each transaction
 */
export const TLoadGas = 100;

/**
 * Gas cost for TSTORE (transient storage store) (100 gas)
 * Same cost as TLOAD, much cheaper than persistent storage
 */
export const TStoreGas = 100;

// ============================================================================
// Precompile Operation Costs
// ============================================================================

/**
 * Base gas cost for IDENTITY precompile (address 0x04) (15 gas)
 * Minimum cost regardless of input size
 */
export const IDENTITY_BASE_COST = 15;

/**
 * Gas cost per 32-byte word for IDENTITY precompile (3 gas)
 * Total cost = IDENTITY_BASE_COST + (word_count * IDENTITY_WORD_COST)
 */
export const IDENTITY_WORD_COST = 3;

/**
 * Base gas cost for SHA256 precompile (address 0x02) (60 gas)
 * Minimum cost regardless of input size
 */
export const SHA256_BASE_COST = 60;

/**
 * Gas cost per 32-byte word for SHA256 precompile (12 gas)
 * Total cost = SHA256_BASE_COST + (word_count * SHA256_WORD_COST)
 */
export const SHA256_WORD_COST = 12;

/**
 * Base gas cost for RIPEMD160 precompile (address 0x03) (600 gas)
 * Minimum cost regardless of input size
 */
export const RIPEMD160_BASE_COST = 600;

/**
 * Gas cost per 32-byte word for RIPEMD160 precompile (120 gas)
 * Total cost = RIPEMD160_BASE_COST + (word_count * RIPEMD160_WORD_COST)
 */
export const RIPEMD160_WORD_COST = 120;

/**
 * Base gas cost for ECRECOVER precompile (address 0x01) (3000 gas)
 * Fixed cost for elliptic curve signature recovery
 */
export const ECRECOVER_COST = 3000;

// ============================================================================
// BN254 Elliptic Curve Precompile Costs (EIP-196, EIP-197, EIP-1108)
// ============================================================================

/**
 * Gas cost for ECADD precompile (address 0x06) - Istanbul hardfork onwards (150 gas)
 * EIP-1108: Reduced from 500 gas to make zkSNARK operations more affordable
 */
export const ECADD_GAS_COST = 150;

/**
 * Gas cost for ECADD precompile (address 0x06) - Byzantium to Berlin (500 gas)
 * Original cost before EIP-1108 optimization
 */
export const ECADD_GAS_COST_BYZANTIUM = 500;

/**
 * Gas cost for ECMUL precompile (address 0x07) - Istanbul hardfork onwards (6000 gas)
 * EIP-1108: Reduced from 40,000 gas to make zkSNARK operations more affordable
 */
export const ECMUL_GAS_COST = 6000;

/**
 * Gas cost for ECMUL precompile (address 0x07) - Byzantium to Berlin (40000 gas)
 * Original cost before EIP-1108 optimization
 */
export const ECMUL_GAS_COST_BYZANTIUM = 40000;

/**
 * Base gas cost for ECPAIRING precompile (address 0x08) - Istanbul hardfork onwards (45000 gas)
 * EIP-1108: Reduced from 100,000 gas to make zkSNARK operations more affordable
 */
export const ECPAIRING_BASE_GAS_COST = 45000;

/**
 * Per-pair gas cost for ECPAIRING precompile - Istanbul hardfork onwards (34000 gas)
 * EIP-1108: Reduced from 80,000 per pair to 34,000 per pair
 */
export const ECPAIRING_PER_PAIR_GAS_COST = 34000;

/**
 * Base gas cost for ECPAIRING precompile (address 0x08) - Byzantium to Berlin (100000 gas)
 * Original cost before EIP-1108 optimization
 */
export const ECPAIRING_BASE_GAS_COST_BYZANTIUM = 100000;

/**
 * Per-pair gas cost for ECPAIRING precompile - Byzantium to Berlin (80000 gas)
 * Original cost before EIP-1108 optimization
 */
export const ECPAIRING_PER_PAIR_GAS_COST_BYZANTIUM = 80000;

// ============================================================================
// MODEXP Precompile Costs (EIP-2565)
// ============================================================================

/**
 * Minimum gas cost for MODEXP precompile (address 0x05) (200 gas)
 * EIP-2565: Reduced from previous higher costs to provide gas optimization
 */
export const MODEXP_MIN_GAS = 200;

/**
 * Threshold for quadratic complexity in MODEXP gas calculation (64 bytes)
 * Inputs smaller than this use simple quadratic cost formula
 */
export const MODEXP_QUADRATIC_THRESHOLD = 64;

/**
 * Threshold for linear complexity in MODEXP gas calculation (1024 bytes)
 * Inputs between quadratic and linear thresholds use optimized formula
 */
export const MODEXP_LINEAR_THRESHOLD = 1024;

// ============================================================================
// Call Operation Gas Constants (EIP-150 & EIP-2929)
// ============================================================================

/**
 * Base gas cost for CALL operations when target account is warm (100 gas)
 * This is the minimum cost for any call operation
 */
export const CALL_BASE_COST = 100;

/**
 * Gas cost for CALL operations when target account is cold - EIP-2929 (2600 gas)
 * Cold account access is more expensive to prevent state access attacks
 */
export const CALL_COLD_ACCOUNT_COST = 2600;

/**
 * Additional gas cost when CALL transfers value (ETH) (9000 gas)
 * Makes value transfers more expensive to prevent spam
 */
export const CALL_VALUE_TRANSFER_COST = 9000;

/**
 * Additional gas cost when CALL creates a new account (25000 gas)
 * Reflects the cost of adding a new entry to the state trie
 */
export const CALL_NEW_ACCOUNT_COST = 25000;

/**
 * Gas stipend provided to called contract when transferring value (2300 gas)
 * Ensures called contract has minimum gas to execute basic operations
 * This gas cannot be used for value calls to prevent attack vectors
 */
export const GAS_STIPEND_VALUE_TRANSFER = 2300;

/**
 * Divisor for the 63/64 gas retention rule (64)
 * Caller retains 1/64 of available gas, forwards the rest
 * Formula: retained_gas = available_gas / CALL_GAS_RETENTION_DIVISOR
 */
export const CALL_GAS_RETENTION_DIVISOR = 64;

// ============================================================================
// Type Definitions
// ============================================================================

/**
 * Interface for gas costs by opcode
 */
export interface GasCosts {
  [opcode: string]: number;
}

/**
 * Interface for gas costs by hardfork
 */
export interface HardforkGasCosts {
  [hardfork: string]: GasCosts;
}
