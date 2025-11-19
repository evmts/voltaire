// Export type definition
export type { LicenseType } from "./LicenseType.js";

// Export constants
export {
	COMMON_LICENSES,
	OSI_APPROVED_LICENSES,
} from "./constants.js";

// Import all functions
import { COMMON_LICENSES, OSI_APPROVED_LICENSES } from "./constants.js";
import { from } from "./from.js";
import { isOSI as _isOSI } from "./isOSI.js";
import { toString as _toString } from "./toString.js";

// Export constructors
export { from };

// Export public wrapper functions
export function isOSI(license: string): boolean {
	return _isOSI(from(license));
}

export function toString(license: string): string {
	return _toString(from(license));
}

// Export internal functions (tree-shakeable)
export { _isOSI, _toString };

// Export as namespace (convenience)
export const License = {
	from,
	isOSI,
	toString,
	COMMON_LICENSES,
	OSI_APPROVED_LICENSES,
};
