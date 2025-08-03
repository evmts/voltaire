const Fp = @import("Fp.zig");
const Fp2 = @import("Fp2.zig");
const Fp6 = @import("Fp6.zig");
const G1 = @import("g1.zig");
const G2 = @import("g2.zig");

//This file contains parameters and precomputed values for the BN254 curve.

// Field moduli
pub const FP_MOD = 0x30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47;
pub const FR_MOD = 0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001;

// Mathematical constants used in tower field arithmetic
pub const XI = Fp2{ .u0 = Fp{ .value = 9 }, .u1 = Fp{ .value = 1 } }; // ξ = 9 + u, used in Fp6 and G2 arithmetic
pub const V = Fp6{ .v0 = Fp2{ .u0 = Fp{ .value = 0 }, .u1 = Fp{ .value = 0 } }, .v1 = Fp2{ .u0 = Fp{ .value = 1 }, .u1 = Fp{ .value = 0 } }, .v2 = Fp2{ .u0 = Fp{ .value = 0 }, .u1 = Fp{ .value = 0 } } }; // v  used in Fp12 arithmetic

// G1 generator point
pub const G1_GENERATOR = G1{ .x = Fp{ .value = 1 }, .y = Fp{ .value = 2 }, .z = Fp{ .value = 1 } };
pub const G1_INFINITY = G1{ .x = Fp{ .value = 0 }, .y = Fp{ .value = 1 }, .z = Fp{ .value = 0 } };

// G2 generator point
pub const G2_GENERATOR = G2{ .x = Fp2{ .u0 = Fp{ .value = 0x1800deef121f1e76426a00665e5c4479674322d4f75edadd46debd5cd992f6ed }, .u1 = Fp{ .value = 0x198e9393920d483a7260bfb731fb5d25f1aa493335a9e71297e485b7aef312c2 } }, .y = Fp2{ .u0 = Fp{ .value = 0x12c85ea5db8c6deb4aab71808dcb408fe3d1e7690c43d37b4ce6cc0166fa7daa }, .u1 = Fp{ .value = 0x90689d0585ff075ec9e99ad690c3395bc4b313370b38ef355acdadcd122975b } }, .z = Fp2{ .u0 = Fp{ .value = 1 }, .u1 = Fp{ .value = 0 } } };
pub const G2_INFINITY = G2{ .x = Fp2{ .u0 = Fp{ .value = 0 }, .u1 = Fp{ .value = 0 } }, .y = Fp2{ .u0 = Fp{ .value = 1 }, .u1 = Fp{ .value = 0 } }, .z = Fp2{ .u0 = Fp{ .value = 0 }, .u1 = Fp{ .value = 0 } } };

// Frobenius coefficients for Fp6
pub const FROBENIUS_COEFF_FP6_V1 = Fp2{ .u0 = Fp{ .value = 0x2fb347984f7911f74c0bec3cf559b143b78cc310c2c3330c99e39557176f553d }, .u1 = Fp{ .value = 0x16c9e55061ebae204ba4cc8bd75a079432ae2a1d0b7c9dce1665d51c640fcba2 } };
pub const FROBENIUS_COEFF_FP6_V2 = Fp2{ .u0 = Fp{ .value = 0x5b54f5e64eea80180f3c0b75a181e84d33365f7be94ec72848a1f55921ea762 }, .u1 = Fp{ .value = 0x2c145edbe7fd8aee9f3a80b03b0b1c923685d2ea1bdec763c13b4711cd2b8126 } };

// Frobenius coefficients for G2
pub const FROBENIUS_G2_X_COEFF = Fp2{ .u0 = Fp{ .value = 0x2fb347984f7911f74c0bec3cf559b143b78cc310c2c3330c99e39557176f553d }, .u1 = Fp{ .value = 0x16c9e55061ebae204ba4cc8bd75a079432ae2a1d0b7c9dce1665d51c640fcba2 } };
pub const FROBENIUS_G2_Y_COEFF = Fp2{ .u0 = Fp{ .value = 0x63cf305489af5dcdc5ec698b6e2f9b9dbaae0eda9c95998dc54014671a0135a }, .u1 = Fp{ .value = 0x7c03cbcac41049a0704b5a7ec796f2b21807dc98fa25bd282d37f632623b0e3 } };

// Frobenius coefficients for Fp12
pub const FROBENIUS_COEFF_FP12 = Fp6{
    .v0 = Fp2{ .u0 = Fp{ .value = 0x1284b71c2865a7dfe8b99fdd76e68b605c521e08292f2176d60b35dadcc9e470 }, .u1 = Fp{ .value = 0x246996f3b4fae7e6a6327cfe12150b8e747992778eeec7e5ca5cf05f80f362ac } },
    .v1 = Fp2{ .u0 = Fp{ .value = 0 }, .u1 = Fp{ .value = 0 } },
    .v2 = Fp2{ .u0 = Fp{ .value = 0 }, .u1 = Fp{ .value = 0 } },
};
