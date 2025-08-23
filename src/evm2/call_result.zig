/// Call result structure for EVM calls
pub const CallResult = struct {
    success: bool,
    gas_left: u64,
    output: []const u8,
};