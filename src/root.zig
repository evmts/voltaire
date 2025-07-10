//! By convention, root.zig is the root source file when making a library. If
//! you are making an executable, the convention is to delete this file and
//! start with main.zig instead.
const std = @import("std");

pub const Evm = @import("evm/evm.zig");

test "Evm module" {
    std.testing.refAllDecls(Evm);
}
