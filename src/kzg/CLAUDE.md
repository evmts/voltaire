# CLAUDE.md - KZG Module AI Context

## MISSION CRITICAL: KZG Polynomial Commitments for EIP-4844

The KZG module implements KZG polynomial commitments for EIP-4844 blob transactions. **ANY error in KZG operations can enable invalid blob data or consensus failures.** KZG cryptography must be implemented with perfect specification compliance.

## Critical Implementation Details

### KZG Commitment Scheme (EIP-4844)
- **Polynomial Commitments**: Cryptographic commitments to blob data polynomials
- **Point Evaluation Proofs**: Verify polynomial evaluations without revealing data
- **BLS12-381 Curve**: Specific elliptic curve for KZG operations
- **Trusted Setup**: Pre-computed parameters for KZG ceremony

### Key Responsibilities
- **Blob Commitment**: Generate KZG commitments for blob data
- **Proof Verification**: Validate KZG proofs for blob transactions
- **Polynomial Operations**: Evaluate polynomials at specific points
- **Curve Operations**: BLS12-381 elliptic curve arithmetic
- **Field Arithmetic**: Operations in the BLS12-381 scalar field

### Critical KZG Operations
```zig
// Blob to KZG commitment conversion
pub fn blob_to_kzg_commitment(blob: *const Blob) !KzgCommitment {
    const polynomial = blob_to_polynomial(blob);
    return compute_kzg_commitment(polynomial);
}

// KZG proof computation for point evaluation
pub fn compute_kzg_proof(
    blob: *const Blob,
    z: BlsScalar,
) !struct { KzgProof, BlsScalar } {
    const polynomial = blob_to_polynomial(blob);
    const y = evaluate_polynomial(polynomial, z);
    const proof = compute_quotient_polynomial_proof(polynomial, z, y);
    return .{ proof, y };
}
```

### BLS12-381 Curve Operations
- **G1 Group**: Base group for commitments and proofs
- **G2 Group**: Extended group for trusted setup parameters
- **Pairing Operations**: Bilinear pairing for proof verification
- **Field Arithmetic**: Modular operations in prime fields
- **Point Validation**: Ensure all points are valid curve elements

### Critical Safety Requirements
- Validate all BLS12-381 points are on curve and in correct subgroup
- Ensure scalar values are within valid field range
- Implement constant-time operations to prevent side-channel attacks
- Verify trusted setup parameters are authentic and correctly formatted
- Handle point-at-infinity cases correctly

### Polynomial Operations
```zig
// Convert blob data to polynomial coefficients
fn blob_to_polynomial(blob: *const Blob) [FIELD_ELEMENTS_PER_BLOB]BlsScalar {
    var coeffs: [FIELD_ELEMENTS_PER_BLOB]BlsScalar = undefined;
    for (blob.data, 0..) |chunk, i| {
        coeffs[i] = bytes_to_bls_field(chunk);
    }
    return coeffs;
}

// Evaluate polynomial at given point using Horner's method
fn evaluate_polynomial(coeffs: []const BlsScalar, x: BlsScalar) BlsScalar {
    var result = BlsScalar.zero();
    for (coeffs) |coeff| {
        result = result.mul(x).add(coeff);
    }
    return result;
}
```

### Trusted Setup Integration
- **Powers of Tau**: G1 and G2 generator powers from ceremony
- **Setup Validation**: Verify setup parameters are consistent
- **Parameter Loading**: Efficient loading and caching of setup data
- **Security Validation**: Ensure setup wasn't compromised

### Performance Optimization
- **Multi-Scalar Multiplication**: Efficient computation of linear combinations
- **Precomputed Tables**: Cache frequently used curve points
- **Parallel Operations**: Leverage multiple CPU cores for batch operations
- **Memory Management**: Efficient allocation for large polynomial operations

### Security Considerations
- **Constant-Time Operations**: Prevent timing side-channel attacks
- **Point Validation**: Ensure all curve points are valid and in correct subgroup
- **Field Validation**: Verify all scalars are within valid range
- **Setup Authenticity**: Validate trusted setup parameters
- **Proof Verification**: Rigorous validation of all KZG proofs

### Testing Requirements
- Test against official KZG test vectors
- Validate curve operations with known test cases
- Property-based testing for polynomial operations
- Fuzz testing with malformed inputs
- Performance benchmarking against reference implementations

### Error Handling
```zig
pub const KzgError = error{
    InvalidBlob,
    InvalidCommitment,
    InvalidProof,
    InvalidPoint,
    InvalidScalar,
    TrustedSetupError,
    PolynomialError,
};

// Always validate inputs before processing
pub fn verify_kzg_proof(
    commitment: *const KzgCommitment,
    z: BlsScalar,
    y: BlsScalar,
    proof: *const KzgProof,
) KzgError!bool {
    // Validate all inputs are well-formed
    if (!commitment.is_valid() or !proof.is_valid()) {
        return KzgError.InvalidPoint;
    }

    if (!z.is_valid() or !y.is_valid()) {
        return KzgError.InvalidScalar;
    }

    // Perform pairing-based verification
    return verify_pairing_equation(commitment, z, y, proof);
}
```

### Emergency Procedures
- **Invalid Proof Detection**: Handle malformed or invalid KZG proofs
- **Setup Parameter Corruption**: Detect and recover from corrupted trusted setup
- **Cryptographic Failures**: Graceful handling of curve operation failures
- **Memory Exhaustion**: Handle large polynomial operations safely
- **Consensus Divergence**: Detect and report KZG-related consensus issues

Remember: **KZG commitments are cryptographic security primitives.** Any implementation error can compromise the security of blob transactions and enable data availability attacks. Perfect specification compliance is mandatory.