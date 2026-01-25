/**
 * @module ContractSignature
 * @description Effect Schemas for ERC-1271 smart contract signature verification.
 *
 * ERC-1271 defines a standard for contract-based signature verification,
 * enabling smart contract wallets to authorize transactions.
 *
 * ## Schemas
 *
 * | Schema | Description |
 * |--------|-------------|
 * | `ContractSignature.Struct` | Verification input (hash, signature, signer, returnData) |
 *
 * ## Usage
 *
 * ```typescript
 * import * as ContractSignature from 'voltaire-effect/primitives/ContractSignature'
 * import * as S from 'effect/Schema'
 *
 * const input = S.decodeSync(ContractSignature.Struct)({
 *   hash: messageHash,
 *   signature: sigBytes,
 *   expectedSigner: contractAddress,
 *   returnData: callResult
 * })
 *
 * // Check if signature is valid
 * const valid = ContractSignature.checkReturnData(input.returnData)
 * ```
 *
 * ## Constants
 *
 * ```typescript
 * ContractSignature.ERC1271_MAGIC_VALUE  // 0x1626ba7e
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * ContractSignature.checkReturnData(returnData)  // boolean
 * ```
 *
 * @since 0.1.0
 */
export {
	checkReturnData,
	type ContractSignatureInput,
	ContractSignatureInputSchema,
	ERC1271_MAGIC_VALUE,
	Struct,
} from "./Struct.js";
