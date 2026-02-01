/**
 * Provider Types
 *
 * EIP-1193 compliant provider types for Ethereum JSON-RPC communication.
 *
 * @module provider/types
 */
/**
 * EIP-1193 error codes
 */
export var ProviderRpcErrorCode;
(function (ProviderRpcErrorCode) {
    /** User rejected request */
    ProviderRpcErrorCode[ProviderRpcErrorCode["UserRejectedRequest"] = 4001] = "UserRejectedRequest";
    /** Requested method/account not authorized */
    ProviderRpcErrorCode[ProviderRpcErrorCode["Unauthorized"] = 4100] = "Unauthorized";
    /** Provider doesn't support requested method */
    ProviderRpcErrorCode[ProviderRpcErrorCode["UnsupportedMethod"] = 4200] = "UnsupportedMethod";
    /** Provider disconnected from chains */
    ProviderRpcErrorCode[ProviderRpcErrorCode["Disconnected"] = 4900] = "Disconnected";
    /** Provider disconnected from all chains */
    ProviderRpcErrorCode[ProviderRpcErrorCode["ChainDisconnected"] = 4901] = "ChainDisconnected";
})(ProviderRpcErrorCode || (ProviderRpcErrorCode = {}));
