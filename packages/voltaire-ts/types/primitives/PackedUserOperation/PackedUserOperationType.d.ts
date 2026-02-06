import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * PackedUserOperation type - ERC-4337 v0.7+ format
 *
 * Optimized format that packs gas limits and fees into bytes32 fields,
 * reducing calldata size and gas costs for bundlers.
 *
 * Gas packing format:
 * - accountGasLimits: verificationGasLimit (128 bits) || callGasLimit (128 bits)
 * - gasFees: maxPriorityFeePerGas (128 bits) || maxFeePerGas (128 bits)
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see https://voltaire.tevm.sh/primitives/packed-user-operation for PackedUserOperation documentation
 * @since 0.0.0
 */
export type PackedUserOperationType = {
    /** Smart account address initiating the operation */
    readonly sender: AddressType;
    /** Anti-replay nonce (key + sequence) */
    readonly nonce: Uint256Type;
    /** Account factory and initialization code for first-time deployment */
    readonly initCode: Uint8Array;
    /** Calldata to execute on the account */
    readonly callData: Uint8Array;
    /** Packed gas limits: verificationGasLimit (128) || callGasLimit (128) */
    readonly accountGasLimits: Uint8Array;
    /** Fixed gas overhead for bundler compensation */
    readonly preVerificationGas: Uint256Type;
    /** Packed fees: maxPriorityFeePerGas (128) || maxFeePerGas (128) */
    readonly gasFees: Uint8Array;
    /** Paymaster address and data (empty if self-paying) */
    readonly paymasterAndData: Uint8Array;
    /** Account signature over userOpHash */
    readonly signature: Uint8Array;
} & {
    readonly [brand]: "PackedUserOperation";
};
//# sourceMappingURL=PackedUserOperationType.d.ts.map