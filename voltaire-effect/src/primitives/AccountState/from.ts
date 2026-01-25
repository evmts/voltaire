import { Uint } from '@tevm/voltaire'
import { Bytes32, type Bytes32Type } from '@tevm/voltaire/Bytes'
import type { AccountStateType } from './AccountStateSchema.js'
import { EMPTY_CODE_HASH, EMPTY_STORAGE_ROOT } from './AccountStateSchema.js'
import * as Effect from 'effect/Effect'

export interface AccountStateInput {
  nonce: bigint | number | string
  balance: bigint | number | string
  codeHash?: string | Uint8Array | bigint | number
  storageRoot?: string | Uint8Array | bigint | number
}

export const from = (input: AccountStateInput): Effect.Effect<AccountStateType, Error> =>
  Effect.try({
    try: () => {
      const nonce = Uint.from(input.nonce)
      const balance = Uint.from(input.balance)
      const codeHash = input.codeHash
        ? Bytes32.Bytes32(input.codeHash as string | Uint8Array | bigint | number)
        : EMPTY_CODE_HASH
      const storageRoot = input.storageRoot
        ? Bytes32.Bytes32(input.storageRoot as string | Uint8Array | bigint | number)
        : EMPTY_STORAGE_ROOT
      return {
        nonce,
        balance,
        codeHash,
        storageRoot,
        __tag: 'AccountState'
      } as AccountStateType
    },
    catch: (e) => e as Error
  })

export const empty = (): AccountStateType => ({
  nonce: 0n,
  balance: 0n,
  codeHash: EMPTY_CODE_HASH,
  storageRoot: EMPTY_STORAGE_ROOT,
  __tag: 'AccountState'
} as AccountStateType)

export const isContract = (state: AccountStateType): boolean =>
  !isEmptyCodeHash(state.codeHash)

export const isEmpty = (state: AccountStateType): boolean =>
  state.nonce === 0n &&
  state.balance === 0n &&
  isEmptyCodeHash(state.codeHash)

const isEmptyCodeHash = (codeHash: Bytes32Type): boolean => {
  for (let i = 0; i < 32; i++) {
    if (codeHash[i] !== EMPTY_CODE_HASH[i]) return false
  }
  return true
}
