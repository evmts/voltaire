/**
 * Standard error selectors
 */
export declare const ERROR_SELECTOR = "0x08c379a0";
export declare const PANIC_SELECTOR = "0x4e487b71";
/**
 * Solidity 0.8+ panic codes
 */
export declare const PANIC_CODES: {
    readonly 0: "Generic panic";
    readonly 1: "Assertion failed";
    readonly 17: "Arithmetic overflow/underflow";
    readonly 18: "Division by zero";
    readonly 33: "Invalid enum value";
    readonly 34: "Invalid storage encoding";
    readonly 49: "Array pop on empty array";
    readonly 50: "Array out of bounds";
    readonly 65: "Out of memory";
    readonly 81: "Invalid internal function";
};
export type PanicCode = keyof typeof PANIC_CODES;
/**
 * Get panic code description
 */
export declare function getPanicDescription(code: number): string;
//# sourceMappingURL=constants.d.ts.map