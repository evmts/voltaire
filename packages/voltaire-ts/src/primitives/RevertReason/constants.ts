/**
 * Standard error selectors
 */
export const ERROR_SELECTOR = "0x08c379a0"; // Error(string)
export const PANIC_SELECTOR = "0x4e487b71"; // Panic(uint256)

/**
 * Solidity 0.8+ panic codes
 */
export const PANIC_CODES = {
	0: "Generic panic",
	1: "Assertion failed",
	17: "Arithmetic overflow/underflow",
	18: "Division by zero",
	33: "Invalid enum value",
	34: "Invalid storage encoding",
	49: "Array pop on empty array",
	50: "Array out of bounds",
	65: "Out of memory",
	81: "Invalid internal function",
} as const;

export type PanicCode = keyof typeof PANIC_CODES;

/**
 * Get panic code description
 */
export function getPanicDescription(code: number): string {
	return (
		PANIC_CODES[code as PanicCode] ??
		`Unknown panic code: 0x${code.toString(16)}`
	);
}
