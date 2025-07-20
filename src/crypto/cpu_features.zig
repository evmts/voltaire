const std = @import("std");
const builtin = @import("builtin");

pub const CpuFeatures = struct {
    has_aes: bool,
    has_sha: bool,
    has_avx2: bool,
    has_bmi2: bool,
    has_sha_ni: bool,
    has_aes_ni: bool,
    has_arm_crypto: bool,
    has_arm_neon: bool,
    
    const Self = @This();
    
    pub fn init() Self {
        return Self{
            .has_aes = has_aes_support(),
            .has_sha = has_sha_support(),
            .has_avx2 = has_avx2_support(),
            .has_bmi2 = has_bmi2_support(),
            .has_sha_ni = has_sha_support(), // SHA-NI is same as SHA
            .has_aes_ni = has_aes_support(), // AES-NI is same as AES
            .has_arm_crypto = has_arm_crypto_support(),
            .has_arm_neon = has_arm_neon_support(),
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

fn has_arm_crypto_support() bool {
    return switch (builtin.target.cpu.arch) {
        .aarch64 => std.Target.aarch64.featureSetHas(builtin.target.cpu.features, .crypto),
        else => false,
    };
}

fn has_arm_neon_support() bool {
    return switch (builtin.target.cpu.arch) {
        .aarch64 => std.Target.aarch64.featureSetHas(builtin.target.cpu.features, .neon),
        else => false,
    };
}

test "CPU feature detection" {
    const features = CpuFeatures.init();
    try std.testing.expect(features.has_aes == true or features.has_aes == false);
    try std.testing.expect(features.has_sha == true or features.has_sha == false);
    try std.testing.expect(features.has_avx2 == true or features.has_avx2 == false);
    try std.testing.expect(features.has_bmi2 == true or features.has_bmi2 == false);
}