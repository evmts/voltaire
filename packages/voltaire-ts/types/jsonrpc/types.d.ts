/**
 * JSON-RPC 2.0 types for Voltaire fork communication
 *
 * @see https://www.jsonrpc.org/specification
 */
export interface JsonRpcRequest {
    jsonrpc: "2.0";
    method: string;
    params?: unknown[];
    id: number | string | null;
}
export interface JsonRpcResponse {
    jsonrpc: "2.0";
    result?: unknown;
    error?: JsonRpcError;
    id: number | string | null;
}
export interface JsonRpcError {
    code: number;
    message: string;
    data?: unknown;
}
/**
 * JSON-RPC error codes
 * @see https://www.jsonrpc.org/specification#error_object
 */
export declare const JsonRpcErrorCode: {
    readonly PARSE_ERROR: -32700;
    readonly INVALID_REQUEST: -32600;
    readonly METHOD_NOT_FOUND: -32601;
    readonly INVALID_PARAMS: -32602;
    readonly INTERNAL_ERROR: -32603;
    readonly INVALID_INPUT: -32000;
    readonly RESOURCE_NOT_FOUND: -32001;
    readonly RESOURCE_UNAVAILABLE: -32002;
    readonly TRANSACTION_REJECTED: -32003;
    readonly METHOD_NOT_SUPPORTED: -32004;
    readonly LIMIT_EXCEEDED: -32005;
    readonly JSON_RPC_VERSION_NOT_SUPPORTED: -32006;
};
/**
 * Handler interface for RPC method dispatch
 */
export interface RpcHandler {
    handle(method: string, params: unknown[]): Promise<unknown>;
}
/**
 * RPC method types for type safety
 */
export type RpcMethod = "eth_getBalance" | "eth_getCode" | "eth_getStorageAt" | "eth_getTransactionCount" | "eth_blockNumber" | "eth_getBlockByNumber" | "eth_getBlockByHash";
/**
 * Method parameter types
 */
export type RpcParams = {
    eth_getBalance: [address: string, blockTag?: string];
    eth_getCode: [address: string, blockTag?: string];
    eth_getStorageAt: [address: string, slot: string, blockTag?: string];
    eth_getTransactionCount: [address: string, blockTag?: string];
    eth_blockNumber: [];
    eth_getBlockByNumber: [blockNumber: string, fullTx?: boolean];
    eth_getBlockByHash: [blockHash: string, fullTx?: boolean];
};
//# sourceMappingURL=types.d.ts.map