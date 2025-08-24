// TODO: Currently used in host which is unused
/// Call result structure for EVM calls
pub const CallResult = struct {
    // true if successfull
    success: bool,
    // gas_left 
    gas_left: u64,
    // Output owned by caller
    output: []const u8,
};
