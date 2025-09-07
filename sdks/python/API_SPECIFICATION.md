# Guillotine EVM Python API Specification

This document defines the complete Python API for the Guillotine EVM - a high-performance Ethereum Virtual Machine implementation.

## Design Philosophy

The Guillotine EVM Python bindings provide an ergonomic, type-safe interface to the underlying high-performance Zig implementation. The API is designed with the following principles:

- **Pythonic**: Follows Python conventions and idioms
- **Type Safe**: Full type hints and runtime validation
- **Resource Safe**: Automatic cleanup with context managers
- **Performance**: Minimal overhead over the C API
- **Developer Friendly**: Clear error messages and comprehensive documentation
- **Comprehensive**: Full access to all EVM functionality

## Core Architecture

```
┌─────────────────┐
│   Python API    │  ← High-level, ergonomic interface
├─────────────────┤
│ CFFI Bindings   │  ← Direct bindings to C functions
├─────────────────┤
│   C FFI Layer   │  ← Exported C functions from Zig
├─────────────────┤
│ Guillotine Core │  ← High-performance Zig implementation
└─────────────────┘
```

## API Overview

### 1. Core EVM Execution (`guillotine_evm.EVM`)

The main execution engine for running EVM bytecode.

```python
from guillotine_evm import EVM, Address, U256

# Create EVM instance with context manager (preferred)
with EVM() as evm:
    # Set up state
    from_addr = Address.from_hex("0x1234...")
    evm.set_balance(from_addr, U256.from_ether(10))
    
    # Execute bytecode
    bytecode = bytes.fromhex("6001600101")  # PUSH1 1 PUSH1 1 ADD
    result = evm.execute(
        bytecode=bytecode,
        caller=from_addr,
        gas_limit=100000
    )
    
    print(f"Success: {result.success}")
    print(f"Gas used: {result.gas_used}")
    print(f"Return data: {result.return_data.hex()}")

# Or create without context manager
evm = EVM()
try:
    # ... use evm
    pass
finally:
    evm.close()
```

#### EVM Class Interface

```python
class EVM:
    """High-performance Ethereum Virtual Machine."""
    
    def __init__(self, *, 
                 gas_limit: int = 30_000_000,
                 chain_id: int = 1,
                 hardfork: HardFork = HardFork.CANCUN) -> None:
        """Initialize EVM with configuration."""
    
    def execute(self, 
                bytecode: Union[bytes, Bytecode], 
                *,
                caller: Optional[Address] = None,
                to: Optional[Address] = None,
                value: Optional[U256] = None,
                input_data: Optional[bytes] = None,
                gas_limit: Optional[int] = None) -> ExecutionResult:
        """Execute bytecode and return result."""
    
    def call(self,
             to: Address,
             *,
             caller: Optional[Address] = None,
             value: Optional[U256] = None,
             input_data: Optional[bytes] = None,
             gas_limit: Optional[int] = None) -> ExecutionResult:
        """Call a contract at the given address."""
    
    def deploy(self,
               bytecode: Union[bytes, Bytecode],
               *,
               caller: Optional[Address] = None,
               value: Optional[U256] = None,
               constructor_args: Optional[bytes] = None,
               gas_limit: Optional[int] = None) -> DeployResult:
        """Deploy a contract and return its address."""
    
    # State management
    def get_balance(self, address: Address) -> U256:
        """Get the balance of an account."""
    
    def set_balance(self, address: Address, balance: U256) -> None:
        """Set the balance of an account."""
    
    def get_code(self, address: Address) -> bytes:
        """Get the bytecode of a contract."""
    
    def set_code(self, address: Address, code: Union[bytes, Bytecode]) -> None:
        """Set the bytecode of a contract."""
    
    def get_storage(self, address: Address, key: U256) -> U256:
        """Get a storage value."""
    
    def set_storage(self, address: Address, key: U256, value: U256) -> None:
        """Set a storage value."""
    
    def get_transient_storage(self, address: Address, key: U256) -> U256:
        """Get a transient storage value (EIP-1153)."""
    
    def set_transient_storage(self, address: Address, key: U256, value: U256) -> None:
        """Set a transient storage value (EIP-1153)."""
    
    # Account management
    def account_exists(self, address: Address) -> bool:
        """Check if an account exists."""
    
    def delete_account(self, address: Address) -> None:
        """Delete an account (SELFDESTRUCT)."""
    
    # Snapshots and rollback
    def snapshot(self) -> SnapshotId:
        """Create a snapshot of the current state."""
    
    def revert_to_snapshot(self, snapshot_id: SnapshotId) -> None:
        """Revert to a previous snapshot."""
    
    # Context managers
    def __enter__(self) -> "EVM":
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        self.close()
    
    def close(self) -> None:
        """Clean up resources."""
```

#### Result Types

```python
@dataclass
class ExecutionResult:
    """Result of EVM execution."""
    success: bool
    gas_used: int
    return_data: bytes
    logs: List[Log]
    error: Optional[str] = None
    
    def is_success(self) -> bool:
        return self.success
    
    def is_revert(self) -> bool:
        return not self.success and self.error is not None

@dataclass  
class DeployResult:
    """Result of contract deployment."""
    success: bool
    gas_used: int
    contract_address: Optional[Address]
    return_data: bytes
    logs: List[Log]
    error: Optional[str] = None

@dataclass
class Log:
    """EVM log entry."""
    address: Address
    topics: List[Hash]
    data: bytes
```

### 2. Bytecode Analysis (`guillotine_evm.Bytecode`)

Tools for analyzing and understanding EVM bytecode.

```python
from guillotine_evm import Bytecode, Opcode

# Create bytecode from hex
bytecode = Bytecode.from_hex("6080604052348015600f57600080fd5b50...")

# Or from bytes
bytecode = Bytecode(raw_bytecode_bytes)

# Analyze the bytecode
print(f"Length: {len(bytecode)} bytes")
print(f"Valid jump destinations: {list(bytecode.jump_destinations())}")
print(f"Invalid opcodes: {bytecode.invalid_opcode_count()}")

# Iterate through opcodes
for pc, instruction in bytecode.instructions():
    print(f"PC {pc:04x}: {instruction}")

# Get statistics
stats = bytecode.statistics()
print(f"Unique opcodes: {stats.unique_opcodes}")
print(f"Total instructions: {stats.instruction_count}")
print(f"Push instructions: {stats.push_count}")
print(f"Jump instructions: {stats.jump_count}")
```

#### Bytecode Class Interface

```python
class Bytecode:
    """EVM bytecode analysis and utilities."""
    
    def __init__(self, data: bytes) -> None:
        """Create bytecode from raw bytes."""
    
    @classmethod
    def from_hex(cls, hex_string: str) -> "Bytecode":
        """Create bytecode from hex string."""
    
    def __len__(self) -> int:
        """Get bytecode length in bytes."""
    
    def __bytes__(self) -> bytes:
        """Get raw bytecode bytes."""
    
    def __getitem__(self, index: int) -> int:
        """Get byte at index."""
    
    def opcode_at(self, pc: int) -> Opcode:
        """Get opcode at program counter."""
    
    def is_jump_destination(self, pc: int) -> bool:
        """Check if PC is a valid jump destination."""
    
    def jump_destinations(self) -> Iterator[int]:
        """Iterate over all valid jump destinations."""
    
    def instructions(self) -> Iterator[Tuple[int, Instruction]]:
        """Iterate over all instructions with their PC."""
    
    def invalid_opcode_count(self) -> int:
        """Count invalid opcodes in bytecode."""
    
    def statistics(self) -> BytecodeStats:
        """Get detailed statistics about the bytecode."""
    
    def to_hex(self) -> str:
        """Convert to hex string."""

@dataclass
class BytecodeStats:
    """Statistics about bytecode."""
    length: int
    instruction_count: int
    unique_opcodes: int
    push_count: int
    jump_count: int
    invalid_opcode_count: int
    gas_estimate: int
    complexity_score: float

@dataclass
class Instruction:
    """A single EVM instruction."""
    opcode: Opcode
    immediate_data: Optional[bytes] = None
    
    def __str__(self) -> str:
        if self.immediate_data:
            return f"{self.opcode.name} 0x{self.immediate_data.hex()}"
        return self.opcode.name
```

### 3. Precompiled Contracts (`guillotine_evm.precompiles`)

Easy access to Ethereum's precompiled contracts.

```python
from guillotine_evm.precompiles import (
    ecrecover, sha256, ripemd160, identity,
    modexp, ecadd, ecmul, ecpairing, blake2f,
    point_evaluation, is_precompile_address
)

# Use precompiles directly
hash_result = sha256(b"Hello, world!")
recovered_key = ecrecover(hash_val, v, r, s)

# Check if address is precompile
addr = Address.from_hex("0x0000000000000000000000000000000000000001")
if is_precompile_address(addr):
    print(f"Address {addr} is ECRecover precompile")

# Get gas costs
gas_cost = sha256.gas_cost(len(data))
print(f"SHA256 gas cost for {len(data)} bytes: {gas_cost}")
```

#### Precompile Functions

```python
def ecrecover(hash: Hash, v: int, r: U256, s: U256) -> Optional[Address]:
    """Recover public key from signature."""

def sha256(data: bytes) -> Hash:
    """SHA256 hash function."""

def ripemd160(data: bytes) -> Hash:
    """RIPEMD160 hash function."""

def identity(data: bytes) -> bytes:
    """Identity function (copy data)."""

def modexp(base: U256, exp: U256, mod: U256) -> U256:
    """Modular exponentiation."""

def ecadd(p1: ECPoint, p2: ECPoint) -> ECPoint:
    """Elliptic curve point addition."""

def ecmul(point: ECPoint, scalar: U256) -> ECPoint:
    """Elliptic curve scalar multiplication."""

def ecpairing(points: List[Tuple[ECPoint, ECPoint]]) -> bool:
    """Elliptic curve pairing check."""

def blake2f(rounds: int, h: bytes, m: bytes, t: bytes, f: bool) -> bytes:
    """BLAKE2b compression function."""

def point_evaluation(versioned_hash: Hash, z: U256, y: U256, 
                    commitment: bytes, proof: bytes) -> bool:
    """KZG point evaluation (EIP-4844)."""

def is_precompile_address(address: Address) -> bool:
    """Check if address is a precompile."""

# Gas cost functions
class PrecompileGasCosts:
    @staticmethod
    def sha256(input_length: int) -> int: ...
    @staticmethod  
    def ripemd160(input_length: int) -> int: ...
    @staticmethod
    def identity(input_length: int) -> int: ...
    @staticmethod
    def modexp(base_len: int, exp_len: int, mod_len: int) -> int: ...
    # ... etc
```

### 4. Bytecode Optimization (`guillotine_evm.Planner`)

Advanced bytecode analysis and optimization.

```python
from guillotine_evm import Planner, Bytecode

# Create planner
planner = Planner()

# Analyze and optimize bytecode
bytecode = Bytecode.from_hex("6001600101")  # PUSH1 1 PUSH1 1 ADD
plan = planner.plan(bytecode)

print(f"Original instructions: {len(list(bytecode.instructions()))}")
print(f"Optimized instructions: {plan.instruction_count}")
print(f"Optimization ratio: {plan.optimization_ratio:.2f}x")

# Use plan for faster execution (automatically handled by EVM)
with EVM() as evm:
    result = evm.execute(plan)  # Can execute Plan directly
```

#### Planner Interface

```python
class Planner:
    """Bytecode analysis and optimization engine."""
    
    def __init__(self, *, cache_size: int = 256) -> None:
        """Create planner with LRU cache."""
    
    def plan(self, bytecode: Bytecode) -> Plan:
        """Create optimized execution plan."""
    
    def has_cached_plan(self, bytecode: Bytecode) -> bool:
        """Check if plan is cached."""
    
    def clear_cache(self) -> None:
        """Clear the plan cache."""
    
    def cache_stats(self) -> CacheStats:
        """Get cache statistics."""

@dataclass
class Plan:
    """Optimized execution plan for bytecode."""
    instruction_count: int
    constant_count: int
    optimization_ratio: float
    has_jump_table: bool
    
    def is_valid_jump_destination(self, pc: int) -> bool:
        """Check if PC is valid jump destination in this plan."""

@dataclass 
class CacheStats:
    """Planner cache statistics."""
    size: int
    capacity: int
    hit_rate: float
    miss_count: int
```

### 5. Primitive Types

Core Ethereum data types with validation and conversion utilities.

#### Address

```python
from guillotine_evm import Address

# Create addresses
addr = Address.from_hex("0x1234567890123456789012345678901234567890")
addr = Address.from_bytes(b"\x12\x34..." * 10)  # 20 bytes
addr = Address.zero()  # 0x0000...0000
addr = Address.max()   # 0xffff...ffff

# Validation
print(f"Valid: {addr.is_valid()}")
print(f"Zero: {addr.is_zero()}")
print(f"Checksum: {addr.to_checksum()}")

# Conversion
print(f"Hex: {addr.to_hex()}")
print(f"Bytes: {addr.to_bytes()}")

# Arithmetic
addr2 = addr + 1
print(f"Next address: {addr2}")
```

#### U256

```python
from guillotine_evm import U256

# Create U256 values
val = U256.from_int(42)
val = U256.from_hex("0x1234567890abcdef")
val = U256.from_bytes(b"\x00" * 31 + b"\x42")
val = U256.from_ether(1)  # 1 ETH in wei
val = U256.from_gwei(1)   # 1 Gwei in wei
val = U256.zero()
val = U256.max()

# Arithmetic
result = val1 + val2
result = val1 * val2
result = val1 // val2  # Division
result = val1 % val2   # Modulo
result = val1 ** val2  # Exponentiation

# Comparison
print(f"Equal: {val1 == val2}")
print(f"Less than: {val1 < val2}")

# Bit operations
result = val1 & val2   # AND
result = val1 | val2   # OR
result = val1 ^ val2   # XOR
result = ~val1         # NOT
result = val1 << 8     # Left shift
result = val1 >> 8     # Right shift

# Conversion
print(f"Int: {val.to_int()}")
print(f"Hex: {val.to_hex()}")
print(f"Bytes: {val.to_bytes()}")
print(f"Ether: {val.to_ether()}")  # As decimal Ether
```

#### Hash

```python
from guillotine_evm import Hash

# Create hashes
hash_val = Hash.from_hex("0x1234..." * 16)  # 32 bytes
hash_val = Hash.from_bytes(b"\x12" * 32)
hash_val = Hash.zero()
hash_val = Hash.keccak256(b"Hello, world!")

# Properties
print(f"Hex: {hash_val.to_hex()}")
print(f"Bytes: {hash_val.to_bytes()}")
print(f"Is zero: {hash_val.is_zero()}")
```

### 6. Exception Hierarchy

```python
class GuillotineError(Exception):
    """Base exception for all Guillotine errors."""

class EVMError(GuillotineError):
    """EVM execution errors."""

class ExecutionError(EVMError):
    """Bytecode execution failed."""

class OutOfGasError(ExecutionError):
    """Insufficient gas for execution."""

class StackError(ExecutionError):
    """Stack overflow or underflow."""

class MemoryError(ExecutionError):
    """Memory allocation or access error."""

class InvalidOpcodeError(ExecutionError):
    """Invalid opcode encountered."""

class InvalidJumpError(ExecutionError):
    """Jump to invalid destination."""

class ValidationError(GuillotineError):
    """Input validation failed."""

class InvalidAddressError(ValidationError):
    """Invalid Ethereum address."""

class InvalidBytecodeError(ValidationError):
    """Invalid bytecode."""
```

### 7. Configuration and Hard Forks

```python
from guillotine_evm import HardFork, ChainConfig

# Configure EVM for different networks
mainnet_config = ChainConfig.mainnet()
goerli_config = ChainConfig.goerli()
sepolia_config = ChainConfig.sepolia()
custom_config = ChainConfig(
    chain_id=1337,
    hardfork=HardFork.CANCUN,
    gas_limit=30_000_000
)

# Create EVM with config
evm = EVM(config=mainnet_config)

# Hard fork support
class HardFork(Enum):
    FRONTIER = "frontier"
    HOMESTEAD = "homestead"
    BYZANTIUM = "byzantium"
    CONSTANTINOPLE = "constantinople"
    ISTANBUL = "istanbul"
    BERLIN = "berlin"
    LONDON = "london"
    MERGE = "merge"
    SHANGHAI = "shanghai"
    CANCUN = "cancun"
```

### 8. Development and Testing Utilities

```python
from guillotine_evm.testing import TestEVM, snapshot_test

# Test utilities
@snapshot_test
def test_contract_deployment():
    evm = TestEVM()
    
    # Deploy contract
    result = evm.deploy(contract_bytecode)
    assert result.success
    
    # Test contract calls
    call_result = evm.call(result.contract_address, input_data=call_data)
    assert call_result.success
    
    return evm.state_snapshot()  # Automatically compared

# Transaction simulation
from guillotine_evm.simulation import simulate_transaction

tx_result = simulate_transaction(
    to=contract_address,
    data=encoded_call,
    value=U256.from_ether(1),
    gas_limit=100000,
    state=current_state
)
```

## Usage Examples

### Basic Contract Execution

```python
from guillotine_evm import EVM, Address, U256, Bytecode

# Simple storage contract
contract_code = """
pragma solidity ^0.8.0;
contract SimpleStorage {
    uint256 value;
    function set(uint256 _value) public { value = _value; }
    function get() public view returns (uint256) { return value; }
}
"""

# Compile to bytecode (using external compiler)
bytecode = compile_solidity(contract_code)

with EVM() as evm:
    # Deploy contract
    deployer = Address.from_hex("0x1234567890123456789012345678901234567890")
    evm.set_balance(deployer, U256.from_ether(10))
    
    deploy_result = evm.deploy(
        bytecode=bytecode.deployment_code,
        caller=deployer,
        gas_limit=500000
    )
    
    if not deploy_result.success:
        raise Exception(f"Deployment failed: {deploy_result.error}")
    
    contract_address = deploy_result.contract_address
    print(f"Contract deployed at: {contract_address}")
    
    # Call set(42)
    set_call_data = encode_function_call("set(uint256)", [42])
    result = evm.call(
        to=contract_address,
        caller=deployer,
        input_data=set_call_data,
        gas_limit=100000
    )
    
    assert result.success
    print(f"Set call gas used: {result.gas_used}")
    
    # Call get()
    get_call_data = encode_function_call("get()")
    result = evm.call(
        to=contract_address,
        caller=deployer,
        input_data=get_call_data,
        gas_limit=100000
    )
    
    assert result.success
    value = decode_uint256(result.return_data)
    assert value == 42
    print(f"Retrieved value: {value}")
```

### Bytecode Analysis and Optimization

```python
from guillotine_evm import Bytecode, Planner

# Analyze complex bytecode
bytecode = Bytecode.from_hex("608060405234801561001057600080fd5b50...")

print(f"Bytecode length: {len(bytecode)} bytes")
print(f"Estimated gas cost: {bytecode.statistics().gas_estimate}")

# Find all SSTORE operations
for pc, instruction in bytecode.instructions():
    if instruction.opcode.name == "SSTORE":
        print(f"Storage write at PC {pc}")

# Optimize with planner
planner = Planner()
plan = planner.plan(bytecode)
print(f"Optimization improved performance by {plan.optimization_ratio:.2f}x")

# Execute optimized version
with EVM() as evm:
    result = evm.execute(plan)  # Uses optimized plan automatically
```

### Precompile Usage

```python
from guillotine_evm.precompiles import sha256, ecrecover
from guillotine_evm import Hash, U256

# Hash data
data = b"Hello, Ethereum!"
hash_result = sha256(data)
print(f"SHA256: {hash_result.to_hex()}")

# Signature recovery
message_hash = Hash.keccak256(b"Sign this message")
# Assume we have signature components
recovered_address = ecrecover(message_hash, v, r, s)
if recovered_address:
    print(f"Recovered address: {recovered_address}")
else:
    print("Invalid signature")
```

This comprehensive API specification provides a complete, ergonomic Python interface to all Guillotine EVM functionality while maintaining high performance and type safety.