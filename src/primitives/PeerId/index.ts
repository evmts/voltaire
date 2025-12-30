// Export type definitions
export type { PeerIdType, EnodeComponents } from "./PeerIdType.js";

import { equals as _equals } from "./equals.js";
// Import all functions
import { from } from "./from.js";
import { parse as _parse } from "./parse.js";
import { toString as _toString } from "./toString.js";

// Export constructors
export { from };

// Export public wrapper functions
// biome-ignore lint/suspicious/noShadowRestrictedNames: intentional override for branded type conversion
export function toString(peerId: string): string {
	return _toString.call(from(peerId));
}

export function equals(peerId1: string, peerId2: string): boolean {
	return _equals.call(from(peerId1), from(peerId2));
}

export function parse(peerId: string) {
	return _parse.call(from(peerId));
}

// Export internal functions (tree-shakeable)
export { _toString, _equals, _parse };

// Export as namespace (convenience)
export const PeerId = {
	from,
	toString,
	equals,
	parse,
};
