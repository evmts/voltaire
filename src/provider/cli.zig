const std = @import("std");
const clap = @import("clap");

const Network = enum {
    mainnet,
    sepolia,
    holesky,
};

const SyncMode = enum {
    full,
    light,
};

const LogLevel = enum {
    @"error",
    warn,
    info,
    debug,
};

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    const params = comptime clap.parseParamsComptime(
        \\-h, --help                    Display this help and exit.
        \\    --network <str>           Network (default: mainnet)
        \\    --customChain <str>       Path to custom chain parameters json file
        \\    --bootnodes <str>         Comma-separated list of network bootnodes
        \\    --port <u16>              RLPx listening port (default: 30303)
        \\    --sync <str>              Blockchain sync mode (default: full)
        \\    --rpc                     Enable the JSON-RPC server
        \\    --rpcPort <u16>           HTTP-RPC server listening port (default: 8545)
        \\    --rpcAddr <str>           HTTP-RPC server listening interface address (default: localhost)
        \\    --ws                      Enable the WS-RPC server
        \\    --wsPort <u16>            WS-RPC server listening port (default: 8546)
        \\    --rpcEngine               Enable the Engine JSON-RPC server
        \\    --rpcEnginePort <u16>     Engine RPC server listening port (default: 8551)
        \\    --rpcEngineAuth           Enable jwt authentication for Engine RPC (default: true)
        \\    --jwtSecret <str>         Path to a hex-encoded JWT secret file
    );