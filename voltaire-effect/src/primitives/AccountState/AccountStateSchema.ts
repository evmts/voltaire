import { Uint } from '@tevm/voltaire'
import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import * as S from 'effect/Schema'
import * as ParseResult from 'effect/ParseResult'

export interface AccountStateType {
  readonly nonce: bigint
  readonly balance: bigint
  readonly codeHash: Bytes32Type
  readonly storageRoot: Bytes32Type
  readonly __tag: 'AccountState'
}

interface AccountStateInput {
  nonce: bigint | number | string
  balance: bigint | number | string
  codeHash: string | Uint8Array | bigint | number
  storageRoot: string | Uint8Array | bigint | number
}

const AccountStateTypeSchema = S.declare<AccountStateType>(
  (u): u is AccountStateType => {
    if (typeof u !== 'object' || u === null) return false
    const obj = u as Record<string, unknown>
    return (
      typeof obj.nonce === 'bigint' &&
      obj.nonce >= 0n &&
      typeof obj.balance === 'bigint' &&
      obj.balance >= 0n &&
      obj.codeHash instanceof Uint8Array &&
      obj.codeHash.length === 32 &&
      obj.storageRoot instanceof Uint8Array &&
      obj.storageRoot.length === 32
    )
  },
  { identifier: 'AccountState' }
)

const AccountStateInputSchema = S.Struct({
  nonce: S.Union(S.BigIntFromSelf, S.Number, S.String),
  balance: S.Union(S.BigIntFromSelf, S.Number, S.String),
  codeHash: S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number),
  storageRoot: S.Union(S.String, S.Uint8ArrayFromSelf, S.BigIntFromSelf, S.Number)
})

export const AccountStateSchema: S.Schema<AccountStateType, AccountStateInput> = S.transformOrFail(
  AccountStateInputSchema,
  AccountStateTypeSchema,
  {
    strict: true,
    decode: (input, _options, ast) => {
      try {
        const nonce = Uint.from(input.nonce)
        const balance = Uint.from(input.balance)
        const codeHash = Bytes32.Bytes32(input.codeHash as string | Uint8Array | bigint | number)
        const storageRoot = Bytes32.Bytes32(input.storageRoot as string | Uint8Array | bigint | number)
        return ParseResult.succeed({
          nonce,
          balance,
          codeHash,
          storageRoot,
          __tag: 'AccountState'
        } as AccountStateType)
      } catch (e) {
        return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message))
      }
    },
    encode: (state) => ParseResult.succeed({
      nonce: state.nonce,
      balance: state.balance,
      codeHash: state.codeHash,
      storageRoot: state.storageRoot
    })
  }
).annotations({ identifier: 'AccountStateSchema' })

export const EMPTY_CODE_HASH = Bytes32.Bytes32('0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470')
export const EMPTY_STORAGE_ROOT = Bytes32.Bytes32('0x56e81f171bcc55a6ff8345e692c0f86e5b48e01b996cadc001622fb5e363b421')
