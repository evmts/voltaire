"""
Bytecode analysis and utilities for Guillotine EVM Python bindings.

This module provides comprehensive bytecode analysis, validation, and optimization
features using the underlying C API.
"""

from typing import Iterator, Tuple, Optional, List
from dataclasses import dataclass
from enum import Enum

from .exceptions import ValidationError, InvalidBytecodeError
from ._ffi_comprehensive import ffi, lib, require_ffi


class Opcode(Enum):
    """EVM opcode enumeration."""
    STOP = 0x00
    ADD = 0x01
    MUL = 0x02
    SUB = 0x03
    DIV = 0x04
    SDIV = 0x05
    MOD = 0x06
    SMOD = 0x07
    ADDMOD = 0x08
    MULMOD = 0x09
    EXP = 0x0a
    SIGNEXTEND = 0x0b
    
    LT = 0x10
    GT = 0x11
    SLT = 0x12
    SGT = 0x13
    EQ = 0x14
    ISZERO = 0x15
    AND = 0x16
    OR = 0x17
    XOR = 0x18
    NOT = 0x19
    BYTE = 0x1a
    SHL = 0x1b
    SHR = 0x1c
    SAR = 0x1d
    
    KECCAK256 = 0x20
    
    ADDRESS = 0x30
    BALANCE = 0x31
    ORIGIN = 0x32
    CALLER = 0x33
    CALLVALUE = 0x34
    CALLDATALOAD = 0x35
    CALLDATASIZE = 0x36
    CALLDATACOPY = 0x37
    CODESIZE = 0x38
    CODECOPY = 0x39
    GASPRICE = 0x3a
    EXTCODESIZE = 0x3b
    EXTCODECOPY = 0x3c
    RETURNDATASIZE = 0x3d
    RETURNDATACOPY = 0x3e
    EXTCODEHASH = 0x3f
    
    BLOCKHASH = 0x40
    COINBASE = 0x41
    TIMESTAMP = 0x42
    NUMBER = 0x43
    DIFFICULTY = 0x44
    GASLIMIT = 0x45
    CHAINID = 0x46
    SELFBALANCE = 0x47
    BASEFEE = 0x48
    
    POP = 0x50
    MLOAD = 0x51
    MSTORE = 0x52
    MSTORE8 = 0x53
    SLOAD = 0x54
    SSTORE = 0x55
    JUMP = 0x56
    JUMPI = 0x57
    PC = 0x58
    MSIZE = 0x59
    GAS = 0x5a
    JUMPDEST = 0x5b
    TLOAD = 0x5c
    TSTORE = 0x5d
    MCOPY = 0x5e
    
    PUSH0 = 0x5f
    PUSH1 = 0x60
    PUSH2 = 0x61
    PUSH3 = 0x62
    PUSH4 = 0x63
    PUSH5 = 0x64
    PUSH6 = 0x65
    PUSH7 = 0x66
    PUSH8 = 0x67
    PUSH9 = 0x68
    PUSH10 = 0x69
    PUSH11 = 0x6a
    PUSH12 = 0x6b
    PUSH13 = 0x6c
    PUSH14 = 0x6d
    PUSH15 = 0x6e
    PUSH16 = 0x6f
    PUSH17 = 0x70
    PUSH18 = 0x71
    PUSH19 = 0x72
    PUSH20 = 0x73
    PUSH21 = 0x74
    PUSH22 = 0x75
    PUSH23 = 0x76
    PUSH24 = 0x77
    PUSH25 = 0x78
    PUSH26 = 0x79
    PUSH27 = 0x7a
    PUSH28 = 0x7b
    PUSH29 = 0x7c
    PUSH30 = 0x7d
    PUSH31 = 0x7e
    PUSH32 = 0x7f
    
    DUP1 = 0x80
    DUP2 = 0x81
    DUP3 = 0x82
    DUP4 = 0x83
    DUP5 = 0x84
    DUP6 = 0x85
    DUP7 = 0x86
    DUP8 = 0x87
    DUP9 = 0x88
    DUP10 = 0x89
    DUP11 = 0x8a
    DUP12 = 0x8b
    DUP13 = 0x8c
    DUP14 = 0x8d
    DUP15 = 0x8e
    DUP16 = 0x8f
    
    SWAP1 = 0x90
    SWAP2 = 0x91
    SWAP3 = 0x92
    SWAP4 = 0x93
    SWAP5 = 0x94
    SWAP6 = 0x95
    SWAP7 = 0x96
    SWAP8 = 0x97
    SWAP9 = 0x98
    SWAP10 = 0x99
    SWAP11 = 0x9a
    SWAP12 = 0x9b
    SWAP13 = 0x9c
    SWAP14 = 0x9d
    SWAP15 = 0x9e
    SWAP16 = 0x9f
    
    LOG0 = 0xa0
    LOG1 = 0xa1
    LOG2 = 0xa2
    LOG3 = 0xa3
    LOG4 = 0xa4
    
    CREATE = 0xf0
    CALL = 0xf1
    CALLCODE = 0xf2
    RETURN = 0xf3
    DELEGATECALL = 0xf4
    CREATE2 = 0xf5
    STATICCALL = 0xfa
    REVERT = 0xfd
    INVALID = 0xfe
    SELFDESTRUCT = 0xff
    
    @property
    def name(self) -> str:
        """Get opcode name."""
        return self._name_
    
    @classmethod
    def from_byte(cls, byte_value: int) -> 'Opcode':
        """Create opcode from byte value."""
        try:
            return cls(byte_value)
        except ValueError:
            # Return INVALID for unknown opcodes
            return cls.INVALID


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


class Bytecode:
    """
    EVM bytecode analysis and utilities.
    
    Provides comprehensive analysis of EVM bytecode including instruction parsing,
    jump destination validation, and statistical analysis.
    """
    
    def __init__(self, data: bytes) -> None:
        """Create bytecode from raw bytes."""
        if not isinstance(data, bytes):
            raise ValidationError(f"Bytecode data must be bytes, got {type(data)}")
        
        if len(data) == 0:
            raise InvalidBytecodeError("Bytecode cannot be empty")
        
        if len(data) > 24576:  # EVM bytecode size limit
            raise InvalidBytecodeError(f"Bytecode too large: {len(data)} bytes")
        
        self._data = data
        self._handle = None
        
        # Initialize FFI handle if available
        if lib is not None:
            self._handle = lib.evm_bytecode_create(self._data, len(self._data))
            if self._handle is None:
                raise InvalidBytecodeError("Failed to create bytecode handle")
    
    def __del__(self) -> None:
        """Cleanup bytecode resources."""
        if self._handle is not None and lib is not None:
            lib.evm_bytecode_destroy(self._handle)
            self._handle = None
    
    @classmethod
    def from_hex(cls, hex_string: str) -> "Bytecode":
        """Create bytecode from hex string."""
        if hex_string.startswith(('0x', '0X')):
            hex_string = hex_string[2:]
        
        if len(hex_string) % 2 != 0:
            raise ValidationError("Hex string must have even number of characters")
        
        try:
            data = bytes.fromhex(hex_string)
            return cls(data)
        except ValueError as e:
            raise ValidationError(f"Invalid hex string: {e}")
    
    def __len__(self) -> int:
        """Get bytecode length in bytes."""
        return len(self._data)
    
    def __bytes__(self) -> bytes:
        """Get raw bytecode bytes."""
        return self._data
    
    def to_bytes(self) -> bytes:
        """Get raw bytecode bytes."""
        return self._data
    
    def __getitem__(self, index: int) -> int:
        """Get byte at index."""
        return self._data[index]
    
    def opcode_at(self, pc: int) -> Opcode:
        """Get opcode at program counter."""
        if pc < 0 or pc >= len(self._data):
            raise IndexError(f"PC {pc} out of bounds for bytecode length {len(self._data)}")
        
        if self._handle is not None:
            # Use C implementation if available
            opcode_byte = lib.evm_bytecode_get_opcode_at(self._handle, pc)
            return Opcode.from_byte(opcode_byte)
        else:
            # Fallback to Python implementation
            return Opcode.from_byte(self._data[pc])
    
    def is_jump_destination(self, pc: int) -> bool:
        """Check if PC is a valid jump destination."""
        if pc < 0 or pc >= len(self._data):
            return False
        
        if self._handle is not None:
            # Use C implementation if available
            result = lib.evm_bytecode_is_jump_dest(self._handle, pc)
            return bool(result)
        else:
            # Fallback to Python implementation
            return self._data[pc] == Opcode.JUMPDEST.value
    
    def jump_destinations(self) -> Iterator[int]:
        """Iterate over all valid jump destinations."""
        if self._handle is not None:
            # Use C implementation if available
            max_destinations = len(self._data)  # Upper bound
            destinations = ffi.new(f"uint32_t[{max_destinations}]")
            destinations_count = ffi.new("size_t *")
            
            result = lib.evm_bytecode_find_jump_dests(
                self._handle, 
                destinations, 
                max_destinations, 
                destinations_count
            )
            
            if result == 0:  # Success
                count = destinations_count[0]
                for i in range(count):
                    yield destinations[i]
        else:
            # Fallback to Python implementation
            for i, byte in enumerate(self._data):
                if byte == Opcode.JUMPDEST.value:
                    yield i
    
    def instructions(self) -> Iterator[Tuple[int, Instruction]]:
        """Iterate over all instructions with their PC."""
        pc = 0
        while pc < len(self._data):
            opcode = self.opcode_at(pc)
            immediate_data = None
            
            # Handle PUSH opcodes with immediate data
            if Opcode.PUSH1.value <= opcode.value <= Opcode.PUSH32.value:
                push_size = opcode.value - Opcode.PUSH1.value + 1
                start_pc = pc + 1
                end_pc = min(start_pc + push_size, len(self._data))
                immediate_data = self._data[start_pc:end_pc]
                pc = end_pc
            else:
                pc += 1
            
            yield pc - (len(immediate_data) if immediate_data else 0) - 1, Instruction(opcode, immediate_data)
    
    def invalid_opcode_count(self) -> int:
        """Count invalid opcodes in bytecode."""
        if self._handle is not None:
            # Use C implementation if available
            return lib.evm_bytecode_count_invalid_opcodes(self._handle)
        else:
            # Fallback to Python implementation
            count = 0
            for pc in range(len(self._data)):
                try:
                    opcode = Opcode(self._data[pc])
                    if opcode == Opcode.INVALID:
                        count += 1
                except ValueError:
                    count += 1
            return count
    
    def statistics(self) -> BytecodeStats:
        """Get detailed statistics about the bytecode."""
        if self._handle is not None:
            # Use C implementation if available
            stats = ffi.new("CBytecodeStats *")
            result = lib.evm_bytecode_get_stats(self._handle, stats)
            
            if result == 0:  # Success
                return BytecodeStats(
                    length=stats.length,
                    instruction_count=stats.instruction_count,
                    unique_opcodes=stats.unique_opcodes,
                    push_count=stats.push_count,
                    jump_count=stats.jump_count,
                    invalid_opcode_count=stats.invalid_count,
                    gas_estimate=stats.estimated_gas,
                    complexity_score=float(stats.estimated_gas) / max(stats.length, 1)
                )
        
        # Fallback to Python implementation
        instruction_count = 0
        unique_opcodes = set()
        push_count = 0
        jump_count = 0
        invalid_count = 0
        gas_estimate = 0
        
        for pc, instruction in self.instructions():
            instruction_count += 1
            unique_opcodes.add(instruction.opcode.value)
            
            if Opcode.PUSH0.value <= instruction.opcode.value <= Opcode.PUSH32.value:
                push_count += 1
                gas_estimate += 3  # PUSH gas cost
            elif instruction.opcode in [Opcode.JUMP, Opcode.JUMPI]:
                jump_count += 1
                gas_estimate += 8  # JUMP gas cost
            elif instruction.opcode == Opcode.INVALID:
                invalid_count += 1
            else:
                gas_estimate += 3  # Base gas cost
        
        return BytecodeStats(
            length=len(self._data),
            instruction_count=instruction_count,
            unique_opcodes=len(unique_opcodes),
            push_count=push_count,
            jump_count=jump_count,
            invalid_opcode_count=invalid_count,
            gas_estimate=gas_estimate,
            complexity_score=float(gas_estimate) / max(len(self._data), 1)
        )
    
    def to_hex(self) -> str:
        """Convert to hex string."""
        return "0x" + self._data.hex()
    
    def __str__(self) -> str:
        """String representation."""
        return self.to_hex()
    
    def __repr__(self) -> str:
        """Developer representation."""
        return f"Bytecode('{self.to_hex()}')"
    
    def __eq__(self, other) -> bool:
        """Check equality with another Bytecode."""
        if not isinstance(other, Bytecode):
            return False
        return self._data == other._data
    
    def __hash__(self) -> int:
        """Hash for use in dictionaries."""
        return hash(self._data)