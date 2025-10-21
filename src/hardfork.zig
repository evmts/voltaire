/// Ethereum hardfork versions
///
/// This enum represents major Ethereum network hardforks that introduced
/// significant protocol changes affecting precompiles, gas costs, and opcodes.
pub const Hardfork = enum {
    /// Frontier (2015-07-30) - Genesis Ethereum release
    /// Precompiles: 0x01-0x04 (ECRECOVER, SHA256, RIPEMD160, IDENTITY)
    Frontier,

    /// Homestead (2016-03-14) - EIP-2, EIP-7, EIP-8
    /// Added signature malleability protection
    Homestead,

    /// Byzantium (2017-10-16) - EIP-196, EIP-197, EIP-198
    /// Added precompiles: 0x05-0x08 (MODEXP, ECADD, ECMUL, ECPAIRING)
    /// BN254 operations for zkSNARK support
    Byzantium,

    /// Istanbul (2019-12-08) - EIP-152, EIP-1108
    /// Added precompile: 0x09 (BLAKE2F)
    /// Reduced gas costs for BN254 operations
    Istanbul,

    /// Cancun (2024-03-13) - EIP-4844
    /// Added precompile: 0x0A (POINT_EVALUATION)
    /// KZG point evaluation for blob transactions
    Cancun,

    /// Prague (Future) - EIP-2537
    /// Added precompiles: 0x0B-0x13 (BLS12-381 operations)
    /// G1/G2 addition, multiplication, MSM, pairing, and mapping
    Prague,
};
