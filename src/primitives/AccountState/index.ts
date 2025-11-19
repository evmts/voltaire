// Export factory functions and methods
export { from } from "./from.js";
export { createEmpty } from "./createEmpty.js";
export { isEOA } from "./isEOA.js";
export { isContract } from "./isContract.js";
export { equals } from "./equals.js";

// Export type definitions and constants
export type {
	AccountStateType,
	AccountStateLike,
} from "./AccountStateType.js";
export { EMPTY_CODE_HASH, EMPTY_TRIE_HASH } from "./AccountStateType.js";
