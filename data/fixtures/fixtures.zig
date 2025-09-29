const std = @import("std");
const foundry = @import("foundry_compilers");

pub const CompiledContract = struct {
    name: []const u8,
    bytecode: []u8,
    deployed_bytecode: []u8,
    abi: []const u8,

    pub fn deinit(self: *CompiledContract, allocator: std.mem.Allocator) void {
        allocator.free(self.bytecode);
        allocator.free(self.deployed_bytecode);
    }
};

pub const Fixtures = struct {
    allocator: std.mem.Allocator,
    contracts: std.StringHashMap(CompiledContract),

    pub fn init(allocator: std.mem.Allocator) !Fixtures {
        return .{
            .allocator = allocator,
            .contracts = std.StringHashMap(CompiledContract).init(allocator),
        };
    }

    pub fn deinit(self: *Fixtures) void {
        var iter = self.contracts.iterator();
        while (iter.next()) |entry| {
            // Free the name
            self.allocator.free(entry.value_ptr.name);
            // Free bytecode and deployed_bytecode
            entry.value_ptr.deinit(self.allocator);
            // Free the ABI
            self.allocator.free(entry.value_ptr.abi);
        }
        self.contracts.deinit();
    }

    /// Compile all fixtures and store them in memory
    pub fn compileAll(self: *Fixtures) !void {
        const fixture_files = [_]struct {
            name: []const u8,
            path: []const u8,
        }{
            .{ .name = "arithmetic", .path = "data/fixtures/Arithmetic.sol" },
            .{ .name = "bitwise", .path = "data/fixtures/Bitwise.sol" },
            .{ .name = "blockinfo", .path = "data/fixtures/BlockInfo.sol" },
            .{ .name = "bubblesort", .path = "data/fixtures/BubbleSort.sol" },
            .{ .name = "calldata", .path = "data/fixtures/Calldata.sol" },
            .{ .name = "codecopy", .path = "data/fixtures/CodeCopy.sol" },
            .{ .name = "comparison", .path = "data/fixtures/Comparison.sol" },
            .{ .name = "context", .path = "data/fixtures/Context.sol" },
            .{ .name = "contractcalls", .path = "data/fixtures/ContractCalls.sol" },
            .{ .name = "contractcreation", .path = "data/fixtures/ContractCreation.sol" },
            .{ .name = "controlflow", .path = "data/fixtures/ControlFlow.sol" },
            .{ .name = "erc20approval", .path = "data/fixtures/Erc20Approval.sol" },
            .{ .name = "erc20mint", .path = "data/fixtures/Erc20Mint.sol" },
            .{ .name = "erc20transfer", .path = "data/fixtures/Erc20Transfer.sol" },
            .{ .name = "externalcode", .path = "data/fixtures/ExternalCode.sol" },
            .{ .name = "factorial", .path = "data/fixtures/Factorial.sol" },
            .{ .name = "factorial_recursive", .path = "data/fixtures/FactorialRecursive.sol" },
            .{ .name = "fibonacci", .path = "data/fixtures/Fibanacci.sol" },
            .{ .name = "fibonacci_recursive", .path = "data/fixtures/FibonacciRecursive.sol" },
            .{ .name = "hashing", .path = "data/fixtures/Hashing.sol" },
            .{ .name = "logs", .path = "data/fixtures/Logs.sol" },
            .{ .name = "manyhashes", .path = "data/fixtures/ManyHashes.sol" },
            .{ .name = "memory", .path = "data/fixtures/Memory.sol" },
            .{ .name = "modulararithmetic", .path = "data/fixtures/ModularArithmetic.sol" },
            .{ .name = "mstore", .path = "data/fixtures/Mstore.sol" },
            .{ .name = "push", .path = "data/fixtures/Push.sol" },
            .{ .name = "returndata", .path = "data/fixtures/ReturnData.sol" },
            .{ .name = "shifts", .path = "data/fixtures/Shifts.sol" },
            .{ .name = "signedarithmetic", .path = "data/fixtures/SignedArithmetic.sol" },
            .{ .name = "snailtracer", .path = "data/fixtures/SnailTracer.sol" },
            .{ .name = "sstore", .path = "data/fixtures/Sstore.sol" },
            .{ .name = "stack", .path = "data/fixtures/Stack.sol" },
            .{ .name = "storage", .path = "data/fixtures/Storage.sol" },
            .{ .name = "tenhashes", .path = "data/fixtures/TenThousandHashes.sol" },
        };

        for (fixture_files) |fixture| {
            const contract = try self.compileContract(fixture.path);
            try self.contracts.put(fixture.name, contract);
        }
    }

    /// Compile a single contract
    fn compileContract(self: *Fixtures, path: []const u8) !CompiledContract {
        const settings = foundry.CompilerSettings{
            .optimizer_enabled = true,
            .optimizer_runs = 200,
            .output_abi = true,
            .output_bytecode = true,
            .output_deployed_bytecode = true,
        };

        var result = try foundry.Compilers.Compiler.compile_file(self.allocator, path, settings);
        defer result.deinit();

        if (result.contracts.len == 0) return error.NoContractsCompiled;

        // Take the first contract (or the main contract if multiple)
        const contract = result.contracts[0];

        // Convert hex bytecode to bytes
        const bytecode = try self.hexToBytes(contract.bytecode);
        const deployed_bytecode = try self.hexToBytes(contract.deployed_bytecode);

        return CompiledContract{
            .name = try self.allocator.dupe(u8, contract.name),
            .bytecode = bytecode,
            .deployed_bytecode = deployed_bytecode,
            .abi = try self.allocator.dupe(u8, contract.abi),
        };
    }

    /// Get a compiled contract by name
    pub fn getContract(self: *const Fixtures, name: []const u8) ?CompiledContract {
        return self.contracts.get(name);
    }

    /// Get bytecode for a contract
    pub fn getBytecode(self: *const Fixtures, name: []const u8) ?[]const u8 {
        if (self.contracts.get(name)) |contract| {
            return contract.bytecode;
        }
        return null;
    }

    /// Get deployed bytecode for a contract
    pub fn getDeployedBytecode(self: *const Fixtures, name: []const u8) ?[]const u8 {
        if (self.contracts.get(name)) |contract| {
            return contract.deployed_bytecode;
        }
        return null;
    }

    /// Convert hex string to bytes
    fn hexToBytes(self: *Fixtures, hex_str: []const u8) ![]u8 {
        var str = hex_str;
        // Remove 0x prefix if present
        if (str.len >= 2 and (std.mem.eql(u8, str[0..2], "0x") or std.mem.eql(u8, str[0..2], "0X"))) {
            str = str[2..];
        }

        if (str.len % 2 != 0) return error.OddNumberOfDigits;

        const result = try self.allocator.alloc(u8, str.len / 2);
        for (result, 0..) |*byte, i| {
            const high = try std.fmt.charToDigit(str[i * 2], 16);
            const low = try std.fmt.charToDigit(str[i * 2 + 1], 16);
            byte.* = (high << 4) | low;
        }
        return result;
    }

    /// List all available fixtures
    pub fn listFixtures(self: *const Fixtures) void {
        var iter = self.contracts.iterator();
        std.debug.print("Available fixtures:\n", .{});
        while (iter.next()) |entry| {
            std.debug.print("  - {s}: {} bytes (deployed: {} bytes)\n", .{
                entry.key_ptr.*,
                entry.value_ptr.bytecode.len,
                entry.value_ptr.deployed_bytecode.len,
            });
        }
    }
};

test "compile fixtures" {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    var fixtures = try Fixtures.init(allocator);
    defer fixtures.deinit();

    try fixtures.compileAll();

    // Verify some contracts were compiled
    try std.testing.expect(fixtures.contracts.count() > 0);

    // Check that arithmetic fixture exists
    const arithmetic = fixtures.getContract("arithmetic");
    try std.testing.expect(arithmetic != null);
}
