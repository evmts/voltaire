# Official EVM Benchmarks

This directory contains a comprehensive benchmarking suite for comparing EVM implementations across different languages. The benchmarks are designed to measure real-world performance using standardized test cases.

## Overview

The benchmarking system uses [hyperfine](https://github.com/sharkdp/hyperfine) to measure execution times across multiple EVM implementations:

- **Guillotine (Zig)** - Our high-performance Zig implementation
- **REVM (Rust)** - Reference Rust implementation
- **EthereumJS (JavaScript)** - JavaScript implementation running on Bun
- **Geth (Go)** - Official Go-Ethereum implementation
- **evmone (C++)** - Fast C++ implementation

## Structure

```
bench/official/
├── src/                    # Benchmark orchestrator source
│   ├── main.zig           # CLI entry point
│   └── Orchestrator.zig   # Benchmark execution logic
├── src/evm/fixtures/     # Test cases with bytecode and calldata
│   ├── erc20-approval-transfer/
│   ├── erc20-mint/
│   ├── erc20-transfer/
│   ├── snailtracer/
│   └── ten-thousand-hashes/
├── evms/                  # EVM implementation runners
│   ├── zig/              # Guillotine runner
│   ├── revm/             # Rust REVM runner
│   ├── ethereumjs/       # JavaScript runner
│   ├── geth/             # Go-Ethereum runner
│   └── evmone/           # C++ evmone runner
└── results.md            # Benchmark results (auto-generated)
```

## Prerequisites

1. **Install hyperfine**:
   ```bash
   # macOS
   brew install hyperfine
   
   # Linux/Other
   cargo install hyperfine
   ```

2. **Build the Guillotine project**:
   ```bash
   cd ../..  # Go to project root
   zig build build-evm-runner
   ```

3. **Build other EVM runners** (optional, for comparison):
   ```bash
   # REVM (Rust)
   cd evms/revm && cargo build --release
   
   # EthereumJS
   cd evms/ethereumjs && bun install
   
   # Geth
   cd evms/geth && go build -o geth-runner runner.go
   
   # evmone
   cd evms/evmone && mkdir build && cd build && cmake .. && make
   ```

## Running Benchmarks

### Single EVM Benchmark

Run benchmarks for a specific EVM implementation:

```bash
# From project root
zig-out/bin/orchestrator --evm zig --num-runs 50
```

### Compare All EVMs

Compare performance across all available implementations:

```bash
# From project root
zig-out/bin/orchestrator --compare --export markdown
```

This generates a comprehensive comparison in `bench/official/results.md`.

### Running Individual Test Cases

You can also run specific test cases directly:

```bash
hyperfine --runs 10 --warmup 3 \
  "zig-out/bin/evm-runner --contract-code-path src/evm/fixtures/ten-thousand-hashes/bytecode.txt --calldata 0x30627b7c"
```

## Test Cases

### ERC20 Operations
- **erc20-transfer**: Standard ERC20 token transfer
- **erc20-mint**: Token minting operation
- **erc20-approval-transfer**: Approval followed by transferFrom

### Computational Benchmarks
- **ten-thousand-hashes**: Performs 10,000 keccak256 operations
- **snailtracer**: Complex computational workload

## Understanding Results

Benchmark results include:
- **Mean**: Average execution time
- **Median**: Middle value (less affected by outliers)
- **Min/Max**: Best and worst case times
- **Std Dev**: Consistency measure (lower = more consistent)

All times are in milliseconds (ms). Lower values indicate better performance.

## How It Works

1. **Test Discovery**: The orchestrator scans the `src/evm/fixtures/` directory for test cases
2. **Runner Execution**: Each EVM runner executes the bytecode with provided calldata
3. **Timing**: Hyperfine measures execution time with statistical accuracy
4. **Results**: Performance data is collected and formatted for analysis

### Runner Protocol

All EVM runners follow the same command-line interface:
```
runner --contract-code-path <path> --calldata <hex> --num-runs <n>
```

Each runner:
1. Deploys the contract bytecode
2. Executes the contract with the provided calldata
3. Outputs execution time for each run
4. Returns non-zero on failure

## Adding New Test Cases

To add a new benchmark test case:

1. Create a directory under `src/evm/fixtures/` with a descriptive name
2. Add two files:
   - `bytecode.txt`: Hex-encoded contract bytecode
   - `calldata.txt`: Hex-encoded calldata for the contract call
3. Run the benchmarks - the orchestrator will automatically discover it

## Development

To modify the benchmark system:

- **Orchestrator logic**: Edit `bench/src/Orchestrator.zig`
- **CLI interface**: Edit `bench/src/main.zig`
- **EVM runners**: Edit files in `evms/*/`

Remember to rebuild after changes:
```bash
zig build build-orchestrator

### JavaScript Runtime

EthereumJS can be run on Bun (default) or Node. Choose via orchestrator flag or environment variable:

```bash
# Node runtime
zig-out/bin/orchestrator --evm ethereumjs --js-runtime node --num-runs 1 --internal-runs 1

# Bun runtime (default)
zig-out/bin/orchestrator --evm ethereumjs --num-runs 1 --internal-runs 1

# With perf-fastest.sh
JS_RUNTIME=node ./scripts/perf-fastest.sh
```
```
