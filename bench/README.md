# Benchmarks

Performance benchmarks for the Guillotine EVM implementation using [zBench](https://github.com/hendriknielaender/zBench).

## Running Benchmarks

```bash
zig build bench
```

## Benchmark Categories

- **EVM Core**: VM execution, opcode dispatch, frame management
- **Operations**: Individual opcode performance (arithmetic, stack, memory, storage)
- **Precompiles**: Built-in contract execution times
- **State**: Database operations, journaling, state transitions
- **Specialized**: EIP-4844 blob transactions, access lists, gas calculations
- **Integration**: Comprehensive scenarios and Solidity contract execution