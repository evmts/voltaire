/**
 * EVM Gas Cost Constants
 *
 * All gas constants as direct bigint exports according to the Ethereum
 * Yellow Paper and various EIPs.
 */
/**
 * Very cheap operations (2 gas)
 * ADDRESS, ORIGIN, CALLER, CALLVALUE, CALLDATASIZE, CODESIZE,
 * GASPRICE, RETURNDATASIZE, PC, MSIZE, GAS, CHAINID, SELFBALANCE
 * @type {2n}
 */
export const QuickStep: 2n;
/**
 * Simple arithmetic and logic (3 gas)
 * ADD, SUB, NOT, LT, GT, SLT, SGT, EQ, ISZERO, AND, OR, XOR,
 * CALLDATALOAD, MLOAD, MSTORE, MSTORE8, PUSH, DUP, SWAP
 * @type {3n}
 */
export const FastestStep: 3n;
/**
 * Multiplication and division (5 gas)
 * MUL, DIV, SDIV, MOD, SMOD
 * @type {5n}
 */
export const FastStep: 5n;
/**
 * Advanced arithmetic (8 gas)
 * ADDMOD, MULMOD, SIGNEXTEND
 * @type {8n}
 */
export const MidStep: 8n;
/**
 * Moderate computation (10 gas)
 * JUMPI
 * @type {10n}
 */
export const SlowStep: 10n;
/**
 * External account interaction (20 gas)
 * BALANCE, EXTCODESIZE, BLOCKHASH
 * @type {20n}
 */
export const ExtStep: 20n;
/**
 * Base cost for KECCAK256 (30 gas)
 * @type {30n}
 */
export const Keccak256Base: 30n;
/**
 * Per-word cost for KECCAK256 (6 gas per 32 bytes)
 * @type {6n}
 */
export const Keccak256Word: 6n;
/**
 * SLOAD on warm slot (100 gas)
 * @type {100n}
 */
export const Sload: 100n;
/**
 * Cold SLOAD (2100 gas) - EIP-2929
 * @type {2100n}
 */
export const ColdSload: 2100n;
/**
 * Cold account access (2600 gas) - EIP-2929
 * BALANCE, EXTCODESIZE, EXTCODECOPY, EXTCODEHASH, CALL family
 * @type {2600n}
 */
export const ColdAccountAccess: 2600n;
/**
 * Warm storage read (100 gas) - EIP-2929
 * @type {100n}
 */
export const WarmStorageRead: 100n;
/**
 * Minimum gas for SSTORE (2300 gas)
 * @type {2300n}
 */
export const SstoreSentry: 2300n;
/**
 * SSTORE zero to non-zero (20000 gas)
 * @type {20000n}
 */
export const SstoreSet: 20000n;
/**
 * SSTORE modify existing non-zero (5000 gas)
 * @type {5000n}
 */
export const SstoreReset: 5000n;
/**
 * SSTORE clear to zero (5000 gas)
 * @type {5000n}
 */
export const SstoreClear: 5000n;
/**
 * Gas refund for clearing storage (4800 gas) - EIP-3529
 * @type {4800n}
 */
export const SstoreRefund: 4800n;
/**
 * JUMPDEST marker (1 gas)
 * @type {1n}
 */
export const Jumpdest: 1n;
/**
 * Base cost for LOG operations (375 gas)
 * @type {375n}
 */
export const LogBase: 375n;
/**
 * Per-byte cost for LOG data (8 gas)
 * @type {8n}
 */
export const LogData: 8n;
/**
 * Per-topic cost for LOG (375 gas)
 * @type {375n}
 */
export const LogTopic: 375n;
/**
 * Base CREATE cost (32000 gas)
 * @type {32000n}
 */
export const Create: 32000n;
/**
 * Base CALL cost (40 gas)
 * @type {40n}
 */
export const Call: 40n;
/**
 * Gas stipend for value transfer (2300 gas)
 * @type {2300n}
 */
export const CallStipend: 2300n;
/**
 * Additional cost for value transfer (9000 gas)
 * @type {9000n}
 */
export const CallValueTransfer: 9000n;
/**
 * Additional cost for new account creation (25000 gas)
 * @type {25000n}
 */
export const CallNewAccount: 25000n;
/**
 * CALLCODE cost (700 gas) - EIP-150
 * @type {700n}
 */
export const CallCode: 700n;
/**
 * DELEGATECALL cost (700 gas) - EIP-150
 * @type {700n}
 */
export const DelegateCall: 700n;
/**
 * STATICCALL cost (700 gas) - EIP-214
 * @type {700n}
 */
export const StaticCall: 700n;
/**
 * SELFDESTRUCT base cost (5000 gas) - EIP-150
 * @type {5000n}
 */
export const Selfdestruct: 5000n;
/**
 * SELFDESTRUCT refund (24000 gas) - Removed in EIP-3529
 * @type {24000n}
 */
export const SelfdestructRefund: 24000n;
/**
 * 63/64 rule divisor for gas forwarding
 * @type {64n}
 */
export const CallGasRetentionDivisor: 64n;
/**
 * Linear coefficient for memory (3 gas)
 * @type {3n}
 */
export const Memory: 3n;
/**
 * Quadratic coefficient divisor (512)
 * @type {512n}
 */
export const QuadCoeffDiv: 512n;
/**
 * Per-byte cost for deployed code (200 gas)
 * @type {200n}
 */
export const CreateData: 200n;
/**
 * Per-word cost for initcode (2 gas) - EIP-3860
 * @type {2n}
 */
export const InitcodeWord: 2n;
/**
 * Maximum initcode size (49152 bytes) - EIP-3860
 * @type {49152n}
 */
export const MaxInitcodeSize: 49152n;
/**
 * Base transaction cost (21000 gas)
 * @type {21000n}
 */
export const Tx: 21000n;
/**
 * EIP-7825 maximum declared transaction gas limit from Osaka.
 * Applies to transaction admission and block validation, independently of the block gas limit.
 * @type {16777216n}
 */
export const TxGasLimitOsaka: 16777216n;
/**
 * Contract creation transaction base cost (53000 gas)
 * @type {53000n}
 */
export const TxContractCreation: 53000n;
/**
 * Per zero byte in calldata (4 gas)
 * @type {4n}
 */
export const TxDataZero: 4n;
/**
 * Per non-zero byte in calldata (16 gas)
 * @type {16n}
 */
export const TxDataNonZero: 16n;
/**
 * Per word for copy operations (3 gas)
 * @type {3n}
 */
export const Copy: 3n;
/**
 * Maximum refund quotient (1/5) - EIP-3529
 * @type {5n}
 */
export const MaxRefundQuotient: 5n;
/**
 * BLOBHASH opcode cost (3 gas)
 * @type {3n}
 */
export const BlobHash: 3n;
/**
 * BLOBBASEFEE opcode cost (2 gas)
 * @type {2n}
 */
export const BlobBaseFee: 2n;
/**
 * TLOAD cost (100 gas)
 * @type {100n}
 */
export const TLoad: 100n;
/**
 * TSTORE cost (100 gas)
 * @type {100n}
 */
export const TStore: 100n;
/**
 * EIP-8037 `CPSB`: state gas per byte of new state (1530 gas).
 * Targets 120 GiB of state growth per year at a 150M gas limit and 50% usage.
 * @type {1530n}
 */
export const AmsterdamCostPerStateByte: 1530n;
/**
 * EIP-8037 `STATE_BYTES_PER_STORAGE_SET`: bytes charged for a new storage slot
 * (32-byte key + 32-byte value).
 * @type {64n}
 */
export const AmsterdamStateBytesPerStorageSet: 64n;
/**
 * EIP-8037 `STATE_BYTES_PER_NEW_ACCOUNT`: bytes charged for a new account
 * (32 key + 8 nonce + 16 balance + 32 code hash + 32 storage root).
 * @type {120n}
 */
export const AmsterdamStateBytesPerNewAccount: 120n;
/**
 * EIP-8037 `STATE_BYTES_PER_AUTH_BASE`: bytes charged per EIP-7702
 * authorization (3-byte `0xef0100` prefix + 20-byte address).
 * @type {23n}
 */
export const AmsterdamStateBytesPerAuthBase: 23n;
/**
 * EIP-8037 state gas for a new storage slot, replacing the 20000 gas
 * `GAS_STORAGE_SET`: `STATE_BYTES_PER_STORAGE_SET * CPSB` (97920 gas).
 * @type {97920n}
 */
export const AmsterdamStateGasStorageSet: 97920n;
/**
 * EIP-8037 state gas for a new account, replacing the 25000 gas
 * `GAS_NEW_ACCOUNT` and `PER_EMPTY_ACCOUNT_COST` and the state share of the
 * 32000 gas `GAS_CREATE`: `STATE_BYTES_PER_NEW_ACCOUNT * CPSB` (183600 gas).
 * @type {183600n}
 */
export const AmsterdamStateGasNewAccount: 183600n;
/**
 * EIP-8037 state gas per byte of deployed code, replacing the 200 gas per
 * byte `GAS_CODE_DEPOSIT`. Equals `CPSB`. Code deposit also pays
 * `Keccak256Word` regular gas per 32-byte word.
 * @type {1530n}
 */
export const AmsterdamStateGasCodeDepositByte: 1530n;
/**
 * EIP-8037 state gas per EIP-7702 authorization, replacing the state share of
 * the 12500 gas `PER_AUTH_BASE_COST`: `STATE_BYTES_PER_AUTH_BASE * CPSB` (35190 gas).
 * @type {35190n}
 */
export const AmsterdamStateGasAuthBase: 35190n;
/**
 * EIP-8037 `SYSTEM_MAX_SSTORES_PER_CALL`: new slots a system call may set.
 * @type {16n}
 */
export const AmsterdamSystemMaxSstoresPerCall: 16n;
/**
 * EIP-8037 `SYSTEM_CALL_GAS_LIMIT`:
 * `30_000_000 + STATE_BYTES_PER_STORAGE_SET * CPSB * SYSTEM_MAX_SSTORES_PER_CALL`.
 * @type {31566720n}
 */
export const AmsterdamSystemCallGasLimit: 31566720n;
/**
 * EIP-8037 `TX_MAX_TOTAL_GAS_LIMIT`: maximum total (regular + state) gas a
 * transaction may declare, `2^32 - 1`.
 * @type {4294967295n}
 */
export const AmsterdamTxMaxTotalGasLimit: 4294967295n;
/**
 * EIP-8038 `COLD_ACCOUNT_ACCESS`: cold account access (3000 gas, was 2600).
 * @type {3000n}
 */
export const AmsterdamColdAccountAccess: 3000n;
/**
 * EIP-8038 `COLD_STORAGE_ACCESS`: cold storage slot access (2100 gas, unchanged).
 * @type {2100n}
 */
export const AmsterdamColdStorageAccess: 2100n;
/**
 * EIP-8038 `WARM_ACCESS`: warm account or slot access (100 gas, unchanged).
 * @type {100n}
 */
export const AmsterdamWarmAccess: 100n;
/**
 * EIP-8038 `ACCOUNT_WRITE`: writing an account (9000 gas, was 6700).
 * `CALL_VALUE` becomes `ACCOUNT_WRITE + CALL_STIPEND`.
 * @type {9000n}
 */
export const AmsterdamAccountWrite: 9000n;
/**
 * EIP-8038 `STORAGE_WRITE`: moving a slot away from its transaction-start
 * value (10000 gas, was 2800).
 * @type {10000n}
 */
export const AmsterdamStorageWrite: 10000n;
/**
 * EIP-8038 `CREATE_ACCESS`: regular gas for CREATE and CREATE2,
 * `ACCOUNT_WRITE + COLD_ACCOUNT_ACCESS` (12000 gas, was 7000).
 * @type {12000n}
 */
export const AmsterdamCreateAccess: 12000n;
/**
 * EIP-8038 `CALL_VALUE`: `ACCOUNT_WRITE + CALL_STIPEND` (11300 gas, was 9000).
 * @type {11300n}
 */
export const AmsterdamCallValue: 11300n;
/**
 * EIP-8038 `STORAGE_CLEAR_REFUND`:
 * `(STORAGE_WRITE + COLD_STORAGE_ACCESS) * 4800 / 5000` (11616 gas, was 4800).
 * @type {11616n}
 */
export const AmsterdamStorageClearRefund: 11616n;
/**
 * EIP-8038 `ACCESS_LIST_ADDRESS_COST`:
 * `COLD_ACCOUNT_ACCESS - WARM_ACCESS` (2900 gas, was 2400).
 * @type {2900n}
 */
export const AmsterdamAccessListAddress: 2900n;
/**
 * EIP-8038 `ACCESS_LIST_STORAGE_KEY_COST`:
 * `COLD_STORAGE_ACCESS - WARM_ACCESS` (2000 gas, was 1900).
 * @type {2000n}
 */
export const AmsterdamAccessListStorageKey: 2000n;
/**
 * EIP-8037 `EXECUTION_PER_AUTH_BASE_COST`: regular gas per EIP-7702
 * authorization. Sum of calldata (101 bytes * 16 = 1616), ECRECOVER (3000),
 * `COLD_ACCOUNT_ACCESS` (3000), and two `WARM_ACCESS` (200).
 * @type {7816n}
 */
export const AmsterdamExecutionPerAuthBase: 7816n;
//# sourceMappingURL=constants.d.ts.map