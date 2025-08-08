// Integration tests module

pub const arithmetic_flow_test = @import("arithmetic_flow_test.zig");
pub const arithmetic_sequences_test = @import("arithmetic_sequences_test.zig");
pub const basic_sequences_test = @import("basic_sequences_test.zig");
pub const call_environment_test = @import("call_environment_test.zig");
pub const complex_interactions_test = @import("complex_interactions_test.zig");
pub const complex_scenarios_test = @import("complex_scenarios_test.zig");
pub const comprehensive_test = @import("comprehensive_test.zig");
pub const contract_interaction_test = @import("contract_interaction_test.zig");
pub const control_flow_test = @import("control_flow_test.zig");
pub const crypto_logging_test = @import("crypto_logging_test.zig");
pub const edge_cases_test = @import("edge_cases_test.zig");
pub const environment_system_test = @import("environment_system_test.zig");
pub const event_logging_test = @import("event_logging_test.zig");
pub const memory_storage_test = @import("memory_storage_test.zig");
pub const opcode_integration_test = @import("opcode_integration_test.zig");

test {
    _ = arithmetic_flow_test;
    _ = arithmetic_sequences_test;
    _ = basic_sequences_test;
    _ = call_environment_test;
    _ = complex_interactions_test;
    _ = complex_scenarios_test;
    _ = comprehensive_test;
    _ = contract_interaction_test;
    _ = control_flow_test;
    _ = crypto_logging_test;
    _ = edge_cases_test;
    _ = environment_system_test;
    _ = event_logging_test;
    _ = memory_storage_test;
    _ = opcode_integration_test;
}
