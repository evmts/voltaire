/**
 * EIP-2930 Access List Type Definitions
 *
 * This file only exports types for the AccessList module.
 * For runtime functionality, import from './AccessList.js'
 */

export type {
	BrandedAccessList,
	BrandedAccessList as Type,
	BrandedAccessList as AccessList,
	Item,
} from "./BrandedAccessList.js";

export type { AccessListConstructor } from "./AccessListConstructor.js";
