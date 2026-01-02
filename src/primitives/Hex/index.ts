// Export factory function and all methods

export * from "./Hex.js";
export { default, Hex } from "./Hex.js";
// Export type definitions (Hex type conflicts with Hex function, rename to HexType)
export type { Bytes, Hex as HexBrand, HexType, Sized } from "./HexType.js";

// Export manipulation functions for namespace import pattern: import * as Hex from '@tevm/voltaire/Hex'
export {
	concat,
	slice,
	pad,
	padRight,
	trim,
	xor,
	clone,
	equals,
	size,
	isSized,
	assertSize,
	random,
	zero,
	validate,
	isHex,
	from,
	fromBigInt,
	fromBoolean,
	fromNumber,
	fromString,
	toBigInt,
	toBoolean,
	toNumber,
	// biome-ignore lint/suspicious/noShadowRestrictedNames: toString is intentional API name
	toString,
} from "./internal-index.js";
