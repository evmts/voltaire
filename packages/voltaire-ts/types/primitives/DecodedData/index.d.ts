import type { DecodedDataType } from "./DecodedDataType.js";
import { from as _from } from "./from.js";
export type { DecodedDataType } from "./DecodedDataType.js";
/**
 * Create DecodedData from values and types
 */
export declare function from<T>(values: T, types: readonly string[]): DecodedDataType<T>;
/**
 * Internal exports for advanced usage
 */
export { _from };
//# sourceMappingURL=index.d.ts.map