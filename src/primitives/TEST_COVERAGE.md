# Primitives Test Coverage

This document lists all the unit tests that have been adapted from the ox and viem TypeScript/JavaScript packages to Zig.

## Tests Implemented

### Core Functionality Tests

1. **abi_encoding_test.zig** - ABI encoding/decoding tests
   - uint/int encoding (various sizes)
   - Address encoding
   - Boolean encoding
   - String encoding
   - Bytes encoding
   - Array encoding
   - Function selector generation
   - Error decoding

2. **hash_utils_test.zig** - Hash utility tests
   - Keccak256 hashing
   - SHA256 hashing
   - EIP-191 message hashing
   - Zero hash constants
   - Hash comparisons

3. **hex_test.zig** - Hex encoding/decoding tests
   - to_hex conversion
   - from_hex conversion
   - is_hex validation
   - Error handling for invalid hex

4. **address_test.zig** - Address utility tests
   - Address validation
   - EIP-55 checksum encoding/validation
   - Zero address checks
   - Address comparisons
   - From public key derivation

5. **crypto_test.zig** - Cryptographic operation tests
   - Private key generation
   - Public key derivation
   - Address derivation
   - Message signing (personal_sign)
   - Signature verification
   - Key validation

### Transaction Tests

6. **transaction_test.zig** - Transaction encoding/signing tests
   - Legacy transaction encoding
   - EIP-1559 transaction encoding
   - EIP-2930 access list transactions
   - EIP-4844 blob transactions
   - Transaction signing
   - Hash calculation

7. **event_log_test.zig** - Event log parsing tests
   - Event signature generation
   - Log parsing with indexed parameters
   - ERC20 Transfer event
   - ERC721 Transfer event
   - Complex event decoding

### Advanced Features

8. **signature_test.zig** - Signature recovery/verification tests
   - ECDSA signature recovery
   - Message signature verification
   - Signature malleability checks
   - EIP-155 chain ID extraction
   - Compact signature format
   - EIP-712 typed data signatures

9. **ens_test.zig** - Ethereum Name Service tests
   - ENS namehash algorithm
   - Label hashing
   - DNS encoding
   - Reverse resolution
   - Label validation
   - Content hash decoding
   - Wildcard resolution

10. **units_test.zig** - Ethereum unit conversion tests
    - Parse ether (decimal string to wei)
    - Parse gwei
    - Format ether (wei to decimal string)
    - Format gwei
    - Gas price conversions
    - Roundtrip conversions

### EIP-Specific Tests

11. **contract_address_test.zig** - Contract address generation tests
    - CREATE opcode address calculation
    - CREATE2 deterministic addresses
    - Nonce-based addressing
    - Salt-based addressing
    - Factory pattern tests
    - Minimal proxy predictions

12. **access_list_test.zig** - EIP-2930 access list tests
    - Access list gas calculations
    - Address/storage key membership
    - RLP encoding
    - Gas savings calculations
    - Deduplication

13. **blob_test.zig** - EIP-4844 blob transaction tests
    - Versioned hash creation
    - Blob gas price calculations
    - Excess blob gas calculations
    - Blob transaction validation
    - Blob sidecars
    - Economics simulations

14. **siwe_test.zig** - Sign-In with Ethereum (EIP-4361) tests
    - SIWE message formatting
    - Message validation
    - Signature verification
    - Message parsing
    - Optional field handling

15. **authorization_test.zig** - EIP-7702 authorization list tests
    - Authorization creation
    - Authority recovery
    - Authorization validation
    - RLP encoding
    - Delegation designations
    - Gas cost calculations

## Test Coverage Summary

- **Total test files created**: 15
- **Approximate test cases**: 200+
- **EIPs covered**: EIP-55, EIP-155, EIP-191, EIP-712, EIP-1559, EIP-2718, EIP-2930, EIP-4361, EIP-4844, EIP-7702

## Notes

1. All tests follow the "no abstractions" philosophy as specified in CLAUDE.md
2. Tests are self-contained with inline setup and assertions
3. Memory management follows Zig best practices with proper defer statements
4. Tests cover both positive and negative cases
5. Edge cases and error conditions are thoroughly tested

## Running Tests

To run all tests:
```bash
zig build test
```

To run specific test categories:
```bash
zig build test-primitives  # If configured in build.zig
```