import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'

export type RelayDataType = {
  readonly maxFeePerGas: bigint
  readonly maxPriorityFeePerGas: bigint
  readonly transactionCalldataGasUsed: bigint
  readonly relayWorker: AddressType
  readonly paymaster: AddressType
  readonly paymasterData: Uint8Array
  readonly clientId: bigint
}

const RelayDataTypeSchema = S.declare<RelayDataType>(
  (u): u is RelayDataType =>
    u !== null &&
    typeof u === 'object' &&
    'maxFeePerGas' in u &&
    'relayWorker' in u &&
    'paymaster' in u,
  { identifier: 'RelayData' }
)

const AddressTypeSchema = S.declare<AddressType>(
  (u): u is AddressType => u instanceof Uint8Array && u.length === 20,
  { identifier: 'AddressType' }
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

const HexStringToBytes: S.Schema<Uint8Array, string> = S.transformOrFail(
  S.String,
  S.Uint8ArrayFromSelf,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        const hex = s.startsWith('0x') ? s.slice(2) : s
        if (hex.length === 0) return ParseResult.succeed(new Uint8Array(0))
        if (hex.length % 2 !== 0) {
          return ParseResult.fail(new ParseResult.Type(ast, s, 'Invalid hex string length'))
        }
        const bytes = new Uint8Array(hex.length / 2)
        for (let i = 0; i < bytes.length; i++) {
          bytes[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16)
        }
        return ParseResult.succeed(bytes)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (bytes) => {
      const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
      return ParseResult.succeed('0x' + hex)
    },
  }
)

const BigIntFromInput: S.Schema<bigint, bigint | number | string> = S.transformOrFail(
  S.Union(S.BigIntFromSelf, S.Number, S.String),
  S.BigIntFromSelf,
  {
    strict: true,
    decode: (s, _options, ast) => {
      try {
        return ParseResult.succeed(BigInt(s))
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message))
      }
    },
    encode: (n) => ParseResult.succeed(n),
  }
)

export type RelayDataInput = {
  readonly maxFeePerGas: bigint | number | string
  readonly maxPriorityFeePerGas: bigint | number | string
  readonly transactionCalldataGasUsed: bigint | number | string
  readonly relayWorker: string
  readonly paymaster: string
  readonly paymasterData: string
  readonly clientId: bigint | number | string
}

export const RelayDataSchema: S.Schema<RelayDataType, RelayDataInput> = S.transform(
  S.Struct({
    maxFeePerGas: BigIntFromInput,
    maxPriorityFeePerGas: BigIntFromInput,
    transactionCalldataGasUsed: BigIntFromInput,
    relayWorker: AddressSchema,
    paymaster: AddressSchema,
    paymasterData: HexStringToBytes,
    clientId: BigIntFromInput,
  }),
  RelayDataTypeSchema,
  {
    strict: true,
    decode: (d) => d as RelayDataType,
    encode: (e) => e,
  }
).annotations({ identifier: 'RelayDataSchema' })
