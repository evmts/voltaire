/**
 * Standard error selectors
 */
export const ERROR_SELECTOR = "0x08c379a0"; // Error(string)
export const PANIC_SELECTOR = "0x4e487b71"; // Panic(uint256)

/**
 * Solidity 0.8+ panic codes
 */
export const PANIC_CODES = {
	0x00: "Generic panic",
	0x01: "Assertion failed",
	0x11: "Arithmetic overflow/underflow",
	0x12: "Division by zero",
	0x21: "Invalid enum value",
	0x22: "Invalid storage encoding",
	0x31: "Array pop on empty array",
	0x32: "Array out of bounds",
	0x41: "Out of memory",
	0x51: "Invalid internal function",
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
