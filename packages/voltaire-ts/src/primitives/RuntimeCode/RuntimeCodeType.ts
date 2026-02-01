import type { brand } from "../../brand.js";

/**
 * Branded RuntimeCode type
 * Pure runtime bytecode without constructor or metadata
 */
export type RuntimeCodeType = Uint8Array & { readonly [brand]: "RuntimeCode" };
