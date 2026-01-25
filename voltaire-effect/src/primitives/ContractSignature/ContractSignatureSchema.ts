import * as S from 'effect/Schema'
import { ContractSignature } from '@tevm/voltaire'

/**
 * ERC-1271 magic value returned by contracts for valid signatures.
 * Value: 0x1626ba7e
 * @since 0.0.1
 */
export const ERC1271_MAGIC_VALUE = ContractSignature.EIP1271_MAGIC_VALUE

/**
 * Input type for contract signature verification.
 * @since 0.0.1
 */
export type ContractSignatureInput = {
  hash: Uint8Array
  signature: Uint8Array
  expectedSigner: Uint8Array
  returnData: Uint8Array
}

/**
 * Effect Schema for validating contract signature verification inputs.
 *
 * @example
 * ```typescript
 * import * as ContractSignature from 'voltaire-effect/ContractSignature'
 * import * as Schema from 'effect/Schema'
 *
 * const input = Schema.decodeSync(ContractSignature.ContractSignatureInputSchema)({
 *   hash: messageHash,
 *   signature: sigBytes,
 *   expectedSigner: contractAddress,
 *   returnData: callResult
 * })
 * ```
 * @since 0.0.1
 */
export const ContractSignatureInputSchema = S.Struct({
  hash: S.Uint8ArrayFromSelf,
  signature: S.Uint8ArrayFromSelf,
  expectedSigner: S.Uint8ArrayFromSelf,
  returnData: S.Uint8ArrayFromSelf,
})
