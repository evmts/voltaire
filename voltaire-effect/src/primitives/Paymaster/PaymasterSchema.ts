import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire'
import type { AddressType } from '@tevm/voltaire/Address'

export type PaymasterType = {
  readonly address: AddressType
  readonly data: Uint8Array
  readonly validUntil?: bigint
  readonly validAfter?: bigint
}

const PaymasterTypeSchema = S.declare<PaymasterType>(
  (u): u is PaymasterType =>
    u !== null &&
    typeof u === 'object' &&
    'address' in u &&
    'data' in u,
  { identifier: 'Paymaster' }
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

export type PaymasterInput = {
  readonly address: string
  readonly data: string
  readonly validUntil?: bigint | number | string
  readonly validAfter?: bigint | number | string
}

export const PaymasterSchema: S.Schema<PaymasterType, PaymasterInput> = S.transformOrFail(
  S.Struct({
    address: AddressSchema,
    data: HexStringToBytes,
    validUntil: S.optional(BigIntFromInput),
    validAfter: S.optional(BigIntFromInput),
  }),
  PaymasterTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        const result: PaymasterType = {
          address: input.address,
          data: input.data,
        }
        if (input.validUntil !== undefined) {
          (result as any).validUntil = input.validUntil
        }
        if (input.validAfter !== undefined) {
          (result as any).validAfter = input.validAfter
        }
        return ParseResult.succeed(result)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (state) => ParseResult.succeed({
      address: state.address,
      data: state.data,
      validUntil: state.validUntil,
      validAfter: state.validAfter,
    })
  }
).annotations({ identifier: 'PaymasterSchema' })
