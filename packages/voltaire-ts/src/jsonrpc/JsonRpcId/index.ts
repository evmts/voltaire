// Export type definition
export type { JsonRpcIdType } from "./JsonRpcIdType.js";

import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
// Import internal functions
import type { JsonRpcIdType } from "./JsonRpcIdType.js";
import { toString as _toString } from "./toString.js";

// Export constructors
export { from };

// Export public wrapper functions
export function equals(id1: JsonRpcIdType, id2: JsonRpcIdType): boolean {
	return _equals(from(id1))(from(id2));
}

// biome-ignore lint/suspicious/noShadowRestrictedNames: Intentional API design for namespace consistency
export function toString(id: JsonRpcIdType): string {
	return _toString(from(id));
}

// Export internal functions (tree-shakeable)
export { _equals, _toString };

// Export as namespace (convenience)
export const JsonRpcId = {
	from,
	equals,
	toString,
};
