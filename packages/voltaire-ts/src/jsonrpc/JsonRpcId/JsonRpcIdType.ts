/**
 * JSON-RPC 2.0 request/response identifier
 * Can be string, number, or null per specification
 *
 * Note: The spec allows null but recommends string or number
 * for better correlation between requests and responses
 *
 * @see https://www.jsonrpc.org/specification#request_object
 */
export type JsonRpcIdType = string | number | null;
