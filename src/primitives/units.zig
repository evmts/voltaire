const std = @import("std");

// Ethereum unit constants
pub const WEI_PER_GWEI: u256 = 1_000_000_000;
pub const WEI_PER_ETHER: u256 = 1_000_000_000_000_000_000;
pub const GWEI_PER_ETHER: u256 = 1_000_000_000;

// Re-export unit conversion functions from numeric.zig
const numeric = @import("numeric.zig");
pub const parseEther = numeric.parseEther;
pub const parseGwei = numeric.parseGwei;
pub const formatEther = numeric.formatEther;
pub const formatGwei = numeric.formatGwei;
pub const parseUnits = numeric.parseUnits;
pub const formatUnits = numeric.formatUnits;
pub const Unit = numeric.Unit;
pub const NumericError = numeric.NumericError;