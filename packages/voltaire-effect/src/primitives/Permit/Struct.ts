import type { Permit } from "@tevm/voltaire";
import * as S from "effect/Schema";

/**
 * Type representing an ERC-2612 permit for gasless token approvals.
 * @since 0.1.0
 */
export type PermitType = Permit.PermitType;

/**
 * Type representing the EIP-712 domain for permit signatures.
 * @since 0.1.0
 */
export type PermitDomainType = Permit.PermitDomainType;

/**
 * Schema for ERC-2612 permit structs.
 *
 * @description
 * Validates the permit structure including owner, spender, value, nonce, and deadline.
 * Used for gasless token approvals via EIP-712 typed signatures.
 *
 * @example Decoding
 * ```typescript
 * import * as Permit from 'voltaire-effect/primitives/Permit'
 * import * as S from 'effect/Schema'
 *
 * const permit = S.decodeSync(Permit.Struct)({
 *   owner: ownerAddress,
 *   spender: spenderAddress,
 *   value: 1000000000000000000n,
 *   nonce: 0n,
 *   deadline: 1700000000n
 * })
 * ```
 *
 * @since 0.1.0
 */
export const Struct = S.Struct({
	owner: S.Uint8ArrayFromSelf,
	spender: S.Uint8ArrayFromSelf,
	value: S.BigIntFromSelf,
	nonce: S.BigIntFromSelf,
	deadline: S.BigIntFromSelf,
}).annotations({ identifier: "Permit.Struct" });

export { Struct as PermitTypeSchema };

/**
 * Schema for EIP-712 permit domain.
 *
 * @description
 * Validates the domain separator fields required for permit signatures.
 *
 * @example Decoding
 * ```typescript
 * import * as Permit from 'voltaire-effect/primitives/Permit'
 * import * as S from 'effect/Schema'
 *
 * const domain = S.decodeSync(Permit.DomainStruct)({
 *   name: 'USD Coin',
 *   version: '2',
 *   chainId: 1n,
 *   verifyingContract: usdcAddress
 * })
 * ```
 *
 * @since 0.1.0
 */
export const DomainStruct = S.Struct({
	name: S.String,
	version: S.String,
	chainId: S.BigIntFromSelf,
	verifyingContract: S.Uint8ArrayFromSelf,
}).annotations({ identifier: "Permit.DomainStruct" });

export { DomainStruct as PermitDomainTypeSchema };
