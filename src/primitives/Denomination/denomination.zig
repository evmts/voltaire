const std = @import("std");
const testing = std.testing;
const Uint = @import("../Uint/Uint.zig");

pub const U256 = Uint.Uint(256, 4);

// Conversion constants
pub const WEI_PER_GWEI: U256 = U256.from_u64(1_000_000_000); // 1e9
pub const WEI_PER_ETHER: U256 = blk: {
    // 1e18 = 1_000_000_000_000_000_000
    var limbs: [4]u64 = .{ 0, 0, 0, 0 };
    limbs[0] = 0xde0b6b3a7640000; // low 64 bits
    limbs[1] = 0; // next 64 bits
    limbs[2] = 0; // next 64 bits
    limbs[3] = 0; // high 64 bits
    break :blk U256.from_limbs(limbs);
};
pub const GWEI_PER_ETHER: U256 = U256.from_u64(1_000_000_000); // 1e9

// Wei - smallest unit
pub const Wei = struct {
    value: U256,

    pub fn from_u256(v: U256) Wei {
        return .{ .value = v };
    }

    pub fn to_u256(self: Wei) U256 {
        return self.value;
    }

    pub fn to_gwei(self: Wei) Gwei {
        const result = self.value.div_rem(WEI_PER_GWEI);
        return Gwei{ .value = result.quotient };
    }

    pub fn to_ether(self: Wei) Ether {
        const result = self.value.div_rem(WEI_PER_ETHER);
        return Ether{ .value = result.quotient };
    }

    pub fn from_gwei(g: Gwei) Wei {
        const result = g.value.wrapping_mul(WEI_PER_GWEI);
        return Wei{ .value = result };
    }

    pub fn from_ether(e: Ether) Wei {
        const result = e.value.wrapping_mul(WEI_PER_ETHER);
        return Wei{ .value = result };
    }
};

// Gwei - 1e9 wei
pub const Gwei = struct {
    value: U256,

    pub fn from_u256(v: U256) Gwei {
        return .{ .value = v };
    }

    pub fn to_u256(self: Gwei) U256 {
        return self.value;
    }

    pub fn to_wei(self: Gwei) Wei {
        const result = self.value.wrapping_mul(WEI_PER_GWEI);
        return Wei{ .value = result };
    }

    pub fn to_ether(self: Gwei) Ether {
        const result = self.value.div_rem(GWEI_PER_ETHER);
        return Ether{ .value = result.quotient };
    }

    pub fn from_wei(w: Wei) Gwei {
        const result = w.value.div_rem(WEI_PER_GWEI);
        return Gwei{ .value = result.quotient };
    }

    pub fn from_ether(e: Ether) Gwei {
        const result = e.value.wrapping_mul(GWEI_PER_ETHER);
        return Gwei{ .value = result };
    }
};

// Ether - 1e18 wei
pub const Ether = struct {
    value: U256,

    pub fn from_u256(v: U256) Ether {
        return .{ .value = v };
    }

    pub fn to_u256(self: Ether) U256 {
        return self.value;
    }

    pub fn to_wei(self: Ether) Wei {
        const result = self.value.wrapping_mul(WEI_PER_ETHER);
        return Wei{ .value = result };
    }

    pub fn to_gwei(self: Ether) Gwei {
        const result = self.value.wrapping_mul(GWEI_PER_ETHER);
        return Gwei{ .value = result };
    }

    pub fn from_wei(w: Wei) Ether {
        const result = w.value.div_rem(WEI_PER_ETHER);
        return Ether{ .value = result.quotient };
    }

    pub fn from_gwei(g: Gwei) Ether {
        const result = g.value.div_rem(GWEI_PER_ETHER);
        return Ether{ .value = result.quotient };
    }
};

// Tests
test "wei to gwei conversion" {
    const w = Wei.from_u256(U256.from_u64(1_000_000_000));
    const g = w.to_gwei();
    try testing.expect(g.value.eq(U256.from_u64(1)));
}

test "wei to ether conversion" {
    const limbs: [4]u64 = .{ 0xde0b6b3a7640000, 0, 0, 0 };
    const w = Wei.from_u256(U256.from_limbs(limbs));
    const e = w.to_ether();
    try testing.expect(e.value.eq(U256.from_u64(1)));
}

test "gwei to wei conversion" {
    const g = Gwei.from_u256(U256.from_u64(1));
    const w = g.to_wei();
    try testing.expect(w.value.eq(U256.from_u64(1_000_000_000)));
}

test "gwei to ether conversion" {
    const g = Gwei.from_u256(U256.from_u64(1_000_000_000));
    const e = g.to_ether();
    try testing.expect(e.value.eq(U256.from_u64(1)));
}

test "ether to wei conversion" {
    const e = Ether.from_u256(U256.from_u64(1));
    const w = e.to_wei();
    const expected_limbs: [4]u64 = .{ 0xde0b6b3a7640000, 0, 0, 0 };
    try testing.expect(w.value.eq(U256.from_limbs(expected_limbs)));
}

test "ether to gwei conversion" {
    const e = Ether.from_u256(U256.from_u64(1));
    const g = e.to_gwei();
    try testing.expect(g.value.eq(U256.from_u64(1_000_000_000)));
}

test "round trip conversions" {
    const original = Wei.from_u256(U256.from_u64(5_000_000_000));
    const g = original.to_gwei();
    const back = g.to_wei();
    try testing.expect(back.value.eq(U256.from_u64(5_000_000_000)));
}
