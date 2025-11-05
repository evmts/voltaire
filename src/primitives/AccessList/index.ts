// Export factory function
export { AccessList } from "./AccessList.js";

// Export all methods
export * from "./AccessList.js";

// Export type definitions
export type * from "./AccessList.ts";

// Export separate Type and Item for non-namespace usage
export type {
	BrandedAccessList as AccessListType,
	Item as AccessListItem,
} from "./BrandedAccessList.js";
