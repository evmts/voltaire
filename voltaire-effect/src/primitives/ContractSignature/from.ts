import { ContractSignature } from '@tevm/voltaire'
import * as Effect from 'effect/Effect'

/**
 * Error thrown when contract signature operations fail.
 * @since 0.0.1
 */
export class ContractSignatureError extends Error {
  readonly _tag = 'ContractSignatureError'
  constructor(message: string) {
    super(message)
    this.name = 'ContractSignatureError'
  }
}

/**
 * Check if return data from a contract call matches the EIP-1271 magic value.
 * This is a pure validation function - it doesn't make any RPC calls.
 *
 * @param _hash - Message hash (unused in pure validation, kept for API compatibility)
 * @param _signature - Signature bytes (unused in pure validation, kept for API compatibility)
 * @param _expectedSigner - Expected signer address (unused in pure validation, kept for API compatibility)
 * @param returnData - Return data from the isValidSignature contract call
 * @returns Effect yielding true if returnData matches the EIP-1271 magic value (0x1626ba7e)
 * @example
 * ```typescript
 * import * as ContractSignature from 'voltaire-effect/ContractSignature'
 * import { Effect } from 'effect'
 *
 * const isValid = Effect.runSync(
 *   ContractSignature.isValidSignature(hash, sig, signer, returnData)
 * )
 * ```
 * @since 0.0.1
 */
export const isValidSignature = (
  _hash: Uint8Array,
  _signature: Uint8Array,
  _expectedSigner: Uint8Array,
  returnData: Uint8Array
): Effect.Effect<boolean, never> =>
  Effect.succeed(isReturnDataValid(returnData))

function isReturnDataValid(returnData: Uint8Array): boolean {
  if (returnData.length < 4) return false
  // Magic value: 0x1626ba7e
  return returnData[0] === 0x16 && 
         returnData[1] === 0x26 && 
         returnData[2] === 0xba && 
         returnData[3] === 0x7e
}

/**
 * ERC-1271 magic value for valid signatures.
 * @since 0.0.1
 */
export const ERC1271_MAGIC_VALUE = ContractSignature.EIP1271_MAGIC_VALUE
