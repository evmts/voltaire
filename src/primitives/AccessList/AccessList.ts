/**
 * AccessList Type Definitions
 *
 * Note: We don't export an 'AccessList' type alias here to avoid collision with the
 * AccessList factory function exported from AccessList.js. Use BrandedAccessList for the type.
 */

export type { AccessListConstructor } from "./AccessListConstructor.js";
// Re-export types
export type {
	BrandedAccessList,
	BrandedAccessList as Type,
	Item,
} from "./AccessListType.js";
