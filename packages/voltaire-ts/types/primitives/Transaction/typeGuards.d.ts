import { type Any, type EIP1559, type EIP2930, type EIP4844, type EIP7702, type Legacy, Type } from "./types.js";
/**
 * Check if transaction is Legacy type
 */
export declare function isLegacy(tx: Any): tx is Legacy;
/**
 * Check if transaction is EIP-2930 type
 */
export declare function isEIP2930(tx: Any): tx is EIP2930;
/**
 * Check if transaction is EIP-1559 type
 */
export declare function isEIP1559(tx: Any): tx is EIP1559;
/**
 * Check if transaction is EIP-4844 type
 */
export declare function isEIP4844(tx: Any): tx is EIP4844;
/**
 * Check if transaction is EIP-7702 type
 */
export declare function isEIP7702(tx: Any): tx is EIP7702;
/**
 * Detect transaction type from serialized data
 *
 * @throws {InvalidFormatError} If transaction data is empty
 * @throws {InvalidTransactionTypeError} If transaction type byte is unknown
 */
export declare function detectType(data: Uint8Array): Type;
//# sourceMappingURL=typeGuards.d.ts.map