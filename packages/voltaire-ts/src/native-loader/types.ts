/**
 * TypeScript type definitions and typed errors for native FFI bindings.
 * Mirrors packages/voltaire-zig/src/primitives.h error codes and conventions.
 */

/**
 * Runtime error codes returned by Voltaire's C99 ABI (`primitives.h`).
 */
export enum NativeErrorCode {
	SUCCESS = 0,
	INVALID_HEX = -1,
	INVALID_LENGTH = -2,
	INVALID_CHECKSUM = -3,
	OUT_OF_MEMORY = -4,
	INVALID_INPUT = -5,
	INVALID_SIGNATURE = -6,
	INVALID_SELECTOR = -7,
	UNSUPPORTED_TYPE = -8,
	MAX_LENGTH_EXCEEDED = -9,
	ACCESS_LIST_INVALID = -10,
	AUTHORIZATION_INVALID = -11,
	KZG_NOT_LOADED = -20,
	KZG_INVALID_BLOB = -21,
	KZG_INVALID_PROOF = -22,
	UNKNOWN_ERROR = -99,
}

/**
 * Native runtime loader kind.
 */
export type NativeRuntimeKind = "bun-ffi" | "node-api";

/**
 * Convert native C ABI error code to a human-readable message.
 */
export function getNativeErrorMessage(code: number): string {
	switch (code) {
		case NativeErrorCode.SUCCESS:
			return "Success";
		case NativeErrorCode.INVALID_HEX:
			return "Invalid hexadecimal string";
		case NativeErrorCode.INVALID_LENGTH:
			return "Invalid length";
		case NativeErrorCode.INVALID_CHECKSUM:
			return "Invalid EIP-55 checksum";
		case NativeErrorCode.OUT_OF_MEMORY:
			return "Out of memory";
		case NativeErrorCode.INVALID_INPUT:
			return "Invalid input parameter";
		case NativeErrorCode.INVALID_SIGNATURE:
			return "Invalid signature";
		case NativeErrorCode.INVALID_SELECTOR:
			return "Invalid function selector";
		case NativeErrorCode.UNSUPPORTED_TYPE:
			return "Unsupported ABI type";
		case NativeErrorCode.MAX_LENGTH_EXCEEDED:
			return "Maximum length exceeded";
		case NativeErrorCode.ACCESS_LIST_INVALID:
			return "Invalid access list";
		case NativeErrorCode.AUTHORIZATION_INVALID:
			return "Invalid authorization";
		case NativeErrorCode.KZG_NOT_LOADED:
			return "KZG trusted setup not loaded";
		case NativeErrorCode.KZG_INVALID_BLOB:
			return "Invalid KZG blob";
		case NativeErrorCode.KZG_INVALID_PROOF:
			return "Invalid KZG proof";
		case NativeErrorCode.UNKNOWN_ERROR:
			return "Unknown native error";
		default:
			return `Native error code: ${code}`;
	}
}

/**
 * Error thrown when a native C ABI call returns a non-zero status code.
 */
export class NativeError extends Error {
	readonly _tag = "NativeError" as const;
	readonly code: number;
	readonly operation: string;

	constructor(operation: string, code: number, message?: string) {
		super(
			message ??
				`Native ${operation} failed (${code}): ${getNativeErrorMessage(code)}`,
		);
		this.name = "NativeError";
		this.code = code;
		this.operation = operation;
	}
}

/**
 * Error thrown when the current OS/architecture does not have native bindings.
 */
export class NativeUnsupportedPlatformError extends Error {
	readonly _tag = "NativeUnsupportedPlatformError" as const;
	readonly platform: string;
	readonly arch: string;

	constructor(platform: string, arch: string) {
		super(
			`Unsupported platform: ${platform}-${arch}. Supported platforms: darwin-arm64, darwin-x64, linux-arm64, linux-x64, win32-x64.`,
		);
		this.name = "NativeUnsupportedPlatformError";
		this.platform = platform;
		this.arch = arch;
	}
}

/**
 * Error thrown when native FFI is invoked in a runtime without Bun FFI or Node-API.
 */
export class NativeUnsupportedRuntimeError extends Error {
	readonly _tag = "NativeUnsupportedRuntimeError" as const;

	constructor(
		message = "Unsupported runtime. Native bindings require Bun (bun:ffi) or Node.js (Node-API).",
	) {
		super(message);
		this.name = "NativeUnsupportedRuntimeError";
	}
}

/**
 * Error thrown when no loadable Voltaire native library can be found.
 */
export class NativeLibraryNotFoundError extends Error {
	readonly _tag = "NativeLibraryNotFoundError" as const;
	readonly platform: string;
	readonly searchedPaths: readonly string[];

	constructor(
		platform: string,
		searchedPaths: readonly string[],
		cause?: Error,
	) {
		const pathList =
			searchedPaths.length > 0
				? searchedPaths.map((p) => `  - ${p}`).join("\n")
				: "  (none)";
		const causeSuffix = cause?.message
			? `\nLast loader error: ${cause.message}`
			: "";
		super(
			[
				`Voltaire native library not found for platform "${platform}".`,
				"Searched locations:",
				pathList,
				"To resolve this:",
				`  1. Install the prebuilt platform package: pnpm add @tevm/voltaire-${platform}`,
				"  2. Or build locally from source: zig build build-ts-native -Dwith-c-api=true",
				"  3. Or point VOLTAIRE_NATIVE_LIB to an explicit shared library path.",
			].join("\n") + causeSuffix,
			cause ? { cause } : undefined,
		);
		this.name = "NativeLibraryNotFoundError";
		this.platform = platform;
		this.searchedPaths = [...searchedPaths];
	}
}
