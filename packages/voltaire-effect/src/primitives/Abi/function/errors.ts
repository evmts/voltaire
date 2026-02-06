import {
	AbiDecodingError,
	AbiEncodingError,
	AbiInvalidSelectorError,
} from "@tevm/voltaire/Abi";

export class FunctionEncodingError extends AbiEncodingError {
	constructor(
		message: string,
		options?: {
			code?: string | number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "FUNCTION_ENCODING_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/abi/function",
			cause: options?.cause,
		});
		this.name = "FunctionEncodingError";
	}
}

export class FunctionDecodingError extends AbiDecodingError {
	constructor(
		message: string,
		options?: {
			code?: string | number;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "FUNCTION_DECODING_ERROR",
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/abi/function",
			cause: options?.cause,
		});
		this.name = "FunctionDecodingError";
	}
}

export class FunctionInvalidSelectorError extends AbiInvalidSelectorError {
	constructor(
		message: string,
		options: {
			code?: string | number;
			value: unknown;
			expected: string;
			context?: Record<string, unknown>;
			docsPath?: string;
			cause?: Error;
		},
	) {
		super(message, {
			code: options?.code ?? "FUNCTION_INVALID_SELECTOR",
			value: options.value,
			expected: options.expected,
			context: options?.context,
			docsPath: options?.docsPath || "/primitives/abi/function",
			cause: options?.cause,
		});
		this.name = "FunctionInvalidSelectorError";
	}
}
