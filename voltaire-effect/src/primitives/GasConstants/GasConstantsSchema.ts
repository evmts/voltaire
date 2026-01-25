import { GasConstants } from '@tevm/voltaire'

/**
 * Gas cost constants for EVM operations.
 * These values follow the Ethereum Yellow Paper specifications.
 * @since 0.0.1
 */

/** Zero gas cost @since 0.0.1 */
export const GAS_ZERO = 0n

/** Base gas for quick operations (3 gas) @since 0.0.1 */
export const GAS_BASE = GasConstants.QuickStep

/** Very low gas tier (3 gas) @since 0.0.1 */
export const GAS_VERYLOW = GasConstants.FastestStep

/** Low gas tier (5 gas) @since 0.0.1 */
export const GAS_LOW = GasConstants.FastStep

/** Mid gas tier (8 gas) @since 0.0.1 */
export const GAS_MID = GasConstants.MidStep

/** High gas tier (10 gas) @since 0.0.1 */
export const GAS_HIGH = GasConstants.SlowStep

/** JUMPDEST gas cost (1 gas) @since 0.0.1 */
export const GAS_JUMPDEST = GasConstants.Jumpdest

/** SSTORE set gas (20000 gas) @since 0.0.1 */
export const GAS_SSET = GasConstants.SstoreSet

/** SSTORE reset gas (5000 gas) @since 0.0.1 */
export const GAS_SRESET = GasConstants.SstoreReset

/** SSTORE clear refund (15000 gas) @since 0.0.1 */
export const GAS_SCLEAR = GasConstants.SstoreClear

/** SELFDESTRUCT gas (5000 gas) @since 0.0.1 */
export const GAS_SELFDESTRUCT = GasConstants.Selfdestruct

/** CREATE gas (32000 gas) @since 0.0.1 */
export const GAS_CREATE = GasConstants.Create

/** Code deposit gas per byte (200 gas) @since 0.0.1 */
export const GAS_CODEDEPOSIT = GasConstants.CreateData

/** Call value transfer gas (9000 gas) @since 0.0.1 */
export const GAS_CALLVALUE = GasConstants.CallValueTransfer

/** Call stipend gas (2300 gas) @since 0.0.1 */
export const GAS_CALLSTIPEND = GasConstants.CallStipend

/** New account creation gas (25000 gas) @since 0.0.1 */
export const GAS_NEWACCOUNT = GasConstants.CallNewAccount

/** EXP base gas (10 gas) @since 0.0.1 */
export const GAS_EXP = 10n

/** EXP per byte gas (50 gas) @since 0.0.1 */
export const GAS_EXPBYTE = 50n

/** Memory expansion gas per word (3 gas) @since 0.0.1 */
export const GAS_MEMORY = GasConstants.Memory

/** Transaction contract creation gas (32000 gas) @since 0.0.1 */
export const GAS_TXCREATE = GasConstants.TxContractCreation

/** Transaction data zero byte gas (4 gas) @since 0.0.1 */
export const GAS_TXDATAZERO = GasConstants.TxDataZero

/** Transaction data non-zero byte gas (16 gas post-Istanbul) @since 0.0.1 */
export const GAS_TXDATANONZERO = GasConstants.TxDataNonZero

/** Base transaction gas (21000 gas) @since 0.0.1 */
export const GAS_TRANSACTION = GasConstants.Tx

/** LOG base gas (375 gas) @since 0.0.1 */
export const GAS_LOG = GasConstants.LogBase

/** LOG data gas per byte (8 gas) @since 0.0.1 */
export const GAS_LOGDATA = GasConstants.LogData

/** LOG topic gas (375 gas) @since 0.0.1 */
export const GAS_LOGTOPIC = GasConstants.LogTopic

/** KECCAK256 base gas (30 gas) @since 0.0.1 */
export const GAS_KECCAK256 = GasConstants.Keccak256Base

/** KECCAK256 per word gas (6 gas) @since 0.0.1 */
export const GAS_KECCAK256WORD = GasConstants.Keccak256Word

/** Copy operation gas per word (3 gas) @since 0.0.1 */
export const GAS_COPY = GasConstants.Copy

/** BLOCKHASH gas (20 gas) @since 0.0.1 */
export const GAS_BLOCKHASH = GasConstants.ExtStep
