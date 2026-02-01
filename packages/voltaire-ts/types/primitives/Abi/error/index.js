// Import crypto dependencies
import { keccak256String as keccak256StringImpl } from "../../Hash/index.js";
import { AbiError as AbiErrorImpl } from "./AbiError.js";
import { decodeParams } from "./decodeParams.js";
import { encodeParams } from "./encodeParams.js";
import { GetSelector } from "./getSelector.js";
import { getSignature } from "./getSignature.js";
// Export Error namespace for Abi.Error usage
export { Error } from "./Error.js";
// Export the AbiError class as default export
export const AbiError = AbiErrorImpl;
// Factory export (tree-shakeable)
export { GetSelector };
// Wrapper export (convenient, backward compat)
export const getSelector = GetSelector({
    keccak256String: keccak256StringImpl,
});
// Export individual functions
export { decodeParams, encodeParams, getSignature };
