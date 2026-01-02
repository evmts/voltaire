import type { CallDataType } from "./CallDataType.js";
import * as BrandedCallData from "./internal-index.js";

// Re-export CallDataType and errors
export type { CallDataType } from "./CallDataType.js";
export * from "./constants.js";
export * from "./errors.js";

/**
 * Base CallData interface with instance methods
 */
export interface BaseCallData extends CallDataType {
	toHex(): string;
	toBytes(): Uint8Array;
	getSelector(): Uint8Array;
	hasSelector(selector: string | Uint8Array): boolean;
	equals(other: CallDataType): boolean;
}

/**
 * Creates CallData instances with prototype chain
 *
 * @see https://voltaire.tevm.sh/primitives/calldata for CallData documentation
 * @since 0.0.0
 * @param value - Value to convert (hex string or bytes)
 * @returns CallData instance with prototype methods
 * @throws {Error} If value format is invalid
 * @example
 * ```typescript
 * import { CallData } from './primitives/CallData/index.js';
 * const calldata = CallData('0xa9059cbb...');
 * console.log(calldata.toHex());
 * ```
 */
export function CallData(value: string | Uint8Array): BaseCallData {
	const result = BrandedCallData.from(value);
	Object.setPrototypeOf(result, CallData.prototype);
	return result as BaseCallData;
}

// Static factory methods
CallData.from = (value: string | Uint8Array): CallDataType => {
	const result = BrandedCallData.from(value);
	Object.setPrototypeOf(result, CallData.prototype);
	return result;
};

CallData.fromHex = (value: string): CallDataType => {
	const result = BrandedCallData.fromHex(value);
	Object.setPrototypeOf(result, CallData.prototype);
	return result;
};

CallData.fromBytes = (value: Uint8Array): CallDataType => {
	const result = BrandedCallData.fromBytes(value);
	Object.setPrototypeOf(result, CallData.prototype);
	return result;
};

CallData.encode = (signature: string, params: unknown[]): CallDataType => {
	const result = BrandedCallData.encode(signature, params);
	Object.setPrototypeOf(result, CallData.prototype);
	return result;
};

// Static utility methods
CallData.toHex = BrandedCallData.toHex;
CallData.toBytes = BrandedCallData.toBytes;
CallData.getSelector = BrandedCallData.getSelector;
CallData.hasSelector = BrandedCallData.hasSelector;
CallData.equals = BrandedCallData.equals;
CallData.is = BrandedCallData.is;
CallData.isValid = BrandedCallData.isValid;
CallData.decode = BrandedCallData.decode;

// Constants
CallData.MIN_SIZE = BrandedCallData.MIN_SIZE;
CallData.SELECTOR_SIZE = BrandedCallData.SELECTOR_SIZE;

// Set up CallData.prototype to inherit from Uint8Array.prototype
Object.setPrototypeOf(CallData.prototype, Uint8Array.prototype);

// Instance methods
CallData.prototype.toHex = function (): string {
	return BrandedCallData.toHex(this as CallDataType);
};

CallData.prototype.toBytes = function (): Uint8Array {
	return BrandedCallData.toBytes(this as CallDataType);
};

CallData.prototype.getSelector = function (): Uint8Array {
	return BrandedCallData.getSelector(this as CallDataType);
};

CallData.prototype.hasSelector = function (
	selector: string | Uint8Array,
): boolean {
	return BrandedCallData.hasSelector(this as CallDataType, selector);
};

CallData.prototype.equals = function (other: CallDataType): boolean {
	return BrandedCallData.equals(this as CallDataType, other);
};

// Export standalone helper functions
export const from = CallData.from;
export const fromHex = CallData.fromHex;
export const fromBytes = CallData.fromBytes;
export const toHex = BrandedCallData.toHex;
export const toBytes = BrandedCallData.toBytes;
export const getSelector = BrandedCallData.getSelector;
export const hasSelector = BrandedCallData.hasSelector;
export const equals = BrandedCallData.equals;
export const is = BrandedCallData.is;
export const isValid = BrandedCallData.isValid;
export const encode = CallData.encode;
export const decode = BrandedCallData.decode;

// Default export for dynamic imports
export default CallData;
