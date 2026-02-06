import type { Proxy } from "@tevm/voltaire";
import * as S from "effect/Schema";

/**
 * Type representing a storage slot used by proxy contracts.
 * @since 0.0.1
 */
export type ProxySlotType = Proxy.ProxySlotType;

const ProxySlotTypeSchema = S.declare<ProxySlotType>(
	(u): u is ProxySlotType => u instanceof Uint8Array && u.length === 32,
	{ identifier: "ProxySlot" },
);

/**
 * Effect Schema for proxy storage slot validation.
 *
 * Validates 32-byte storage slots used in EIP-1967 and other proxy patterns.
 *
 * @since 0.0.1
 */
export const Schema = ProxySlotTypeSchema;

/**
 * Effect Schema for ERC-1167 minimal proxy detection results.
 *
 * @example
 * ```typescript
 * import * as S from 'effect/Schema'
 * import { Erc1167ResultSchema } from 'voltaire-effect/primitives/Proxy'
 *
 * const result = S.decodeSync(Erc1167ResultSchema)({
 *   isProxy: true,
 *   implementation: implementationAddress
 * })
 * ```
 *
 * @since 0.0.1
 */
export const Erc1167ResultSchema = S.Struct({
	isProxy: S.Boolean,
	implementation: S.optional(S.Uint8ArrayFromSelf),
}).annotations({ identifier: "Erc1167Result" });

/**
 * Result type for ERC-1167 minimal proxy detection.
 * @since 0.0.1
 */
export type Erc1167Result = S.Schema.Type<typeof Erc1167ResultSchema>;
