import type { BrandedAccessList } from "./AccessListType.js";
/**
 * Validate access list structure
 *
 * @param list - Access list to validate
 * @throws {InvalidFormatError} If invalid structure
 * @throws {InvalidLengthError} If invalid address or storage key length
 *
 * @example
 * ```typescript
 * try {
 *   AccessList.assertValid(list);
 *   console.log('Valid access list');
 * } catch (err) {
 *   console.error('Invalid:', err.message);
 * }
 * ```
 */
export declare function assertValid(list: BrandedAccessList): void;
//# sourceMappingURL=assertValid.d.ts.map