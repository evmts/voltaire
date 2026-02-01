import type { brand } from "../../brand.js";

/**
 * Branded License type - represents SPDX license identifier
 * Used in smart contract metadata for license identification
 *
 * Common values: "MIT", "Apache-2.0", "GPL-3.0", "BSD-3-Clause", "UNLICENSED"
 *
 * @example
 * ```typescript
 * const license: LicenseType = "MIT";
 * ```
 */
export type LicenseType = string & { readonly [brand]: "License" };
