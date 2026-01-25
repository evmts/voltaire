import { AbstractError } from "@tevm/voltaire/errors";

export class JsonRpcParseError extends AbstractError {
	readonly _tag = "JsonRpcParseError" as const;
	readonly input: unknown;

	constructor(
		input: unknown,
		message?: string,
		options?: { cause?: Error; context?: Record<string, unknown> },
	) {
		super(message ?? "Failed to parse JSON-RPC message", options);
		this.name = "JsonRpcParseError";
		this.input = input;
	}
}

export class JsonRpcErrorResponse extends AbstractError {
	readonly _tag = "JsonRpcError" as const;
	readonly rpcCode: number;
	readonly data?: unknown;

	constructor(
		input: { code: number; message: string; data?: unknown },
		options?: { cause?: Error; context?: Record<string, unknown> },
	) {
		super(input.message, { ...options, code: input.code });
		this.name = "JsonRpcError";
		this.rpcCode = input.code;
		this.data = input.data;
	}
}
