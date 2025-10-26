# Primitives Benchmark Files

This directory contains benchmark files for all major public methods in the primitives module. Each benchmark file is a minimal executable that calls a specific method with realistic test data.

## Usage

These benchmark files are designed to be used with bundle size analysis tools. Each file:
- Imports only the `primitives` module
- Has a `main()` function that calls the target method
- Uses the `_ = result` pattern to avoid unused variable warnings
- Uses minimal code (just the method call with test data)

## Running Benchmarks

The repository provides two types of benchmarks:

### 1. Bundle Size Benchmarks (bench/*.zig)

These are minimal executables for WASM bundle size analysis. Build all benchmarks:

```bash
zig build  # Builds all benchmarks to zig-out/bin/bench-*
```

Filter specific benchmarks:

```bash
zig build -Dbench-filter=address  # Only address benchmarks
zig build -Dbench-filter=keccak   # Only keccak benchmarks
```

### 2. Performance Benchmarks (src/**/*.bench.zig)

These use the zbench framework for detailed performance measurement. Run all performance benchmarks:

```bash
zig build bench  # Runs all zbench performance benchmarks
```

Filter specific benchmarks:

```bash
zig build bench -Dfilter=keccak   # Only keccak performance benchmarks
zig build bench -Dfilter=address  # Only address performance benchmarks
zig build bench -Dfilter=secp     # Only secp256k1 benchmarks
```

The benchmark output includes:
- Average time per operation
- Operations per second
- Statistical analysis (min, max, median, standard deviation)
- Memory allocation tracking (if enabled in benchmark source)

**Note**: Benchmark iterations and warmup are configured in the benchmark source files themselves via zbench Config. See individual .bench.zig files for configuration details.

## Benchmark Files by Category

### Address Operations (14 benchmarks)

- **address_from_hex.zig** - Parse hex string to Address
- **address_to_hex.zig** - Convert Address to hex string
- **address_to_checksum_hex.zig** - Convert Address to checksummed hex (EIP-55)
- **address_is_valid.zig** - Validate hex address string format
- **address_to_u256.zig** - Convert Address to u256
- **address_from_u256.zig** - Convert u256 to Address
- **address_equals.zig** - Compare two addresses for equality
- **address_is_zero.zig** - Check if address is zero address
- **address_from_bytes.zig** - Create Address from raw bytes
- **address_from_public_key.zig** - Derive Address from public key coordinates
- **address_calculate_create.zig** - Calculate CREATE contract address
- **address_calculate_create2.zig** - Calculate CREATE2 contract address (with allocator)
- **address_get_create2.zig** - Calculate CREATE2 contract address (no allocator)

### Hex Encoding/Decoding (12 benchmarks)

- **hex_is_hex.zig** - Validate hex string format
- **hex_to_bytes.zig** - Convert hex string to bytes (dynamic)
- **hex_bytes_to_hex.zig** - Convert bytes to hex string (dynamic)
- **hex_to_bytes_fixed.zig** - Convert hex string to fixed-size byte array
- **hex_bytes_to_hex_fixed.zig** - Convert fixed-size bytes to hex string
- **hex_to_u256.zig** - Parse hex string to u256
- **hex_u256_to_hex.zig** - Convert u256 to hex string
- **hex_pad_left.zig** - Pad bytes on the left with zeros
- **hex_concat.zig** - Concatenate multiple byte arrays
- **hex_trim_left_zeros.zig** - Remove leading zero bytes

### RLP Encoding/Decoding (5 benchmarks)

- **rlp_encode_bytes.zig** - RLP encode a byte string
- **rlp_encode_list.zig** - RLP encode a list of strings
- **rlp_encode_integer.zig** - RLP encode an integer
- **rlp_decode_bytes.zig** - RLP decode bytes
- **rlp_decode_list.zig** - RLP decode a list

### ABI Operations (1 benchmark)

- **abi_compute_selector.zig** - Compute function selector from signature

### Numeric Conversions (8 benchmarks)

- **numeric_parse_ether.zig** - Parse ether string to wei
- **numeric_parse_gwei.zig** - Parse gwei string to wei
- **numeric_format_ether.zig** - Format wei value as ether string
- **numeric_format_gwei.zig** - Format wei value as gwei string
- **numeric_convert_units.zig** - Convert between units (e.g., ether to gwei)
- **numeric_calculate_gas_cost.zig** - Calculate gas cost in wei
- **numeric_safe_add.zig** - Safe addition with overflow check
- **numeric_safe_mul.zig** - Safe multiplication with overflow check
- **numeric_calculate_percentage.zig** - Calculate percentage of a value

### Transaction Operations (4 benchmarks)

- **transaction_encode_legacy.zig** - Encode legacy transaction for signing
- **transaction_encode_eip1559.zig** - Encode EIP-1559 transaction for signing
- **transaction_detect_type.zig** - Detect transaction type from raw data
- **transaction_compute_hash.zig** - Compute transaction hash

### Cryptographic Operations (2 benchmarks)

- **keccak256.zig** - Compute Keccak-256 hash
- **secp256k1_public_key.zig** - Secp256k1 public key operations

## Total: 44 Benchmark Files

These benchmarks cover the most commonly used operations in the primitives module that users would care about for bundle size analysis.
