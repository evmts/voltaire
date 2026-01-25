/**
 * UserOperation Schema definitions for ERC-4337 account abstraction.
 * 
 * @module UserOperationSchema
 * @since 0.0.1
 */
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'
import { Address } from '@tevm/voltaire/Address'
import type { AddressType } from '@tevm/voltaire/Address'

/**
 * Type representing an ERC-4337 UserOperation.
 * @since 0.0.1
 */
export interface UserOperationType {
  readonly sender: AddressType
  readonly nonce: bigint
  readonly initCode: Uint8Array
  readonly callData: Uint8Array
  readonly callGasLimit: bigint
  readonly verificationGasLimit: bigint
  readonly preVerificationGas: bigint
  readonly maxFeePerGas: bigint
  readonly maxPriorityFeePerGas: bigint
  readonly paymasterAndData: Uint8Array
  readonly signature: Uint8Array
}

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

const UserOperationSchemaInternal = S.Struct({
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
})

const UserOperationTypeSchema = S.declare<UserOperationType>(
  (u): u is UserOperationType => 
    typeof u === 'object' && 
    u !== null && 
    'sender' in u && 
    'nonce' in u &&
    'callData' in u,
  { identifier: 'UserOperation' }
)

/**
 * Input type for UserOperation with string-encoded values.
 * @since 0.0.1
 */
export type UserOperationInput = {
  sender: string
  nonce: string
  initCode: string
  callData: string
  callGasLimit: string
  verificationGasLimit: string
  preVerificationGas: string
  maxFeePerGas: string
  maxPriorityFeePerGas: string
  paymasterAndData: string
  signature: string
}

/**
 * Effect Schema for validating and transforming ERC-4337 UserOperations.
 * 
 * @example
 * ```typescript
 * import * as Schema from 'effect/Schema'
 * import { UserOperationSchema } from './UserOperationSchema.js'
 * 
 * const userOp = Schema.decodeSync(UserOperationSchema)({
 *   sender: '0x...',
 *   nonce: '0',
 *   // ... other fields
 * })
 * ```
 * 
 * @since 0.0.1
 */
export const UserOperationSchema: S.Schema<UserOperationType, UserOperationInput> = S.transform(
  UserOperationSchemaInternal,
  UserOperationTypeSchema,
  { 
    strict: true, 
    decode: (d) => d as UserOperationType,
    encode: (e) => e
  }
)
