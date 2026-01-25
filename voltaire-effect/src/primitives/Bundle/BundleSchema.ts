import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'
import type { UserOperationType, UserOperationInput } from '../UserOperation/UserOperationSchema.js'

export type BundleType = {
  readonly userOperations: readonly UserOperationType[]
  readonly beneficiary: AddressType
  readonly entryPoint: AddressType
}

const BundleTypeSchema = S.declare<BundleType>(
  (u): u is BundleType =>
    u !== null &&
    typeof u === 'object' &&
    'userOperations' in u &&
    'beneficiary' in u &&
    'entryPoint' in u &&
    Array.isArray(u.userOperations),
  { identifier: 'Bundle' }
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

const BigIntFromString: S.Schema<bigint, string> = S.transformOrFail(
  S.String,
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
    encode: (n) => ParseResult.succeed(n.toString()),
  }
)

const UserOperationTypeSchema = S.declare<UserOperationType>(
  (u): u is UserOperationType => 
    typeof u === 'object' && 
    u !== null && 
    'sender' in u && 
    'nonce' in u &&
    'callData' in u,
  { identifier: 'UserOperation' }
)

const UserOperationSchemaLocal = S.transform(
  S.Struct({
    sender: AddressSchema,
    nonce: BigIntFromString,
    initCode: HexStringToBytes,
    callData: HexStringToBytes,
    callGasLimit: BigIntFromString,
    verificationGasLimit: BigIntFromString,
    preVerificationGas: BigIntFromString,
    maxFeePerGas: BigIntFromString,
    maxPriorityFeePerGas: BigIntFromString,
    paymasterAndData: HexStringToBytes,
    signature: HexStringToBytes,
  }),
  UserOperationTypeSchema,
  { 
    strict: true, 
    decode: (d) => d as UserOperationType,
    encode: (e) => e
  }
)

export type BundleInput = {
  readonly userOperations: readonly UserOperationInput[]
  readonly beneficiary: string
  readonly entryPoint: string
}

export const BundleSchema: S.Schema<BundleType, BundleInput> = S.transform(
  S.Struct({
    userOperations: S.Array(UserOperationSchemaLocal),
    beneficiary: AddressSchema,
    entryPoint: AddressSchema,
  }),
  BundleTypeSchema,
  {
    strict: true,
    decode: (d) => d as BundleType,
    encode: (e) => e,
  }
).annotations({ identifier: 'BundleSchema' })
