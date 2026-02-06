// Export type definition

// Export constants
export { ETH_66, ETH_67, ETH_68, SNAP_1 } from "./constants.js";
export type { ProtocolVersionType } from "./ProtocolVersionType.js";

import { compare as _compare } from "./compare.js";
import { equals as _equals } from "./equals.js";
// Import all functions
import { from } from "./from.js";
import { toString as _toString } from "./toString.js";

// Export constructors
export { from };

// Export public wrapper functions
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export function toString(protocolVersion: string): string {
	return _toString.call(from(protocolVersion));
}

export function equals(
	protocolVersion1: string,
	protocolVersion2: string,
): boolean {
	return _equals.call(from(protocolVersion1), from(protocolVersion2));
}

export function compare(
	protocolVersion1: string,
	protocolVersion2: string,
): number {
	return _compare.call(from(protocolVersion1), from(protocolVersion2));
}

// Export internal functions (tree-shakeable)
export { _toString, _equals, _compare };

// Export as namespace (convenience)
export const ProtocolVersion = {
	from,
	toString,
	equals,
	compare,
};
