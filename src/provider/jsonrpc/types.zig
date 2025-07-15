const std = @import("std");
const testing = std.testing;
const Allocator = std.mem.Allocator;

// =============================================================================
// Core JSON Types
// =============================================================================

/// Enhanced JSON Value type that can handle all JSON-RPC data types
pub const JsonValue = union(enum) {
    null: void,
    bool: bool,
    number: f64,
    string: []const u8,
    array: []JsonValue,
    object: std.StringHashMap(JsonValue),

    pub fn fromString(str: []const u8) JsonValue {
        return JsonValue{ .string = str };
    }

    pub fn fromU64(value: u64) JsonValue {
        return JsonValue{ .number = @floatFromInt(value) };
    }

    pub fn fromBool(value: bool) JsonValue {
        return JsonValue{ .bool = value };
    }

    pub fn fromArray(arr: []JsonValue) JsonValue {
        return JsonValue{ .array = arr };
    }

    pub fn fromObject(obj: std.StringHashMap(JsonValue)) JsonValue {
        return JsonValue{ .object = obj };
    }

    pub fn toString(self: JsonValue) ![]const u8 {
        return switch (self) {
            .string => |s| s,
            .bool => |b| if (b) "true" else "false",
            .null => "null",
            .number => "0", // Simplified for now
            .array => "[]", // Simplified for now
            .object => "{}", // Simplified for now
        };
    }

    pub fn toU64(self: JsonValue) !u64 {
        return switch (self) {
            .string => |s| {
                if (s.len >= 2 and s[0] == '0' and (s[1] == 'x' or s[1] == 'X')) {
                    return try std.fmt.parseInt(u64, s[2..], 16);
                } else {
                    return try std.fmt.parseInt(u64, s, 10);
                }
            },
            .number => |n| @intFromFloat(n),
            else => error.InvalidConversion,
        };
    }

    pub fn toBool(self: JsonValue) !bool {
        return switch (self) {
            .bool => |b| b,
            .string => |s| std.mem.eql(u8, s, "true"),
            .number => |n| n != 0,
            else => error.InvalidConversion,
        };
    }

    pub fn toArray(self: JsonValue) ![]JsonValue {
        return switch (self) {
            .array => |arr| arr,
            else => error.InvalidConversion,
        };
    }

    pub fn toObject(self: JsonValue) !std.StringHashMap(JsonValue) {
        return switch (self) {
            .object => |obj| obj,
            else => error.InvalidConversion,
        };
    }
};

// =============================================================================
// JSON-RPC Error Types
// =============================================================================

pub const JsonRpcError = struct {
    code: i32,
    message: []const u8,
    data: ?JsonValue = null,

    // Standard JSON-RPC errors
    pub const PARSE_ERROR = -32700;
    pub const INVALID_REQUEST = -32600;
    pub const METHOD_NOT_FOUND = -32601;
    pub const INVALID_PARAMS = -32602;
    pub const INTERNAL_ERROR = -32603;

    // Ethereum-specific errors
    pub const EXECUTION_REVERTED = -32000;
    pub const INSUFFICIENT_FUNDS = -32001;
    pub const NONCE_TOO_HIGH = -32002;
    pub const NONCE_TOO_LOW = -32003;
    pub const TRANSACTION_UNDERPRICED = -32004;
    pub const TRANSACTION_REPLACEMENT_UNDERPRICED = -32005;
    pub const UNAUTHORIZED = -32006;
    pub const UNSUPPORTED_OPERATION = -32007;
    pub const RESOURCE_UNAVAILABLE = -32008;
    pub const RESOURCE_NOT_FOUND = -32009;
    pub const INVALID_INPUT = -32010;
    pub const TRANSACTION_REJECTED = -32011;
    pub const METHOD_NOT_SUPPORTED = -32012;
    pub const LIMIT_EXCEEDED = -32013;
    pub const JSON_RPC_VERSION_NOT_SUPPORTED = -32014;

    pub fn init(code: i32, message: []const u8) JsonRpcError {
        return JsonRpcError{
            .code = code,
            .message = message,
        };
    }

    pub fn initWithData(code: i32, message: []const u8, data: JsonValue) JsonRpcError {
        return JsonRpcError{
            .code = code,
            .message = message,
            .data = data,
        };
    }
};

// =============================================================================
// Basic JSON-RPC Request/Response
// =============================================================================

pub const JsonRpcRequest = struct {
    jsonrpc: []const u8 = "2.0",
    method: []const u8,
    params: JsonValue,
    id: u64,

    pub fn init(method: []const u8, params: JsonValue) JsonRpcRequest {
        return JsonRpcRequest{
            .method = method,
            .params = params,
            .id = generateId(),
        };
    }
};

pub const JsonRpcResponse = struct {
    jsonrpc: []const u8 = "2.0",
    result: ?JsonValue,
    err: ?JsonRpcError,
    id: u64,

    pub fn isError(self: JsonRpcResponse) bool {
        return self.err != null;
    }

    pub fn getResult(self: JsonRpcResponse, comptime T: type) !T {
        if (self.err) |_| return error.JsonRpcError;
        const result = self.result orelse return error.NoResult;

        return switch (T) {
            []const u8 => try result.toString(),
            u64 => try result.toU64(),
            bool => try result.toBool(),
            []JsonValue => try result.toArray(),
            std.StringHashMap(JsonValue) => try result.toObject(),
            else => @compileError("Unsupported type for getResult"),
        };
    }
};

// =============================================================================
// Common Ethereum Types
// =============================================================================

pub const Address = []const u8; // 20-byte hex string with 0x prefix
pub const Hash = []const u8; // 32-byte hex string with 0x prefix
pub const Hex = []const u8; // Variable-length hex string with 0x prefix
pub const U64Hex = []const u8; // u64 as hex string
pub const U256Hex = []const u8; // u256 as hex string

// Block identifiers
pub const BlockTag = enum {
    latest,
    earliest,
    pending,
    finalized,
    safe,

    pub fn toString(self: BlockTag) []const u8 {
        return switch (self) {
            .latest => "latest",
            .earliest => "earliest",
            .pending => "pending",
            .finalized => "finalized",
            .safe => "safe",
        };
    }
};

pub const BlockNumber = union(enum) {
    number: u64,
    tag: BlockTag,

    pub fn toJsonValue(self: BlockNumber) JsonValue {
        return switch (self) {
            .number => |n| JsonValue.fromU64(n),
            .tag => |t| JsonValue.fromString(t.toString()),
        };
    }
};

// =============================================================================
// JSON-RPC Method Types (Similar to viem's approach)
// =============================================================================

/// Comprehensive JSON-RPC Method Union Type
/// This is the core type that encompasses all JSON-RPC methods similar to viem
pub const JsonRpcMethod = enum {
    // ETH Methods
    eth_accounts,
    eth_blockNumber,
    eth_call,
    eth_chainId,
    eth_coinbase,
    eth_estimateGas,
    eth_feeHistory,
    eth_gasPrice,
    eth_getBalance,
    eth_getBlockByHash,
    eth_getBlockByNumber,
    eth_getBlockTransactionCountByHash,
    eth_getBlockTransactionCountByNumber,
    eth_getCode,
    eth_getFilterChanges,
    eth_getFilterLogs,
    eth_getLogs,
    eth_getStorageAt,
    eth_getTransactionByHash,
    eth_getTransactionByBlockHashAndIndex,
    eth_getTransactionByBlockNumberAndIndex,
    eth_getTransactionCount,
    eth_getTransactionReceipt,
    eth_getUncleByBlockHashAndIndex,
    eth_getUncleByBlockNumberAndIndex,
    eth_getUncleCountByBlockHash,
    eth_getUncleCountByBlockNumber,
    eth_maxPriorityFeePerGas,
    eth_mining,
    eth_newBlockFilter,
    eth_newFilter,
    eth_newPendingTransactionFilter,
    eth_protocolVersion,
    eth_sendRawTransaction,
    eth_sendTransaction,
    eth_sign,
    eth_signTransaction,
    eth_signTypedData_v4,
    eth_syncing,
    eth_uninstallFilter,

    // NET Methods
    net_listening,
    net_peerCount,
    net_version,

    // WEB3 Methods
    web3_clientVersion,
    web3_sha3,

    // DEBUG Methods (optional)
    debug_traceTransaction,
    debug_traceCall,
    debug_traceBlockByNumber,
    debug_traceBlockByHash,

    // ADMIN Methods (optional)
    admin_nodeInfo,
    admin_peers,
    admin_addPeer,
    admin_removePeer,

    // TXPOOL Methods (optional)
    txpool_status,
    txpool_inspect,
    txpool_content,

    // Personal Methods (optional)
    personal_listAccounts,
    personal_newAccount,
    personal_unlockAccount,
    personal_lockAccount,
    personal_sendTransaction,
    personal_sign,

    pub fn getMethodName(self: JsonRpcMethod) []const u8 {
        return switch (self) {
            .eth_accounts => "eth_accounts",
            .eth_blockNumber => "eth_blockNumber",
            .eth_call => "eth_call",
            .eth_chainId => "eth_chainId",
            .eth_coinbase => "eth_coinbase",
            .eth_estimateGas => "eth_estimateGas",
            .eth_feeHistory => "eth_feeHistory",
            .eth_gasPrice => "eth_gasPrice",
            .eth_getBalance => "eth_getBalance",
            .eth_getBlockByHash => "eth_getBlockByHash",
            .eth_getBlockByNumber => "eth_getBlockByNumber",
            .eth_getBlockTransactionCountByHash => "eth_getBlockTransactionCountByHash",
            .eth_getBlockTransactionCountByNumber => "eth_getBlockTransactionCountByNumber",
            .eth_getCode => "eth_getCode",
            .eth_getFilterChanges => "eth_getFilterChanges",
            .eth_getFilterLogs => "eth_getFilterLogs",
            .eth_getLogs => "eth_getLogs",
            .eth_getStorageAt => "eth_getStorageAt",
            .eth_getTransactionByHash => "eth_getTransactionByHash",
            .eth_getTransactionByBlockHashAndIndex => "eth_getTransactionByBlockHashAndIndex",
            .eth_getTransactionByBlockNumberAndIndex => "eth_getTransactionByBlockNumberAndIndex",
            .eth_getTransactionCount => "eth_getTransactionCount",
            .eth_getTransactionReceipt => "eth_getTransactionReceipt",
            .eth_getUncleByBlockHashAndIndex => "eth_getUncleByBlockHashAndIndex",
            .eth_getUncleByBlockNumberAndIndex => "eth_getUncleByBlockNumberAndIndex",
            .eth_getUncleCountByBlockHash => "eth_getUncleCountByBlockHash",
            .eth_getUncleCountByBlockNumber => "eth_getUncleCountByBlockNumber",
            .eth_maxPriorityFeePerGas => "eth_maxPriorityFeePerGas",
            .eth_mining => "eth_mining",
            .eth_newBlockFilter => "eth_newBlockFilter",
            .eth_newFilter => "eth_newFilter",
            .eth_newPendingTransactionFilter => "eth_newPendingTransactionFilter",
            .eth_protocolVersion => "eth_protocolVersion",
            .eth_sendRawTransaction => "eth_sendRawTransaction",
            .eth_sendTransaction => "eth_sendTransaction",
            .eth_sign => "eth_sign",
            .eth_signTransaction => "eth_signTransaction",
            .eth_signTypedData_v4 => "eth_signTypedData_v4",
            .eth_syncing => "eth_syncing",
            .eth_uninstallFilter => "eth_uninstallFilter",
            .net_listening => "net_listening",
            .net_peerCount => "net_peerCount",
            .net_version => "net_version",
            .web3_clientVersion => "web3_clientVersion",
            .web3_sha3 => "web3_sha3",
            .debug_traceTransaction => "debug_traceTransaction",
            .debug_traceCall => "debug_traceCall",
            .debug_traceBlockByNumber => "debug_traceBlockByNumber",
            .debug_traceBlockByHash => "debug_traceBlockByHash",
            .admin_nodeInfo => "admin_nodeInfo",
            .admin_peers => "admin_peers",
            .admin_addPeer => "admin_addPeer",
            .admin_removePeer => "admin_removePeer",
            .txpool_status => "txpool_status",
            .txpool_inspect => "txpool_inspect",
            .txpool_content => "txpool_content",
            .personal_listAccounts => "personal_listAccounts",
            .personal_newAccount => "personal_newAccount",
            .personal_unlockAccount => "personal_unlockAccount",
            .personal_lockAccount => "personal_lockAccount",
            .personal_sendTransaction => "personal_sendTransaction",
            .personal_sign => "personal_sign",
        };
    }
};

// =============================================================================
// ETH Method Parameter Types
// =============================================================================

pub const EthAccounts = struct {
    pub const Params = struct {};
    pub const Response = []Address;
};

pub const EthBlockNumber = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthCall = struct {
    pub const Params = struct {
        transaction: TransactionObject,
        block: BlockNumber,
    };
    pub const Response = Hex;
};

pub const EthChainId = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthCoinbase = struct {
    pub const Params = struct {};
    pub const Response = Address;
};

pub const EthEstimateGas = struct {
    pub const Params = struct {
        transaction: TransactionObject,
        block: ?BlockNumber = null,
    };
    pub const Response = U64Hex;
};

pub const EthFeeHistory = struct {
    pub const Params = struct {
        blockCount: U64Hex,
        newestBlock: BlockNumber,
        rewardPercentiles: ?[]f64 = null,
    };
    pub const Response = FeeHistoryResponse;
};

pub const EthGasPrice = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthGetBalance = struct {
    pub const Params = struct {
        address: Address,
        block: BlockNumber,
    };
    pub const Response = U256Hex;
};

pub const EthGetBlockByHash = struct {
    pub const Params = struct {
        blockHash: Hash,
        fullTransactions: bool,
    };
    pub const Response = ?BlockResponse;
};

pub const EthGetBlockByNumber = struct {
    pub const Params = struct {
        block: BlockNumber,
        fullTransactions: bool,
    };
    pub const Response = ?BlockResponse;
};

pub const EthGetBlockTransactionCountByHash = struct {
    pub const Params = struct {
        blockHash: Hash,
    };
    pub const Response = ?U64Hex;
};

pub const EthGetBlockTransactionCountByNumber = struct {
    pub const Params = struct {
        block: BlockNumber,
    };
    pub const Response = ?U64Hex;
};

pub const EthGetCode = struct {
    pub const Params = struct {
        address: Address,
        block: BlockNumber,
    };
    pub const Response = Hex;
};

pub const EthGetFilterChanges = struct {
    pub const Params = struct {
        filterId: U64Hex,
    };
    pub const Response = []LogResponse;
};

pub const EthGetFilterLogs = struct {
    pub const Params = struct {
        filterId: U64Hex,
    };
    pub const Response = []LogResponse;
};

pub const EthGetLogs = struct {
    pub const Params = struct {
        filter: LogFilter,
    };
    pub const Response = []LogResponse;
};

pub const EthGetStorageAt = struct {
    pub const Params = struct {
        address: Address,
        position: U256Hex,
        block: BlockNumber,
    };
    pub const Response = Hash;
};

pub const EthGetTransactionByHash = struct {
    pub const Params = struct {
        transactionHash: Hash,
    };
    pub const Response = ?TransactionResponse;
};

pub const EthGetTransactionByBlockHashAndIndex = struct {
    pub const Params = struct {
        blockHash: Hash,
        index: U64Hex,
    };
    pub const Response = ?TransactionResponse;
};

pub const EthGetTransactionByBlockNumberAndIndex = struct {
    pub const Params = struct {
        block: BlockNumber,
        index: U64Hex,
    };
    pub const Response = ?TransactionResponse;
};

pub const EthGetTransactionCount = struct {
    pub const Params = struct {
        address: Address,
        block: BlockNumber,
    };
    pub const Response = U64Hex;
};

pub const EthGetTransactionReceipt = struct {
    pub const Params = struct {
        transactionHash: Hash,
    };
    pub const Response = ?TransactionReceiptResponse;
};

pub const EthGetUncleByBlockHashAndIndex = struct {
    pub const Params = struct {
        blockHash: Hash,
        index: U64Hex,
    };
    pub const Response = ?BlockResponse;
};

pub const EthGetUncleByBlockNumberAndIndex = struct {
    pub const Params = struct {
        block: BlockNumber,
        index: U64Hex,
    };
    pub const Response = ?BlockResponse;
};

pub const EthGetUncleCountByBlockHash = struct {
    pub const Params = struct {
        blockHash: Hash,
    };
    pub const Response = ?U64Hex;
};

pub const EthGetUncleCountByBlockNumber = struct {
    pub const Params = struct {
        block: BlockNumber,
    };
    pub const Response = ?U64Hex;
};

pub const EthMaxPriorityFeePerGas = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthMining = struct {
    pub const Params = struct {};
    pub const Response = bool;
};

pub const EthNewBlockFilter = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthNewFilter = struct {
    pub const Params = struct {
        filter: LogFilter,
    };
    pub const Response = U64Hex;
};

pub const EthNewPendingTransactionFilter = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthProtocolVersion = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const EthSendRawTransaction = struct {
    pub const Params = struct {
        data: Hex,
    };
    pub const Response = Hash;
};

pub const EthSendTransaction = struct {
    pub const Params = struct {
        transaction: TransactionObject,
    };
    pub const Response = Hash;
};

pub const EthSign = struct {
    pub const Params = struct {
        address: Address,
        data: Hex,
    };
    pub const Response = Hex;
};

pub const EthSignTransaction = struct {
    pub const Params = struct {
        transaction: TransactionObject,
    };
    pub const Response = Hex;
};

pub const EthSignTypedDataV4 = struct {
    pub const Params = struct {
        address: Address,
        typedData: TypedData,
    };
    pub const Response = Hex;
};

pub const EthSyncing = struct {
    pub const Params = struct {};
    pub const Response = union(enum) {
        syncing: SyncingResponse,
        not_syncing: bool,
    };
};

pub const EthUninstallFilter = struct {
    pub const Params = struct {
        filterId: U64Hex,
    };
    pub const Response = bool;
};

// =============================================================================
// NET Method Types
// =============================================================================

pub const NetListening = struct {
    pub const Params = struct {};
    pub const Response = bool;
};

pub const NetPeerCount = struct {
    pub const Params = struct {};
    pub const Response = U64Hex;
};

pub const NetVersion = struct {
    pub const Params = struct {};
    pub const Response = []const u8;
};

// =============================================================================
// WEB3 Method Types
// =============================================================================

pub const Web3ClientVersion = struct {
    pub const Params = struct {};
    pub const Response = []const u8;
};

pub const Web3Sha3 = struct {
    pub const Params = struct {
        data: Hex,
    };
    pub const Response = Hash;
};

// =============================================================================
// DEBUG Method Types
// =============================================================================

pub const DebugTraceTransaction = struct {
    pub const Params = struct {
        transactionHash: Hash,
        config: ?TraceConfig = null,
    };
    pub const Response = TraceResponse;
};

pub const DebugTraceCall = struct {
    pub const Params = struct {
        transaction: TransactionObject,
        block: BlockNumber,
        config: ?TraceConfig = null,
    };
    pub const Response = TraceResponse;
};

pub const DebugTraceBlockByNumber = struct {
    pub const Params = struct {
        block: BlockNumber,
        config: ?TraceConfig = null,
    };
    pub const Response = []TraceResponse;
};

pub const DebugTraceBlockByHash = struct {
    pub const Params = struct {
        blockHash: Hash,
        config: ?TraceConfig = null,
    };
    pub const Response = []TraceResponse;
};

// =============================================================================
// ADMIN Method Types
// =============================================================================

pub const AdminNodeInfo = struct {
    pub const Params = struct {};
    pub const Response = NodeInfoResponse;
};

pub const AdminPeers = struct {
    pub const Params = struct {};
    pub const Response = []PeerResponse;
};

pub const AdminAddPeer = struct {
    pub const Params = struct {
        url: []const u8,
    };
    pub const Response = bool;
};

pub const AdminRemovePeer = struct {
    pub const Params = struct {
        url: []const u8,
    };
    pub const Response = bool;
};

// =============================================================================
// TXPOOL Method Types
// =============================================================================

pub const TxpoolStatus = struct {
    pub const Params = struct {};
    pub const Response = TxpoolStatusResponse;
};

pub const TxpoolInspect = struct {
    pub const Params = struct {};
    pub const Response = TxpoolInspectResponse;
};

pub const TxpoolContent = struct {
    pub const Params = struct {};
    pub const Response = TxpoolContentResponse;
};

// =============================================================================
// PERSONAL Method Types
// =============================================================================

pub const PersonalListAccounts = struct {
    pub const Params = struct {};
    pub const Response = []Address;
};

pub const PersonalNewAccount = struct {
    pub const Params = struct {
        password: []const u8,
    };
    pub const Response = Address;
};

pub const PersonalUnlockAccount = struct {
    pub const Params = struct {
        address: Address,
        password: []const u8,
        duration: ?u64 = null,
    };
    pub const Response = bool;
};

pub const PersonalLockAccount = struct {
    pub const Params = struct {
        address: Address,
    };
    pub const Response = bool;
};

pub const PersonalSendTransaction = struct {
    pub const Params = struct {
        transaction: TransactionObject,
        password: []const u8,
    };
    pub const Response = Hash;
};

pub const PersonalSign = struct {
    pub const Params = struct {
        data: Hex,
        address: Address,
        password: []const u8,
    };
    pub const Response = Hex;
};

// =============================================================================
// Complex Response Types
// =============================================================================

pub const TransactionObject = struct {
    from: Address,
    to: ?Address = null,
    gas: ?U64Hex = null,
    gasPrice: ?U64Hex = null,
    maxFeePerGas: ?U64Hex = null,
    maxPriorityFeePerGas: ?U64Hex = null,
    value: ?U256Hex = null,
    data: ?Hex = null,
    nonce: ?U64Hex = null,
    type: ?U64Hex = null,
    chainId: ?U64Hex = null,
    accessList: ?[]AccessListItem = null,
    blobVersionedHashes: ?[]Hash = null,
    maxFeePerBlobGas: ?U64Hex = null,
};

pub const AccessListItem = struct {
    address: Address,
    storageKeys: []Hash,
};

pub const LogFilter = struct {
    address: ?union(enum) {
        single: Address,
        multiple: []Address,
    } = null,
    topics: ?[]?union(enum) {
        single: Hash,
        multiple: []Hash,
    } = null,
    fromBlock: ?BlockNumber = null,
    toBlock: ?BlockNumber = null,
    blockHash: ?Hash = null,
};

pub const LogResponse = struct {
    address: Address,
    topics: []Hash,
    data: Hex,
    blockNumber: ?U64Hex,
    blockHash: ?Hash,
    transactionIndex: ?U64Hex,
    transactionHash: ?Hash,
    logIndex: ?U64Hex,
    removed: bool,
};

pub const BlockResponse = struct {
    number: ?U64Hex,
    hash: ?Hash,
    parentHash: Hash,
    nonce: ?U64Hex,
    sha3Uncles: Hash,
    logsBloom: ?Hex,
    transactionsRoot: Hash,
    stateRoot: Hash,
    receiptsRoot: Hash,
    miner: ?Address,
    difficulty: U256Hex,
    totalDifficulty: ?U256Hex,
    extraData: Hex,
    size: U64Hex,
    gasLimit: U64Hex,
    gasUsed: U64Hex,
    timestamp: U64Hex,
    transactions: union(enum) {
        hashes: []Hash,
        full: []TransactionResponse,
    },
    uncles: []Hash,
    baseFeePerGas: ?U64Hex,
    withdrawals: ?[]WithdrawalResponse,
    withdrawalsRoot: ?Hash,
    blobGasUsed: ?U64Hex,
    excessBlobGas: ?U64Hex,
    parentBeaconBlockRoot: ?Hash,
};

pub const TransactionResponse = struct {
    hash: Hash,
    nonce: U64Hex,
    blockHash: ?Hash,
    blockNumber: ?U64Hex,
    transactionIndex: ?U64Hex,
    from: Address,
    to: ?Address,
    value: U256Hex,
    gasPrice: ?U64Hex,
    gas: U64Hex,
    input: Hex,
    type: ?U64Hex,
    chainId: ?U64Hex,
    v: ?U64Hex,
    r: ?U256Hex,
    s: ?U256Hex,
    maxFeePerGas: ?U64Hex,
    maxPriorityFeePerGas: ?U64Hex,
    accessList: ?[]AccessListItem,
    blobVersionedHashes: ?[]Hash,
    maxFeePerBlobGas: ?U64Hex,
    yParity: ?U64Hex,
};

pub const TransactionReceiptResponse = struct {
    transactionHash: Hash,
    transactionIndex: U64Hex,
    blockHash: Hash,
    blockNumber: U64Hex,
    cumulativeGasUsed: U64Hex,
    gasUsed: U64Hex,
    contractAddress: ?Address,
    logs: []LogResponse,
    logsBloom: Hex,
    type: ?U64Hex,
    status: ?U64Hex,
    root: ?Hash,
    effectiveGasPrice: ?U64Hex,
    blobGasUsed: ?U64Hex,
    blobGasPrice: ?U64Hex,
};

pub const WithdrawalResponse = struct {
    index: U64Hex,
    validatorIndex: U64Hex,
    address: Address,
    amount: U64Hex,
};

pub const FeeHistoryResponse = struct {
    oldestBlock: U64Hex,
    baseFeePerGas: []U64Hex,
    gasUsedRatio: []f64,
    reward: ?[][]U64Hex,
};

pub const SyncingResponse = struct {
    startingBlock: U64Hex,
    currentBlock: U64Hex,
    highestBlock: U64Hex,
    knownStates: ?U64Hex,
    pulledStates: ?U64Hex,
};

pub const TypedData = struct {
    types: std.StringHashMap([]TypedDataField),
    primaryType: []const u8,
    domain: std.StringHashMap(JsonValue),
    message: std.StringHashMap(JsonValue),
};

pub const TypedDataField = struct {
    name: []const u8,
    type: []const u8,
};

pub const TraceConfig = struct {
    disableStorage: ?bool = null,
    disableMemory: ?bool = null,
    disableStack: ?bool = null,
    tracer: ?[]const u8 = null,
    timeout: ?[]const u8 = null,
};

pub const TraceResponse = struct {
    gas: U64Hex,
    failed: bool,
    returnValue: Hex,
    structLogs: []StructLogResponse,
};

pub const StructLogResponse = struct {
    pc: u64,
    op: []const u8,
    gas: U64Hex,
    gasCost: U64Hex,
    depth: u64,
    err: ?[]const u8,
    stack: ?[]U256Hex,
    memory: ?[]Hex,
    storage: ?std.StringHashMap(U256Hex),
};

pub const NodeInfoResponse = struct {
    id: []const u8,
    name: []const u8,
    enode: []const u8,
    enr: ?[]const u8,
    ip: []const u8,
    ports: struct {
        discovery: u16,
        listener: u16,
    },
    listenAddr: []const u8,
    protocols: std.StringHashMap(JsonValue),
};

pub const PeerResponse = struct {
    id: []const u8,
    name: []const u8,
    caps: [][]const u8,
    network: struct {
        localAddress: []const u8,
        remoteAddress: []const u8,
        inbound: bool,
        trusted: bool,
        static: bool,
    },
    protocols: std.StringHashMap(JsonValue),
};

pub const TxpoolStatusResponse = struct {
    pending: U64Hex,
    queued: U64Hex,
};

pub const TxpoolInspectResponse = struct {
    pending: std.StringHashMap(std.StringHashMap([]const u8)),
    queued: std.StringHashMap(std.StringHashMap([]const u8)),
};

pub const TxpoolContentResponse = struct {
    pending: std.StringHashMap(std.StringHashMap(TransactionResponse)),
    queued: std.StringHashMap(std.StringHashMap(TransactionResponse)),
};

// =============================================================================
// Utility Functions
// =============================================================================

/// Global ID counter for JSON-RPC requests
var global_id = std.atomic.Value(u64).init(0);

/// Generate a unique ID for JSON-RPC requests
pub fn generateId() u64 {
    return global_id.fetchAdd(1, .monotonic) + 1;
}

/// Create a JsonRpcRequest for a specific method
pub fn createRequest(method: JsonRpcMethod, params: anytype) JsonRpcRequest {
    const params_json = paramsToJsonValue(params);
    return JsonRpcRequest{
        .method = method.getMethodName(),
        .params = params_json,
        .id = generateId(),
    };
}

/// Convert parameters to JsonValue (simplified implementation)
fn paramsToJsonValue(params: anytype) JsonValue {
    // This is a simplified implementation
    // In a full implementation, you would serialize the params properly
    _ = params;
    return JsonValue{ .null = {} };
}

/// Response type for a specific method
pub fn ResponseType(comptime method: JsonRpcMethod) type {
    return switch (method) {
        .eth_accounts => EthAccounts.Response,
        .eth_blockNumber => EthBlockNumber.Response,
        .eth_call => EthCall.Response,
        .eth_chainId => EthChainId.Response,
        .eth_coinbase => EthCoinbase.Response,
        .eth_estimateGas => EthEstimateGas.Response,
        .eth_feeHistory => EthFeeHistory.Response,
        .eth_gasPrice => EthGasPrice.Response,
        .eth_getBalance => EthGetBalance.Response,
        .eth_getBlockByHash => EthGetBlockByHash.Response,
        .eth_getBlockByNumber => EthGetBlockByNumber.Response,
        .eth_getBlockTransactionCountByHash => EthGetBlockTransactionCountByHash.Response,
        .eth_getBlockTransactionCountByNumber => EthGetBlockTransactionCountByNumber.Response,
        .eth_getCode => EthGetCode.Response,
        .eth_getFilterChanges => EthGetFilterChanges.Response,
        .eth_getFilterLogs => EthGetFilterLogs.Response,
        .eth_getLogs => EthGetLogs.Response,
        .eth_getStorageAt => EthGetStorageAt.Response,
        .eth_getTransactionByHash => EthGetTransactionByHash.Response,
        .eth_getTransactionByBlockHashAndIndex => EthGetTransactionByBlockHashAndIndex.Response,
        .eth_getTransactionByBlockNumberAndIndex => EthGetTransactionByBlockNumberAndIndex.Response,
        .eth_getTransactionCount => EthGetTransactionCount.Response,
        .eth_getTransactionReceipt => EthGetTransactionReceipt.Response,
        .eth_getUncleByBlockHashAndIndex => EthGetUncleByBlockHashAndIndex.Response,
        .eth_getUncleByBlockNumberAndIndex => EthGetUncleByBlockNumberAndIndex.Response,
        .eth_getUncleCountByBlockHash => EthGetUncleCountByBlockHash.Response,
        .eth_getUncleCountByBlockNumber => EthGetUncleCountByBlockNumber.Response,
        .eth_maxPriorityFeePerGas => EthMaxPriorityFeePerGas.Response,
        .eth_mining => EthMining.Response,
        .eth_newBlockFilter => EthNewBlockFilter.Response,
        .eth_newFilter => EthNewFilter.Response,
        .eth_newPendingTransactionFilter => EthNewPendingTransactionFilter.Response,
        .eth_protocolVersion => EthProtocolVersion.Response,
        .eth_sendRawTransaction => EthSendRawTransaction.Response,
        .eth_sendTransaction => EthSendTransaction.Response,
        .eth_sign => EthSign.Response,
        .eth_signTransaction => EthSignTransaction.Response,
        .eth_signTypedData_v4 => EthSignTypedDataV4.Response,
        .eth_syncing => EthSyncing.Response,
        .eth_uninstallFilter => EthUninstallFilter.Response,
        .net_listening => NetListening.Response,
        .net_peerCount => NetPeerCount.Response,
        .net_version => NetVersion.Response,
        .web3_clientVersion => Web3ClientVersion.Response,
        .web3_sha3 => Web3Sha3.Response,
        .debug_traceTransaction => DebugTraceTransaction.Response,
        .debug_traceCall => DebugTraceCall.Response,
        .debug_traceBlockByNumber => DebugTraceBlockByNumber.Response,
        .debug_traceBlockByHash => DebugTraceBlockByHash.Response,
        .admin_nodeInfo => AdminNodeInfo.Response,
        .admin_peers => AdminPeers.Response,
        .admin_addPeer => AdminAddPeer.Response,
        .admin_removePeer => AdminRemovePeer.Response,
        .txpool_status => TxpoolStatus.Response,
        .txpool_inspect => TxpoolInspect.Response,
        .txpool_content => TxpoolContent.Response,
        .personal_listAccounts => PersonalListAccounts.Response,
        .personal_newAccount => PersonalNewAccount.Response,
        .personal_unlockAccount => PersonalUnlockAccount.Response,
        .personal_lockAccount => PersonalLockAccount.Response,
        .personal_sendTransaction => PersonalSendTransaction.Response,
        .personal_sign => PersonalSign.Response,
    };
}

// =============================================================================
// Tests
// =============================================================================

test "JsonRpcMethod names" {
    const method = JsonRpcMethod.eth_chainId;
    try testing.expectEqualStrings("eth_chainId", method.getMethodName());

    const method2 = JsonRpcMethod.eth_getBalance;
    try testing.expectEqualStrings("eth_getBalance", method2.getMethodName());
}

test "JsonValue conversions" {
    const str_value = JsonValue.fromString("0x1234");
    try testing.expectEqual(@as(u64, 0x1234), try str_value.toU64());

    const num_value = JsonValue.fromU64(42);
    try testing.expectEqual(@as(u64, 42), try num_value.toU64());

    const bool_value = JsonValue.fromBool(true);
    try testing.expectEqual(true, try bool_value.toBool());
}

test "JsonRpcRequest creation" {
    const req = JsonRpcRequest.init("eth_chainId", JsonValue{ .null = {} });
    try testing.expectEqualStrings("eth_chainId", req.method);
    try testing.expectEqualStrings("2.0", req.jsonrpc);
}

test "JsonRpcResponse error handling" {
    const response = JsonRpcResponse{
        .result = null,
        .err = JsonRpcError.init(-32000, "execution reverted"),
        .id = 1,
    };

    try testing.expect(response.isError());
}

test "BlockNumber conversions" {
    const block_num = BlockNumber{ .number = 12345 };
    const json_val = block_num.toJsonValue();
    try testing.expectEqual(@as(u64, 12345), try json_val.toU64());

    const block_tag = BlockNumber{ .tag = .latest };
    const json_val2 = block_tag.toJsonValue();
    try testing.expectEqualStrings("latest", try json_val2.toString());
}

// =============================================================================
// Batch Request Support
// =============================================================================

pub const JsonRpcBatchRequest = struct {
    requests: []JsonRpcRequest,
    allocator: Allocator,

    pub fn init(allocator: Allocator, requests: []JsonRpcRequest) JsonRpcBatchRequest {
        return JsonRpcBatchRequest{
            .requests = requests,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: JsonRpcBatchRequest) void {
        self.allocator.free(self.requests);
    }

    pub fn add(self: *JsonRpcBatchRequest, request: JsonRpcRequest) !void {
        const new_requests = try self.allocator.realloc(self.requests, self.requests.len + 1);
        new_requests[new_requests.len - 1] = request;
        self.requests = new_requests;
    }

    pub fn len(self: JsonRpcBatchRequest) usize {
        return self.requests.len;
    }
};

pub const JsonRpcBatchResponse = struct {
    responses: []JsonRpcResponse,
    allocator: Allocator,

    pub fn init(allocator: Allocator, responses: []JsonRpcResponse) JsonRpcBatchResponse {
        return JsonRpcBatchResponse{
            .responses = responses,
            .allocator = allocator,
        };
    }

    pub fn deinit(self: JsonRpcBatchResponse) void {
        self.allocator.free(self.responses);
    }

    pub fn getResponse(self: JsonRpcBatchResponse, id: u64) ?JsonRpcResponse {
        for (self.responses) |response| {
            if (response.id == id) {
                return response;
            }
        }
        return null;
    }

    pub fn len(self: JsonRpcBatchResponse) usize {
        return self.responses.len;
    }
};

/// Utility function to create a batch request
pub fn createBatchRequest(allocator: Allocator, requests: []JsonRpcRequest) JsonRpcBatchRequest {
    return JsonRpcBatchRequest.init(allocator, requests);
}

test "JsonRpcBatchRequest creation" {
    const allocator = testing.allocator;

    const req1 = JsonRpcRequest{
        .method = "eth_chainId",
        .params = JsonValue{ .null = {} },
        .id = 1,
    };

    const req2 = JsonRpcRequest{
        .method = "eth_gasPrice",
        .params = JsonValue{ .null = {} },
        .id = 2,
    };

    const requests = try allocator.alloc(JsonRpcRequest, 2);
    requests[0] = req1;
    requests[1] = req2;

    const batch = JsonRpcBatchRequest.init(allocator, requests);
    try testing.expect(batch.len() == 2);

    batch.deinit();
}
