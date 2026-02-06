/**
 * @fileoverview Converts Signature to RPC format.
 * @module Signature/toRpc
 * @since 0.0.1
 */
import { Signature, type SignatureType } from "@tevm/voltaire/Signature";

/**
 * RPC signature format with r, s, and optional yParity/v fields.
 */
export type RpcSignature = {
	r: string;
	s: string;
	yParity?: string;
	v?: string;
};

/**
 * Converts a Signature to Ethereum RPC format.
 *
 * @param signature - The SignatureType to convert
 * @returns RPC-formatted signature object with r, s, yParity, and v
 *
 * @example
 * ```typescript
 * import * as Signature from 'voltaire-effect/primitives/Signature'
 *
 * const rpc = Signature.toRpc(sig)
 * // { r: "0x...", s: "0x...", yParity: "0x0", v: "0x1b" }
 * ```
 *
 * @since 0.0.1
 */
export const toRpc = (signature: SignatureType): RpcSignature =>
	Signature.toRpc(signature);
