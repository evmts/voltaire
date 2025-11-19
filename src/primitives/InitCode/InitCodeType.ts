import type { brand } from "../../brand.js";

/**
 * Branded InitCode type
 * Contract creation bytecode (constructor + runtime code)
 * Deployed during contract creation transaction
 */
export type InitCodeType = Uint8Array & { readonly [brand]: "InitCode" };
