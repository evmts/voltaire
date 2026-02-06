import type { brand } from "../../brand.js";

/**
 * EntryPoint address type - ERC-4337 entry point contract
 *
 * @see https://eips.ethereum.org/EIPS/eip-4337
 * @see https://voltaire.tevm.sh/primitives/entry-point for EntryPoint documentation
 * @since 0.0.0
 */
export type EntryPointType = Uint8Array & { readonly [brand]: "EntryPoint" };
