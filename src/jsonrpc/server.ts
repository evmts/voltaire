/**
 * JSON-RPC 2.0 HTTP Server
 *
 * Provides HTTP interface for state-manager and blockchain operations
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { createServer } from "node:http";
import type {
	JsonRpcError,
	JsonRpcRequest,
	JsonRpcResponse,
	RpcHandler,
} from "./types.js";
import { JsonRpcErrorCode } from "./types.js";

export interface JsonRpcServerConfig {
	port?: number;
	host?: string;
	maxRequestSize?: number; // bytes
}

/**
 * Create JSON-RPC 2.0 HTTP server
 *
 * @param handler - RPC method handler
 * @param config - Server configuration
 * @returns HTTP server instance
 */
export function createJsonRpcServer(
	handler: RpcHandler,
	config: JsonRpcServerConfig = {},
) {
	const {
		port = 8545,
		host = "127.0.0.1",
		maxRequestSize = 1024 * 1024, // 1MB
	} = config;

	const server = createServer(async (req, res) => {
		// CORS headers
		res.setHeader("Access-Control-Allow-Origin", "*");
		res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
		res.setHeader("Access-Control-Allow-Headers", "Content-Type");

		// Handle OPTIONS (preflight)
		if (req.method === "OPTIONS") {
			res.writeHead(204).end();
			return;
		}

		// Only accept POST
		if (req.method !== "POST") {
			res.writeHead(405, { "Content-Type": "application/json" });
			res.end(
				JSON.stringify(
					createErrorResponse(null, {
						code: JsonRpcErrorCode.INVALID_REQUEST,
						message: "Method not allowed. Use POST.",
					}),
				),
			);
			return;
		}

		try {
			const body = await readBody(req, maxRequestSize);
			const response = await handleRequest(body, handler);

			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(response));
		} catch (error) {
			const errorResponse = createErrorResponse(null, {
				code: JsonRpcErrorCode.PARSE_ERROR,
				message: error instanceof Error ? error.message : "Parse error",
			});

			res.writeHead(200, { "Content-Type": "application/json" });
			res.end(JSON.stringify(errorResponse));
		}
	});

	server.listen(port, host);

	return {
		server,
		port,
		host,
		url: `http://${host}:${port}`,
		close: () =>
			new Promise<void>((resolve) => {
				server.close(() => resolve());
			}),
	};
}

/**
 * Read request body
 */
async function readBody(
	req: IncomingMessage,
	maxSize: number,
): Promise<string> {
	return new Promise((resolve, reject) => {
		let body = "";
		let size = 0;

		req.on("data", (chunk: Buffer) => {
			size += chunk.length;
			if (size > maxSize) {
				reject(new Error(`Request too large (max ${maxSize} bytes)`));
				req.destroy();
				return;
			}
			body += chunk.toString();
		});

		req.on("end", () => resolve(body));
		req.on("error", reject);
	});
}

/**
 * Handle JSON-RPC request
 */
async function handleRequest(
	body: string,
	handler: RpcHandler,
): Promise<JsonRpcResponse> {
	let request: JsonRpcRequest;

	// Parse request
	try {
		request = JSON.parse(body);
	} catch (error) {
		return createErrorResponse(null, {
			code: JsonRpcErrorCode.PARSE_ERROR,
			message: "Invalid JSON",
		});
	}

	// Validate request
	if (!isValidRequest(request)) {
		return createErrorResponse(request.id ?? null, {
			code: JsonRpcErrorCode.INVALID_REQUEST,
			message: "Invalid request format",
		});
	}

	// Handle method
	try {
		const result = await handler.handle(request.method, request.params ?? []);
		return createSuccessResponse(request.id, result);
	} catch (error) {
		return createErrorResponse(request.id, {
			code: JsonRpcErrorCode.INTERNAL_ERROR,
			message: error instanceof Error ? error.message : "Internal error",
			data: error instanceof Error ? { stack: error.stack } : undefined,
		});
	}
}

/**
 * Validate JSON-RPC request format
 */
function isValidRequest(request: unknown): request is JsonRpcRequest {
	if (typeof request !== "object" || request === null) return false;

	const req = request as JsonRpcRequest;

	// Check jsonrpc version
	if (req.jsonrpc !== "2.0") return false;

	// Check method
	if (typeof req.method !== "string") return false;

	// Check params (optional, must be array if present)
	if (req.params !== undefined && !Array.isArray(req.params)) return false;

	// Check id (optional, must be string/number/null if present)
	if (
		req.id !== undefined &&
		typeof req.id !== "string" &&
		typeof req.id !== "number" &&
		req.id !== null
	) {
		return false;
	}

	return true;
}

/**
 * Create success response
 */
function createSuccessResponse(
	id: number | string | null,
	result: unknown,
): JsonRpcResponse {
	return {
		jsonrpc: "2.0",
		result,
		id,
	};
}

/**
 * Create error response
 */
function createErrorResponse(
	id: number | string | null,
	error: JsonRpcError,
): JsonRpcResponse {
	return {
		jsonrpc: "2.0",
		error,
		id,
	};
}
