import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * UserOperation type - ERC-4337 v0.6 format
 *
 * User operations enable account abstraction by separating transaction validation
 * from execution. Bundlers aggregate user operations and submit them to the
 * EntryPoint contract for execution.
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see https://voltaire.tevm.sh/primitives/user-operation for UserOperation documentation
 * @since 0.0.0
 */
export type UserOperationType = {
    /** Smart account address initiating the operation */
    readonly sender: AddressType;
    /** Anti-replay nonce (key + sequence) */
    readonly nonce: Uint256Type;
    /** Account factory and initialization code for first-time deployment */
    readonly initCode: Uint8Array;
    /** Calldata to execute on the account */
    readonly callData: Uint8Array;
    /** Gas limit for the execution phase */
    readonly callGasLimit: Uint256Type;
    /** Gas limit for the verification phase */
    readonly verificationGasLimit: Uint256Type;
    /** Fixed gas overhead for bundler compensation */
    readonly preVerificationGas: Uint256Type;
    /** Maximum total fee per gas (EIP-1559) */
    readonly maxFeePerGas: Uint256Type;
    /** Maximum priority fee per gas (EIP-1559) */
    readonly maxPriorityFeePerGas: Uint256Type;
    /** Paymaster address and data (empty if self-paying) */
    readonly paymasterAndData: Uint8Array;
    /** Account signature over userOpHash */
    readonly signature: Uint8Array;
} & {
    readonly [brand]: "UserOperation";
};
//# sourceMappingURL=UserOperationType.d.ts.map