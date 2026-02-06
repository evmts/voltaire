import type { EIP1559, EIP2930, EIP4844, EIP7702 } from "./types.js";
/**
 * Validate chain ID is present
 * @param this Transaction
 * @throws {InvalidRangeError} If chainId is missing or invalid
 */
export declare function validateChainId(this: EIP2930 | EIP1559 | EIP4844 | EIP7702): void;
//# sourceMappingURL=validateChainId.d.ts.map