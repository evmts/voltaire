/**
 * @fileoverview EVM gas cost constants following the Ethereum Yellow Paper.
 *
 * @description
 * Provides gas cost constants for all EVM operations. These values are
 * essential for gas estimation, transaction simulation, and understanding
 * the computational costs of smart contract execution.
 *
 * Gas tiers (from Yellow Paper):
 * - Zero: 0 gas (POP, STOP, etc.)
 * - Base/VeryLow: 3 gas (ADD, SUB, AND, OR, etc.)
 * - Low: 5 gas (MUL, DIV, etc.)
 * - Mid: 8 gas (ADDMOD, MULMOD, etc.)
 * - High: 10 gas (JUMP, etc.)
 *
 * @module GasConstants/GasConstantsSchema
 * @since 0.0.1
 * @see {@link GasCosts} for opcode-indexed costs
 * @see https://ethereum.github.io/yellowpaper/paper.pdf Appendix G
 */

import { GasConstants } from "@tevm/voltaire";

/**
 * Gas cost constants for EVM operations.
 *
 * @description
 * These values follow the Ethereum Yellow Paper specifications and are
 * updated per hard fork. All values are in gas units (bigint).
 *
 * @example
 * ```typescript
 * import { GAS_TRANSACTION, GAS_TXDATANONZERO, GAS_TXDATAZERO } from 'voltaire-effect/primitives/GasConstants'
 *
 * // Calculate intrinsic gas for a transaction
 * function intrinsicGas(data: Uint8Array): bigint {
 *   let gas = GAS_TRANSACTION
 *   for (const byte of data) {
 *     gas += byte === 0 ? GAS_TXDATAZERO : GAS_TXDATANONZERO
 *   }
 *   return gas
 * }
 * ```
 *
 * @since 0.0.1
 */

/**
 * Zero gas cost - used for free operations like STOP.
 * @since 0.0.1
 */
export const GAS_ZERO = 0n;

/** Base gas for quick operations (3 gas) @since 0.0.1 */
export const GAS_BASE = GasConstants.QuickStep;

/** Very low gas tier (3 gas) @since 0.0.1 */
export const GAS_VERYLOW = GasConstants.FastestStep;

/** Low gas tier (5 gas) @since 0.0.1 */
export const GAS_LOW = GasConstants.FastStep;

/** Mid gas tier (8 gas) @since 0.0.1 */
export const GAS_MID = GasConstants.MidStep;

/** High gas tier (10 gas) @since 0.0.1 */
export const GAS_HIGH = GasConstants.SlowStep;

/** JUMPDEST gas cost (1 gas) @since 0.0.1 */
export const GAS_JUMPDEST = GasConstants.Jumpdest;

/** SSTORE set gas (20000 gas) @since 0.0.1 */
export const GAS_SSET = GasConstants.SstoreSet;

/** SSTORE reset gas (5000 gas) @since 0.0.1 */
export const GAS_SRESET = GasConstants.SstoreReset;

/** SSTORE clear refund (15000 gas) @since 0.0.1 */
export const GAS_SCLEAR = GasConstants.SstoreClear;

/** SELFDESTRUCT gas (5000 gas) @since 0.0.1 */
export const GAS_SELFDESTRUCT = GasConstants.Selfdestruct;

/** CREATE gas (32000 gas) @since 0.0.1 */
export const GAS_CREATE = GasConstants.Create;

/** Code deposit gas per byte (200 gas) @since 0.0.1 */
export const GAS_CODEDEPOSIT = GasConstants.CreateData;

/** Call value transfer gas (9000 gas) @since 0.0.1 */
export const GAS_CALLVALUE = GasConstants.CallValueTransfer;

/** Call stipend gas (2300 gas) @since 0.0.1 */
export const GAS_CALLSTIPEND = GasConstants.CallStipend;

/** New account creation gas (25000 gas) @since 0.0.1 */
export const GAS_NEWACCOUNT = GasConstants.CallNewAccount;

/** EXP base gas (10 gas) @since 0.0.1 */
export const GAS_EXP = 10n;

/** EXP per byte gas (50 gas) @since 0.0.1 */
export const GAS_EXPBYTE = 50n;

/** Memory expansion gas per word (3 gas) @since 0.0.1 */
export const GAS_MEMORY = GasConstants.Memory;

/** Transaction contract creation gas (32000 gas) @since 0.0.1 */
export const GAS_TXCREATE = GasConstants.TxContractCreation;

/** Transaction data zero byte gas (4 gas) @since 0.0.1 */
export const GAS_TXDATAZERO = GasConstants.TxDataZero;

/** Transaction data non-zero byte gas (16 gas post-Istanbul) @since 0.0.1 */
export const GAS_TXDATANONZERO = GasConstants.TxDataNonZero;

/** Base transaction gas (21000 gas) @since 0.0.1 */
export const GAS_TRANSACTION = GasConstants.Tx;

/** LOG base gas (375 gas) @since 0.0.1 */
export const GAS_LOG = GasConstants.LogBase;

/** LOG data gas per byte (8 gas) @since 0.0.1 */
export const GAS_LOGDATA = GasConstants.LogData;

/** LOG topic gas (375 gas) @since 0.0.1 */
export const GAS_LOGTOPIC = GasConstants.LogTopic;

/** KECCAK256 base gas (30 gas) @since 0.0.1 */
export const GAS_KECCAK256 = GasConstants.Keccak256Base;

/** KECCAK256 per word gas (6 gas) @since 0.0.1 */
export const GAS_KECCAK256WORD = GasConstants.Keccak256Word;

/** Copy operation gas per word (3 gas) @since 0.0.1 */
export const GAS_COPY = GasConstants.Copy;

/** BLOCKHASH gas (20 gas) @since 0.0.1 */
export const GAS_BLOCKHASH = GasConstants.ExtStep;
