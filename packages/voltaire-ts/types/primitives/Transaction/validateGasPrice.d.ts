import type { EIP1559, EIP2930, EIP4844, EIP7702, Legacy } from "./types.js";
/**
 * Validate gas price is reasonable
 * @param this Transaction
 * @throws {InvalidRangeError} If gas price or fee values are invalid
 */
export declare function validateGasPrice(this: Legacy | EIP2930 | EIP1559 | EIP4844 | EIP7702): void;
//# sourceMappingURL=validateGasPrice.d.ts.map