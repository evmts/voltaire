const std = @import("std");
const builtin = @import("builtin");

pub const CpuFeatures = struct {
    has_aes: bool,
    has_sha: bool,
    has_avx2: bool,
    has_bmi2: bool,
    
    const Self = @This();
    
    pub fn init() Self {
        return Self{
            .has_aes = has_aes_support(),
            .has_sha = has_sha_support(),
            .has_avx2 = has_avx2_support(),
            .has_bmi2 = has_bmi2_support(),
        };
    }
};

pub const cpu_features = CpuFeatures.init();

fn has_aes_support() bool {
    return switch (builtin.target.cpu.arch) {
        .x86_64 => std.Target.x86.featureSetHas(builtin.target.cpu.features, .aes),
        .aarch64 => std.Target.aarch64.featureSetHas(builtin.target.cpu.features, .aes),
        else => false,
    };
}

fn has_sha_support() bool {
    return switch (builtin.target.cpu.arch) {
        .x86_64 => std.Target.x86.featureSetHas(builtin.target.cpu.features, .sha),
        .aarch64 => std.Target.aarch64.featureSetHas(builtin.target.cpu.features, .sha2),
        else => false,
    };
}

fn has_avx2_support() bool {
    return switch (builtin.target.cpu.arch) {
        .x86_64 => std.Target.x86.featureSetHas(builtin.target.cpu.features, .avx2),
        else => false,
    };
}

fn has_bmi2_support() bool {
    return switch (builtin.target.cpu.arch) {
        .x86_64 => std.Target.x86.featureSetHas(builtin.target.cpu.features, .bmi2),
        else => false,
    };
}

test "CPU feature detection" {
    const features = CpuFeatures.init();
    std.testing.expect(features.has_aes != undefined);
    std.testing.expect(features.has_sha != undefined);
    std.testing.expect(features.has_avx2 != undefined);
    std.testing.expect(features.has_bmi2 != undefined);
}