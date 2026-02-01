import { Type } from "./types.js";
/**
 * Detect transaction type from serialized data
 *
 * @throws {InvalidFormatError} If transaction data is empty
 * @throws {InvalidTransactionTypeError} If transaction type byte is unknown
 */
export declare function detectType(data: Uint8Array): Type;
//# sourceMappingURL=detectType.d.ts.map