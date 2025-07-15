// Working simple provider implementation (replaces broken provider.zig)
pub const Provider = @import("simple_provider.zig").Provider;
pub const ProviderError = @import("simple_provider.zig").ProviderError;

// Working JSON-RPC types and transport
pub const JsonRpc = @import("transport/json_rpc.zig");
pub const Transport = @import("transport/http_simple.zig");

// Legacy broken exports (commented out to prevent compilation errors)
// pub const Provider = @import("provider.zig");
// pub const Config = @import("config.zig");
// pub const Blockchain = @import("blockchain.zig");
// pub const Db = @import("db.zig");
// pub const GenesisState = @import("genesis_state.zig");
// pub const JsonRpcMethods = @import("jsonrpc/methods.zig");
// pub const Transport = @import("transport/mod.zig");