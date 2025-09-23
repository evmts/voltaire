const std = @import("std");
const testing = std.testing;
const Eips = @import("../../src/eips_and_hardforks/eips.zig").Eips;
const EipOverride = @import("../../src/eips_and_hardforks/eips.zig").EipOverride;
const Hardfork = @import("../../src/eips_and_hardforks/eips.zig").Hardfork;

test "EIP override system - basic enable" {
    // Test enabling a future EIP on an older hardfork
    const london_with_cancun_features = Eips{
        .hardfork = Hardfork.LONDON,
        .overrides = &[_]EipOverride{
            .{ .eip = 1153, .enabled = true }, // Transient storage (Cancun)
            .{ .eip = 4844, .enabled = true }, // Blob transactions (Cancun)
            .{ .eip = 5656, .enabled = true }, // MCOPY (Cancun)
        },
    };

    // Verify these are enabled
    try testing.expect(london_with_cancun_features.is_eip_active(1153));
    try testing.expect(london_with_cancun_features.is_eip_active(4844));
    try testing.expect(london_with_cancun_features.is_eip_active(5656));

    // Check through the helper functions
    try testing.expect(london_with_cancun_features.eip_1153_transient_storage_enabled());
    try testing.expect(london_with_cancun_features.eip_4844_blob_transactions_enabled());
    try testing.expect(london_with_cancun_features.eip_5656_has_mcopy());

    // London features should still be enabled
    try testing.expect(london_with_cancun_features.is_eip_active(1559));
    try testing.expect(london_with_cancun_features.eip_1559_is_enabled());
}

test "EIP override system - basic disable" {
    // Test disabling existing EIPs
    const cancun_minimal = Eips{
        .hardfork = Hardfork.CANCUN,
        .overrides = &[_]EipOverride{
            .{ .eip = 1153, .enabled = false }, // Disable transient storage
            .{ .eip = 4844, .enabled = false }, // Disable blob transactions
            .{ .eip = 6780, .enabled = false }, // Disable SELFDESTRUCT restriction
        },
    };

    // Verify these are disabled
    try testing.expect(!cancun_minimal.is_eip_active(1153));
    try testing.expect(!cancun_minimal.is_eip_active(4844));
    try testing.expect(!cancun_minimal.is_eip_active(6780));

    // Check through the helper functions
    try testing.expect(!cancun_minimal.eip_1153_transient_storage_enabled());
    try testing.expect(!cancun_minimal.eip_4844_blob_transactions_enabled());
    try testing.expect(!cancun_minimal.eip_6780_selfdestruct_same_transaction_only());

    // Other Cancun features should still be enabled
    try testing.expect(cancun_minimal.is_eip_active(3855)); // PUSH0 from Shanghai
    try testing.expect(cancun_minimal.eip_3855_push0_enabled());
}

test "EIP override system - gas cost changes" {
    // Test that gas cost EIPs can be overridden
    const istanbul_with_berlin_gas = Eips{
        .hardfork = Hardfork.ISTANBUL,
        .overrides = &[_]EipOverride{
            .{ .eip = 2929, .enabled = true }, // Berlin gas changes
        },
    };

    // Verify Berlin gas costs are applied
    try testing.expectEqual(@as(u64, 2100), istanbul_with_berlin_gas.eip_2929_cold_sload_cost());
    try testing.expectEqual(@as(u64, 100), istanbul_with_berlin_gas.eip_2929_warm_storage_read_cost());
    try testing.expectEqual(@as(u64, 2600), istanbul_with_berlin_gas.eip_2929_cold_account_access_cost());
    try testing.expectEqual(@as(u64, 100), istanbul_with_berlin_gas.eip_2929_warm_account_access_cost());

    // Compare with plain Istanbul
    const plain_istanbul = Eips{ .hardfork = Hardfork.ISTANBUL };
    try testing.expectEqual(@as(u64, 200), plain_istanbul.eip_2929_cold_sload_cost());
    try testing.expectEqual(@as(u64, 700), plain_istanbul.eip_2929_cold_account_access_cost());
}

test "EIP override system - complex scenario" {
    // Test a complex mix of enables and disables
    const custom_config = Eips{
        .hardfork = Hardfork.BERLIN,
        .overrides = &[_]EipOverride{
            // Enable future features
            .{ .eip = 3855, .enabled = true }, // PUSH0 (Shanghai)
            .{ .eip = 3651, .enabled = true }, // Warm coinbase (Shanghai)
            .{ .eip = 1559, .enabled = true }, // Fee market (London)
            .{ .eip = 3198, .enabled = true }, // BASEFEE (London)
            .{ .eip = 3529, .enabled = true }, // Refund reduction (London)
            // Disable existing feature
            .{ .eip = 2930, .enabled = false }, // Access list transactions (Berlin)
        },
    };

    // Check enabled features
    try testing.expect(custom_config.is_eip_active(3855));
    try testing.expect(custom_config.is_eip_active(3651));
    try testing.expect(custom_config.is_eip_active(1559));
    try testing.expect(custom_config.is_eip_active(3198));
    try testing.expect(custom_config.is_eip_active(3529));
    try testing.expect(custom_config.eip_3855_push0_enabled());
    try testing.expect(custom_config.eip_1559_is_enabled());
    try testing.expect(custom_config.eip_3198_basefee_opcode_enabled());

    // Check disabled feature
    try testing.expect(!custom_config.is_eip_active(2930));

    // Check Berlin features that weren't overridden
    try testing.expect(custom_config.is_eip_active(2929)); // Still has Berlin gas changes

    // Verify gas refund changes apply
    try testing.expectEqual(@as(u64, 20), custom_config.eip_3529_gas_refund_cap(100, 100)); // 1/5 due to EIP-3529
}

test "EIP override system - no effect on base features" {
    // Test that unrelated EIPs aren't affected by overrides
    const cancun_with_overrides = Eips{
        .hardfork = Hardfork.CANCUN,
        .overrides = &[_]EipOverride{
            .{ .eip = 7702, .enabled = true }, // Enable Prague feature early
        },
    };

    // Prague feature should be enabled
    try testing.expect(cancun_with_overrides.is_eip_active(7702));
    try testing.expect(cancun_with_overrides.eip_7702_eoa_code_enabled());

    // All Cancun features should still work
    try testing.expect(cancun_with_overrides.is_eip_active(1153));
    try testing.expect(cancun_with_overrides.is_eip_active(4844));
    try testing.expect(cancun_with_overrides.is_eip_active(6780));
    try testing.expect(cancun_with_overrides.is_eip_active(3855)); // From Shanghai
    try testing.expect(cancun_with_overrides.is_eip_active(1559)); // From London
    try testing.expect(cancun_with_overrides.is_eip_active(2929)); // From Berlin
}

test "EIP override system - duplicate overrides" {
    // Test that last override wins
    const config_with_duplicates = Eips{
        .hardfork = Hardfork.LONDON,
        .overrides = &[_]EipOverride{
            .{ .eip = 3855, .enabled = true },  // Enable PUSH0
            .{ .eip = 3855, .enabled = false }, // Then disable it
            .{ .eip = 3855, .enabled = true },  // Then enable it again
        },
    };

    // First matching override should be used (enabled = true)
    try testing.expect(config_with_duplicates.is_eip_active(3855));
}