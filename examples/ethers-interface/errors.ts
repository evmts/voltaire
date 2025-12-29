/**
 * Custom error classes for ethers Interface abstraction
 */

/**
 * Base error for Interface-related errors
 */
export class InterfaceError extends Error {
	readonly code: string;

	constructor(message: string, code: string) {
		super(message);
		this.name = "InterfaceError";
		this.code = code;
	}
}

/**
 * Thrown when a fragment (function/event/error) is not found
 */
export class FragmentNotFoundError extends InterfaceError {
	readonly key: string;
	readonly fragmentType: "function" | "event" | "error";

	constructor(key: string, fragmentType: "function" | "event" | "error") {
		super(`${fragmentType} "${key}" not found in ABI`, "FRAGMENT_NOT_FOUND");
		this.name = "FragmentNotFoundError";
		this.key = key;
		this.fragmentType = fragmentType;
	}
}

/**
 * Thrown when multiple fragments match ambiguously
 */
export class AmbiguousFragmentError extends InterfaceError {
	readonly key: string;
	readonly matches: string[];

	constructor(key: string, matches: string[]) {
		super(
			`ambiguous fragment (matches ${matches.map((m) => JSON.stringify(m)).join(", ")})`,
			"AMBIGUOUS_FRAGMENT",
		);
		this.name = "AmbiguousFragmentError";
		this.key = key;
		this.matches = matches;
	}
}

/**
 * Thrown when data signature doesn't match expected fragment
 */
export class SignatureMismatchError extends InterfaceError {
	readonly expected: string;
	readonly actual: string;

	constructor(fragmentName: string, expected: string, actual: string) {
		super(
			`data signature does not match ${fragmentName}`,
			"SIGNATURE_MISMATCH",
		);
		this.name = "SignatureMismatchError";
		this.expected = expected;
		this.actual = actual;
	}
}

/**
 * Thrown when decoding fails due to invalid data
 */
export class DecodingError extends InterfaceError {
	readonly data: string;
	readonly reason: string;

	constructor(reason: string, data: string) {
		super(`could not decode: ${reason}`, "DECODING_ERROR");
		this.name = "DecodingError";
		this.data = data;
		this.reason = reason;
	}
}

/**
 * Thrown when encoding fails due to invalid values
 */
export class EncodingError extends InterfaceError {
	readonly reason: string;

	constructor(reason: string) {
		super(`could not encode: ${reason}`, "ENCODING_ERROR");
		this.name = "EncodingError";
		this.reason = reason;
	}
}

/**
 * Thrown when argument count doesn't match parameter count
 */
export class ArgumentCountError extends InterfaceError {
	readonly expected: number;
	readonly actual: number;

	constructor(expected: number, actual: number) {
		super(
			`expected ${expected} arguments, got ${actual}`,
			"ARGUMENT_COUNT_MISMATCH",
		);
		this.name = "ArgumentCountError";
		this.expected = expected;
		this.actual = actual;
	}
}

/**
 * Thrown for invalid fragment format/definition
 */
export class InvalidFragmentError extends InterfaceError {
	readonly fragment: unknown;

	constructor(message: string, fragment: unknown) {
		super(message, "INVALID_FRAGMENT");
		this.name = "InvalidFragmentError";
		this.fragment = fragment;
	}
}

/**
 * Panic codes from Solidity
 */
export const PanicReasons: Record<string, string> = {
	"0": "generic panic",
	"1": "assert(false)",
	"17": "arithmetic overflow",
	"18": "division or modulo by zero",
	"33": "enum overflow",
	"34": "invalid encoded storage byte array accessed",
	"49": "out-of-bounds array access; popping on an empty array",
	"50": "out-of-bounds access of an array or bytesN",
	"65": "out of memory",
	"81": "uninitialized function",
};

/**
 * Get human-readable panic reason
 */
export function getPanicReason(code: bigint): string {
	const codeStr = code.toString();
	return PanicReasons[codeStr] ?? "unknown panic code";
}
