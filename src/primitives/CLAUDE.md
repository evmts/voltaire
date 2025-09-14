# CLAUDE.md - Primitives Module AI Context

## MISSION CRITICAL: Fund Safety First

The primitives module contains the fundamental building blocks for all Ethereum operations. **ANY bug in address calculations, cryptographic operations, or transaction handling can result in catastrophic loss of funds.** Every primitive operation must be thoroughly tested and verified.

## Critical Implementation Details

### Memory Safety Patterns

**CRITICAL**: All allocations MUST follow strict ownership patterns:

```zig
// Pattern 1: Same scope cleanup
const data = try allocator.create(Data);
defer allocator.destroy(data);

// Pattern 2: Ownership transfer with error cleanup
const data = try allocator.create(Data);
errdefer allocator.destroy(data);
data.* = try Data.init(allocator);
return data; // Ownership transferred
```

### Address Operations - ZERO TOLERANCE FOR BUGS

**File: `address.zig`**

- **Address Format**: Exactly 20 bytes, no exceptions
- **Hex Validation**: MUST be 42 characters ("0x" + 40 hex digits)
- **Checksum Validation**: EIP-55 checksum MUST be verified for user inputs
- **Contract Address Generation**: Uses RLP encoding of (deployer_address, nonce)
- **CREATE2 Addresses**: Uses keccak256(0xff, deployer, salt, init_code_hash)

**DANGER ZONES**:
- Never trust user input without validation
- Address calculations MUST match Ethereum specification exactly
- Truncation operations must preserve the correct 20-byte address format

### Cryptographic Operations - NO SHORTCUTS

**Critical Security Requirements**:
- All hash operations MUST use Keccak256 (not SHA3)
- Signature verification requires exact ECDSA secp256k1 implementation
- Public key recovery MUST handle edge cases (invalid signatures)
- Never accept malleable signatures

### Transaction Handling - Fund Transfer Safety

**File: `transaction.zig`**

**Transaction Types** (MUST handle all correctly):
- Type 0: Legacy transactions
- Type 1: EIP-2930 (Access List)
- Type 2: EIP-1559 (Dynamic Fee)
- Type 3: EIP-4844 (Blob transactions)
- Type 4: EIP-7702 (Authorization)

**CRITICAL VALIDATIONS**:
- Chain ID replay protection
- Nonce ordering and uniqueness
- Gas limit validation (21000 minimum for transfers)
- Signature malleability checks
- Access list format validation
- Blob transaction KZG proof verification

### RLP Encoding - Serialization Correctness

**File: `rlp.zig`**

**ZERO TOLERANCE AREAS**:
- Length prefixes MUST be minimal (no leading zeros)
- List encoding MUST preserve order
- String vs list distinction is critical
- Buffer bounds checking on ALL operations

**Performance Requirements**:
- Single-pass encoding for large structures
- Streaming decode to minimize memory allocation
- Zero-copy decoding where possible

### Gas Constants - Economic Security

**File: `gas_constants.zig`**

**IMMUTABLE CONSTANTS** - Never modify these values:
- Base transaction cost: 21000 gas
- Contract creation: 32000 gas
- Storage operations follow EIP-2929 pricing
- Memory expansion costs are quadratic

**Hardfork Compatibility**:
- Gas costs change with network upgrades
- MUST maintain backward compatibility
- Track EIP implementation status

## Debugging Strategies

### Memory Issues
1. Enable allocator debugging: `std.testing.allocator`
2. Check for double-free with `defer/errdefer` patterns
3. Use sanitizers for memory corruption detection

### Cryptographic Failures
1. Test vector validation against known good implementations
2. Cross-reference with EIP specifications
3. Differential testing against revm/geth

### Transaction Validation Errors
1. Check transaction type enumeration
2. Verify signature recovery matches sender
3. Validate all transaction fields individually

## Testing Requirements

### Unit Tests MUST Cover:
- **Address**: All conversion functions, edge cases, invalid inputs
- **Crypto**: Test vectors from EIP specifications
- **RLP**: Malformed input handling, large data sets
- **Transaction**: All transaction types, invalid signatures
- **Numeric**: Overflow conditions, unit conversions

### Differential Testing:
- Compare outputs with revm for identical inputs
- Test against official Ethereum test vectors
- Cross-validate with other EVM implementations

## Performance Considerations

### Hot Paths (Optimize First):
1. Address to/from hex conversion
2. RLP encoding/decoding
3. Hash operations (Keccak256)
4. Signature verification
5. Transaction validation

### Memory Allocation Strategy:
- Pre-allocate known-size buffers
- Reuse allocators for batch operations
- Arena allocation for temporary data
- Stack allocation for small, fixed-size data

### CPU-Intensive Operations:
- Batch cryptographic operations
- Use SIMD for large data processing
- Cache expensive calculations
- Lazy evaluation for unused fields

## Error Handling Patterns

### Critical Errors (Abort Execution):
- Memory allocation failures
- Cryptographic operation failures
- Invalid transaction signatures
- Gas limit exceeded

### Recoverable Errors (Return Error):
- Invalid input format
- Parsing failures
- Validation errors
- Network-level failures

## Security Considerations

### Input Validation:
- NEVER trust external input
- Validate all hex strings
- Check address formats
- Verify signature components are in valid ranges

### Side-Channel Attacks:
- Constant-time operations for sensitive data
- Avoid timing attacks in signature verification
- Clear sensitive data from memory after use

### Integer Overflow Protection:
- Use overflow-checked arithmetic
- Validate range before conversions
- Test edge cases (0, max values)

## Integration Points

### Dependencies:
- `crypto` module for hash operations
- `std.crypto` for signature verification
- Memory allocators for dynamic data

### Used By:
- EVM execution engine
- Transaction pool validation
- Block processing
- State management
- Network protocol handling

## Common Pitfalls

1. **Hex String Handling**: Always validate "0x" prefix and even length
2. **Address Checksum**: User addresses should be checksummed (EIP-55)
3. **RLP Edge Cases**: Empty strings vs empty lists have different encodings
4. **Gas Calculations**: Account for all gas costs including intrinsic gas
5. **Signature Malleability**: Reject high-s value signatures (EIP-2)

## Emergency Procedures

### Critical Bug Discovery:
1. Immediately halt all operations
2. Document the bug with reproduction steps
3. Assess impact on fund safety
4. Implement fix with comprehensive testing
5. Verify fix against all known test vectors

### Performance Regression:
1. Profile to identify bottleneck
2. Implement fix maintaining correctness
3. Benchmark against baseline
4. Deploy with monitoring

Remember: **Correctness first, performance second.** A fast but incorrect implementation can lose millions of dollars.