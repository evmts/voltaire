# Guillotine EVM Python Bindings

Python bindings for the Guillotine EVM - a high-performance Ethereum Virtual Machine implementation written in Zig.

## Features

- **High Performance**: Direct bindings to the optimized Zig EVM implementation
- **Type Safety**: Full Python type hints and runtime type checking
- **Comprehensive API**: Support for EVM execution, state management, and primitives
- **Cross Platform**: Works on Linux, macOS, and Windows
- **Memory Safe**: Proper memory management and cleanup

## Installation

```bash
pip install guillotine-evm
```

## Quick Start

```python
from guillotine_evm import EVM, Address, U256

# Create an EVM instance
evm = EVM()

# Create addresses and values
from_addr = Address.from_hex("0x1234567890123456789012345678901234567890")
to_addr = Address.from_hex("0x0987654321098765432109876543210987654321") 
value = U256.from_int(1000)

# Execute bytecode
bytecode = bytes.fromhex("6001600101")  # Simple addition: PUSH1 1 PUSH1 1 ADD
result = evm.execute(
    bytecode=bytecode,
    caller=from_addr,
    value=value,
    gas_limit=100000
)

print(f"Success: {result.success}")
print(f"Gas used: {result.gas_used}")
print(f"Return data: {result.return_data.hex()}")
```

## API Overview

### Core Components

- **EVM**: Main execution engine
- **Primitives**: Core Ethereum types (Address, U256, Hash, etc.)
- **Compilers**: Solidity/Vyper compilation utilities
- **State**: Blockchain state management

### EVM Package

```python
from guillotine_evm.evm import EVM, ExecutionResult

evm = EVM()
result = evm.execute(bytecode, caller, value, gas_limit)
```

### Primitives Package

```python
from guillotine_evm.primitives import Address, U256, Hash

# Create primitives
addr = Address.from_hex("0x...")
value = U256.from_int(42)
hash_val = Hash.from_hex("0x...")
```

### Compilers Package

```python
from guillotine_evm.compilers import compile_solidity

# Compile Solidity code
contract = compile_solidity("""
pragma solidity ^0.8.0;
contract SimpleStorage {
    uint256 value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
""")
```

## Development

### Setup

```bash
# Clone the repository
git clone https://github.com/evmts/guillotine.git
cd guillotine/src/guillotine-py

# Install development dependencies
pip install -e ".[dev]"

# Run tests
pytest

# Run type checking
mypy guillotine_evm

# Format code
black guillotine_evm tests
```

### Building from Source

The Python bindings require the Guillotine EVM library to be built first:

```bash
# Build the main project
cd ../..
zig build

# Build Python bindings
cd src/guillotine-py
python -m build
```

## Architecture

The Python bindings use CFFI to interface with the native Guillotine EVM library:

```
Python API (guillotine_evm)
    ↓
CFFI Bindings (guillotine_evm._ffi)
    ↓
C FFI Layer (evm_c.zig, primitives_c.zig)
    ↓
Guillotine EVM Core (Zig)
```

## Performance

Guillotine EVM is designed for high performance:

- Zero-copy data structures where possible
- Minimal Python object allocation
- Direct memory access for large data
- Optimized for both single operations and batch processing

## License

MIT License - see the LICENSE file for details.

## Contributing

Contributions are welcome! Please see the main project's CONTRIBUTING.md for guidelines.