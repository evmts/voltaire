import { ContractSignature } from "@tevm/voltaire";
import * as S from "effect/Schema";

/**
 * ERC-1271 magic value returned by contracts for valid signatures.
 * Value: 0x1626ba7e
 * @since 0.1.0
 */
export const ERC1271_MAGIC_VALUE = ContractSignature.EIP1271_MAGIC_VALUE;

/**
 * Input type for contract signature verification.
 * @since 0.1.0
 */
export type ContractSignatureInput = {
	hash: Uint8Array;
	signature: Uint8Array;
	expectedSigner: Uint8Array;
	returnData: Uint8Array;
};

/**
 * Schema for contract signature verification inputs.
 *
 * @description
 * Validates input for ERC-1271 contract signature verification.
 *
 * @example
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
 * ```
 *
 * @since 0.1.0
 */
export const Struct = S.Struct({
	hash: S.Uint8ArrayFromSelf,
	signature: S.Uint8ArrayFromSelf,
	expectedSigner: S.Uint8ArrayFromSelf,
	returnData: S.Uint8ArrayFromSelf,
}).annotations({ identifier: "ContractSignature.Struct" });

export { Struct as ContractSignatureInputSchema };

/**
 * Checks if return data matches ERC-1271 magic value.
 *
 * @param returnData - The return data from isValidSignature call
 * @returns true if the magic value matches
 * @since 0.1.0
 */
export const checkReturnData = (returnData: Uint8Array): boolean => {
	if (returnData.length < 4) return false;
	return (
		returnData[0] === 0x16 &&
		returnData[1] === 0x26 &&
		returnData[2] === 0xba &&
		returnData[3] === 0x7e
	);
};
