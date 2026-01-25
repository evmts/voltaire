/**
 * @module ReceiptSchema
 * Effect Schema definitions for transaction receipts and logs.
 * @since 0.0.1
 */
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire'
import type { AddressType } from '@tevm/voltaire/Address'
import type { HashType } from '@tevm/voltaire/Hash'

/**
 * Type representing an event log emitted during transaction execution.
 * @since 0.0.1
 */
export interface LogType {
  readonly address: AddressType
  readonly topics: readonly HashType[]
  readonly data: Uint8Array
  readonly blockNumber: bigint
  readonly transactionHash: HashType
  readonly transactionIndex: number
  readonly blockHash: HashType
  readonly logIndex: number
  readonly removed: boolean
}

/**
 * Type representing a transaction receipt with execution results.
 * @since 0.0.1
 */
export interface ReceiptType {
  /** Transaction hash */
  readonly transactionHash: HashType
  /** Block number containing the transaction */
  readonly blockNumber: bigint
  /** Block hash containing the transaction */
  readonly blockHash: HashType
  /** Index of transaction in block */
  readonly transactionIndex: number
  /** Sender address */
  readonly from: AddressType
  /** Recipient address (null for contract creation) */
  readonly to: AddressType | null
  /** Total gas used in block up to this transaction */
  readonly cumulativeGasUsed: bigint
  /** Gas used by this transaction */
  readonly gasUsed: bigint
  /** Created contract address (null if not contract creation) */
  readonly contractAddress: AddressType | null
  /** Event logs emitted */
  readonly logs: readonly LogType[]
  /** Bloom filter for logs */
  readonly logsBloom: Uint8Array
  /** Execution status (0 = failed, 1 = success) */
  readonly status: 0 | 1
}

const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'AddressType' }
)

const HashTypeSchema = S.declare<HashType>(
  (u): u is HashType => u instanceof Uint8Array && u.length === 32,
  { identifier: 'HashType' }
)

const AddressSchema: S.Schema<AddressType, string> = S.transformOrFail(
  S.String,
  AddressTypeSchema,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(Address(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (a) => ParseResult.succeed(Address.toHex(a)),
  }
)

const NullableAddressSchema = S.NullOr(AddressSchema)

const LogTypeSchema = S.declare<LogType>(
  (u): u is LogType => {
    if (typeof u !== 'object' || u === null) return false
    const log = u as Record<string, unknown>
    return (
      'address' in log &&
      log.address instanceof Uint8Array &&
      'topics' in log &&
      Array.isArray(log.topics) &&
      'data' in log &&
      log.data instanceof Uint8Array &&
      'logIndex' in log &&
      typeof log.logIndex === 'number'
    )
  },
  { identifier: 'Log' }
)

export const ReceiptTypeSchema = S.declare<ReceiptType>(
  (u): u is ReceiptType => {
    if (typeof u !== 'object' || u === null) return false
    const receipt = u as Record<string, unknown>
    return (
      'transactionHash' in receipt &&
      receipt.transactionHash instanceof Uint8Array &&
      'blockNumber' in receipt &&
      typeof receipt.blockNumber === 'bigint' &&
      'blockHash' in receipt &&
      receipt.blockHash instanceof Uint8Array &&
      'status' in receipt &&
      (receipt.status === 0 || receipt.status === 1)
    )
  },
  { identifier: 'Receipt' }
)

const LogSchemaInternal = S.Struct({
  address: AddressSchema,
  topics: S.Array(HashTypeSchema),
  data: S.Uint8ArrayFromSelf,
  blockNumber: S.BigIntFromSelf,
  transactionHash: HashTypeSchema,
  transactionIndex: S.Number,
  blockHash: HashTypeSchema,
  logIndex: S.Number,
  removed: S.Boolean,
})

/**
 * Effect Schema for validating event logs.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { LogSchema } from 'voltaire-effect/primitives/Receipt'
 *
 * const log = S.decodeSync(LogSchema)({
 *   address: '0x...',
 *   topics: [topic0, topic1],
 *   data: new Uint8Array([]),
 *   blockNumber: 12345n,
 *   transactionHash: txHash,
 *   transactionIndex: 0,
 *   blockHash: blockHash,
 *   logIndex: 0,
 *   removed: false
 * })
 * ```
 *
 * @since 0.0.1
 */
export const LogSchema: S.Schema<LogType, S.Schema.Encoded<typeof LogSchemaInternal>> = S.transform(
  LogSchemaInternal,
  LogTypeSchema,
  { strict: true, decode: (d) => d as LogType, encode: (e) => e }
)

const ReceiptSchemaInternal = S.Struct({
  transactionHash: HashTypeSchema,
  blockNumber: S.BigIntFromSelf,
  blockHash: HashTypeSchema,
  transactionIndex: S.Number,
  from: AddressSchema,
  to: NullableAddressSchema,
  cumulativeGasUsed: S.BigIntFromSelf,
  gasUsed: S.BigIntFromSelf,
  contractAddress: NullableAddressSchema,
  logs: S.Array(LogSchema),
  logsBloom: S.Uint8ArrayFromSelf,
  status: S.Literal(0, 1),
})

/**
 * Effect Schema for validating transaction receipts.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { ReceiptSchema } from 'voltaire-effect/primitives/Receipt'
 *
 * const receipt = S.decodeSync(ReceiptSchema)({
 *   transactionHash: txHash,
 *   blockNumber: 12345n,
 *   blockHash: blockHash,
 *   transactionIndex: 0,
 *   from: '0x...',
 *   to: '0x...',
 *   cumulativeGasUsed: 21000n,
 *   gasUsed: 21000n,
 *   contractAddress: null,
 *   logs: [],
 *   logsBloom: new Uint8Array(256),
 *   status: 1
 * })
 * ```
 *
 * @since 0.0.1
 */
export const ReceiptSchema: S.Schema<ReceiptType, S.Schema.Encoded<typeof ReceiptSchemaInternal>> = S.transform(
  ReceiptSchemaInternal,
  ReceiptTypeSchema,
  { strict: true, decode: (d) => d as ReceiptType, encode: (e) => e }
)

/**
 * Default schema export for receipt validation.
 * @since 0.0.1
 */
export { ReceiptSchema as Schema }
