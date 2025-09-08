# Guillotine EVM Python Bindings

> Experimental/PoC: This SDK is a vibecoded proof-of-concept. APIs are unstable and may change. We're looking for early users to try it and tell us what APIs you want — please open an issue or ping us on Telegram.

📚 **[View Full Documentation](https://guillotine.dev/sdks/python)**

## Status

- Maturity: Experimental proof‑of‑concept
- API stability: Unstable; breaking changes expected
- Feedback: https://github.com/evmts/Guillotine/issues or Telegram https://t.me/+ANThR9bHDLAwMjUx

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

## Quick Start (Bun-parity API)

```python
from guillotine_evm import EVM, BlockInfo, CallType, CallParams

evm = EVM(BlockInfo(
    number=1,
    timestamp=1,
    gas_limit=30_000_000,
    coinbase="0x" + "00" * 20,
    base_fee=1_000_000_000,
    chain_id=1,
))

caller = "0x" + "11" * 20
to = "0x" + "22" * 20
evm.set_balance(caller, 10**18)

def push32_return_bytes(data: bytes) -> bytes:
    assert len(data) == 32
    return bytes([0x7F]) + data + bytes([0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3])

ret = (b"\x00" * 31) + b"\x2a"
evm.set_code(to, push32_return_bytes(ret))

result = evm.call(CallParams(
    caller=caller,
    to=to,
    value=0,
    input=b"",
    gas=100_000,
    call_type=CallType.CALL,
))

print("Success:", result.success)
print("Gas left:", result.gas_left)
print("Output:", result.output.hex())

evm.destroy()
```

## API Overview

### Core Components

- **EVM**: Main execution engine
- **Primitives**: Core Ethereum types (Address, U256, Hash, etc.)
- **Compilers**: Solidity/Vyper compilation utilities
- **State**: Blockchain state management

### EVM Package

```python
from guillotine_evm import EVM, BlockInfo, CallType, CallParams

evm = EVM(BlockInfo(...))
res = evm.call(CallParams(...))
sim = evm.simulate(CallParams(...))
evm.destroy()
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
