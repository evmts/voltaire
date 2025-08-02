const std = @import("std");

pub const Fp = @import("bn254/Fp.zig").Fp;
pub const Fp2 = @import("bn254/Fp2.zig").Fp2;
pub const Fp6 = @import("bn254/Fp6.zig").Fp6;
pub const Fp12 = @import("bn254/Fp12.zig").Fp12;
pub const Fr = @import("bn254/Fr.zig").Fr;

pub const FP_MOD = Fp.FP_MOD;
pub const FR_MOD = Fr.FR_MOD;
pub const G1 = @import("bn254/g1.zig").G1;
pub const G2 = @import("bn254/g2.zig").G2;
pub const pairing = @import("bn254/pairing.zig").pairing;
