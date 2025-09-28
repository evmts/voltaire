const std = @import("std");
const testing = std.testing;
const runner = @import("runner.zig");

// Test with a minimal test case
test "runner basic test" {
    const allocator = testing.allocator;
    
    // Create a minimal test case
    const test_data = runner.TestData{
        .test_name = "test_runner_basic",
        .source_file = "test.json",
        .test_index = 0,
        .data = .{
            .env = .{
                .currentNumber = "1",
                .currentTimestamp = "1000",
                .currentGasLimit = "10000000",
                .currentCoinbase = "0x0000000000000000000000000000000000000000",
            },
            .pre = &[_]runner.AccountState{
                .{
                    .address = "0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b",
                    .balance = "1000000000000000000",
                    .nonce = "0",
                },
            },
            .transaction = .{
                .to = "0x0000000000000000000000000000000000000000",
                .value = "0",
                .gasLimit = "21000",
                .data = "0x",
            },
        },
    };
    
    // This should run without errors
    try runner.runTest(allocator, test_data);
}