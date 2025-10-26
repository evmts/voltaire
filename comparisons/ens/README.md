# ENS Utilities Benchmarks

Benchmarks for Ethereum Name Service (ENS) utility functions comparing guil (@tevm/primitives), ethers, and viem implementations.

## Overview

ENS (Ethereum Name Service) provides human-readable names for Ethereum addresses. This benchmark suite compares the performance of core ENS utility functions across three popular libraries.

## Functions

### namehash

Computes the ENS namehash for a given domain name. The namehash is a deterministic way to convert human-readable names into node identifiers used in ENS contracts.

**Algorithm**: Recursively applies keccak256 hashing to domain labels, starting from the root.

**Test Case**: `"vitalik.eth"`

**Implementations**:
- **Guil**: Not implemented (uses viem as fallback)
- **Ethers**: `ethers.namehash(name)`
- **Viem**: `namehash(name)` from `viem/ens`

### labelhash

Computes the keccak256 hash of a single ENS label. This is used as a building block for namehash computation.

**Algorithm**: Direct keccak256 hash of the UTF-8 encoded label.

**Test Case**: `"vitalik"`

**Implementations**:
- **Guil**: Not implemented (uses viem as fallback)
- **Ethers**: `ethers.id(label)` (keccak256 text hashing)
- **Viem**: `labelhash(label)` from `viem/ens`

### normalize

Normalizes an ENS name according to ENSIP-15 (ENS Name Normalization Standard). This ensures consistent handling of unicode characters, case sensitivity, and invalid characters.

**Algorithm**: Applies ENSIP-15 normalization rules including NFD normalization, case folding, and validation.

**Test Case**: `"Vitalik.eth"` (tests case normalization)

**Implementations**:
- **Guil**: Not implemented (uses viem as fallback)
- **Ethers**: `ethers.ensNormalize(name)`
- **Viem**: `normalize(name)` from `viem/ens`

## Implementation Notes

### Guil (@tevm/primitives)

ENS utilities are not currently implemented in guil. For benchmarking purposes, these tests use viem as a fallback. This means guil benchmark results will be identical to viem results.

### Ethers

Provides comprehensive ENS support with dedicated functions:
- `ethers.namehash()` for namehash computation
- `ethers.id()` for labelhash (general keccak256 text hashing)
- `ethers.ensNormalize()` for ENSIP-15 normalization

### Viem

Provides full ENS support through the `viem/ens` module with specialized functions for each operation:
- `namehash()` for namehash computation
- `labelhash()` for single label hashing
- `normalize()` for ENSIP-15 normalization

## Usage

Run all ENS benchmarks:

```bash
bun run vitest bench comparisons/ens/ --run
```

Run individual benchmarks:

```bash
# Namehash benchmark
bun run vitest bench comparisons/ens/namehash.bench.ts --run

# Labelhash benchmark
bun run vitest bench comparisons/ens/labelhash.bench.ts --run

# Normalize benchmark
bun run vitest bench comparisons/ens/normalize.bench.ts --run
```

## Test Data

All benchmarks use consistent test data:

- **Namehash**: `"vitalik.eth"` - Simple two-label ENS name
- **Labelhash**: `"vitalik"` - Single label
- **Normalize**: `"Vitalik.eth"` - Mixed case for normalization testing

Additional test cases that could be used:
- Subdomains: `"sub.vitalik.eth"`
- Unicode names: `"Āгрой.eth"`
- Root: `"eth"`
- Empty string: `""`

## References

- [ENSIP-15: ENS Name Normalization](https://docs.ens.domains/ensip/15)
- [ENS Documentation](https://docs.ens.domains/)
- [EIP-137: Ethereum Domain Name Service](https://eips.ethereum.org/EIPS/eip-137)
