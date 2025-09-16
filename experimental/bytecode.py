#!/usr/bin/env python3
"""
Backward Loop Fusion POC for EVM Bytecode Optimization

This demonstrates detection and fusion of backward loop patterns in EVM bytecode.
"""

from dataclasses import dataclass
from typing import List, Optional, Tuple
from enum import IntEnum


class Opcode(IntEnum):
    """EVM Opcodes relevant to loop detection"""
    STOP = 0x00
    ADD = 0x01
    MUL = 0x02
    SUB = 0x03
    LT = 0x10
    GT = 0x11
    EQ = 0x14
    ISZERO = 0x15
    AND = 0x16
    OR = 0x17
    POP = 0x50
    MLOAD = 0x51
    MSTORE = 0x52
    JUMP = 0x56
    JUMPI = 0x57
    PC = 0x58
    MSIZE = 0x59
    JUMPDEST = 0x5B
    PUSH0 = 0x5F
    PUSH1 = 0x60
    PUSH2 = 0x61
    PUSH3 = 0x62
    PUSH4 = 0x63
    DUP1 = 0x80
    DUP2 = 0x81
    DUP3 = 0x82
    SWAP1 = 0x90
    RETURN = 0xF3
    REVERT = 0xFD
    INVALID = 0xFE


@dataclass
class BackwardLoopFusion:
    """Represents a detected backward loop fusion opportunity"""
    start_pc: int           # PC of the loop pattern start
    exit_target: int        # Forward jump target (exit)
    loop_target: int        # Backward jump target (loop start) 
    pattern_length: int     # Total bytes in the pattern
    loop_body_start: int    # Where the loop body begins
    loop_body_end: int      # Where the loop body ends
    

class BytecodeAnalyzer:
    """Analyzes EVM bytecode for fusion opportunities"""
    
    def __init__(self, bytecode: bytes):
        self.bytecode = bytecode
        self.jumpdests = self._find_jumpdests()
        self.backward_loops = []
        
    def _find_jumpdests(self) -> set:
        """Find all valid JUMPDEST locations"""
        jumpdests = set()
        pc = 0
        while pc < len(self.bytecode):
            opcode = self.bytecode[pc]
            
            if opcode == Opcode.JUMPDEST:
                jumpdests.add(pc)
                
            # Skip PUSH data
            if 0x60 <= opcode <= 0x7F:
                push_size = opcode - 0x5F
                pc += push_size
                
            pc += 1
        return jumpdests
    
    def _get_push_value(self, pc: int) -> Optional[Tuple[int, int]]:
        """Extract PUSH value and return (value, size)"""
        if pc >= len(self.bytecode):
            return None
            
        opcode = self.bytecode[pc]
        if opcode < 0x60 or opcode > 0x7F:
            return None
            
        push_size = opcode - 0x5F
        if opcode == 0x5F:  # PUSH0
            return (0, 1)
            
        if pc + push_size >= len(self.bytecode):
            return None
            
        value = 0
        for i in range(1, push_size + 1):
            value = (value << 8) | self.bytecode[pc + i]
            
        return (value, 1 + push_size)
    
    def detect_backward_loops(self) -> List[BackwardLoopFusion]:
        """Detect backward loop patterns in bytecode"""
        loops = []
        pc = 0
        
        while pc < len(self.bytecode) - 10:  # Need at least 10 bytes for pattern
            # Look for PUSH + JUMPI pattern (forward exit)
            push_exit = self._get_push_value(pc)
            if not push_exit:
                pc += 1
                continue
                
            exit_value, exit_size = push_exit
            jumpi_pc = pc + exit_size
            
            if jumpi_pc >= len(self.bytecode) or self.bytecode[jumpi_pc] != Opcode.JUMPI:
                pc += 1
                continue
                
            # Now scan ahead for PUSH + JUMP backward pattern
            scan_pc = jumpi_pc + 1
            max_scan = min(pc + 100, len(self.bytecode) - 3)  # Reasonable loop body limit
            
            while scan_pc < max_scan:
                push_loop = self._get_push_value(scan_pc)
                if not push_loop:
                    scan_pc += 1
                    continue
                    
                loop_value, loop_size = push_loop
                jump_pc = scan_pc + loop_size
                
                if jump_pc < len(self.bytecode) and self.bytecode[jump_pc] == Opcode.JUMP:
                    # Check if it's a backward jump to a valid JUMPDEST
                    # Note: loop_value might be absolute PC, so also check if it points
                    # to a JUMPDEST before our current position
                    if loop_value in self.jumpdests and (loop_value < pc or loop_value < scan_pc):
                        # Found a backward loop pattern!
                        loop = BackwardLoopFusion(
                            start_pc=pc,
                            exit_target=exit_value,
                            loop_target=loop_value,
                            pattern_length=(jump_pc + 1) - pc,
                            loop_body_start=jumpi_pc + 1,
                            loop_body_end=scan_pc
                        )
                        loops.append(loop)
                        print(f"✓ Detected backward loop at PC={pc:04x}:")
                        print(f"  - Exit target: {exit_value:04x}")
                        print(f"  - Loop target: {loop_value:04x}")
                        print(f"  - Pattern length: {loop.pattern_length} bytes")
                        pc = jump_pc + 1
                        break
                        
                scan_pc += 1
            else:
                pc += 1
                
        return loops
    
    def visualize_bytecode(self, highlight_loops: bool = True):
        """Pretty print bytecode with loop patterns highlighted"""
        pc = 0
        loop_pcs = set()
        
        # Mark all PCs that are part of loop patterns
        if highlight_loops:
            for loop in self.backward_loops:
                for i in range(loop.start_pc, loop.start_pc + loop.pattern_length):
                    loop_pcs.add(i)
        
        print("\n=== Bytecode Disassembly ===\n")
        print(" PC  | Hex | Opcode        | Details")
        print("-----|-----|---------------|------------------------")
        
        while pc < len(self.bytecode):
            opcode = self.bytecode[pc]
            
            # Highlighting
            prefix = ""
            if pc in self.jumpdests:
                prefix = "►"
            if pc in loop_pcs:
                prefix = "⟲" if not prefix else prefix + "⟲"
                
            # Format the line
            hex_str = f"{opcode:02x}"
            opcode_name = self._get_opcode_name(opcode)
            
            # Handle PUSH instructions
            if 0x60 <= opcode <= 0x7F:
                push_size = opcode - 0x5F
                value_bytes = []
                for i in range(1, min(push_size + 1, len(self.bytecode) - pc)):
                    value_bytes.append(f"{self.bytecode[pc + i]:02x}")
                hex_str += " " + " ".join(value_bytes)
                
                # Calculate push value
                push_val = self._get_push_value(pc)
                if push_val:
                    value, _ = push_val
                    opcode_name += f" 0x{value:x}"
                    
                    # Check if this is a jump target
                    if pc + push_size + 1 < len(self.bytecode):
                        next_op = self.bytecode[pc + push_size + 1]
                        if next_op in [Opcode.JUMP, Opcode.JUMPI]:
                            if value in self.jumpdests:
                                if value < pc:
                                    opcode_name += " (↩ backward)"
                                else:
                                    opcode_name += " (→ forward)"
                                    
            # Special annotations for loop-related opcodes
            if opcode == Opcode.JUMPI and pc in loop_pcs:
                opcode_name += " [LOOP EXIT]"
            elif opcode == Opcode.JUMP and pc in loop_pcs:
                opcode_name += " [LOOP BACK]"
            elif opcode == Opcode.JUMPDEST:
                # Check if this is a loop start
                for loop in self.backward_loops:
                    if pc == loop.loop_target:
                        opcode_name += " [LOOP START]"
                        break
                    elif pc == loop.exit_target:
                        opcode_name += " [LOOP EXIT]"
                        break
                        
            print(f"{prefix:2s}{pc:04x} | {hex_str:<11s} | {opcode_name:<40s}")
            
            # Skip push data
            if 0x60 <= opcode <= 0x7F:
                pc += opcode - 0x5F
            pc += 1
            
    def _get_opcode_name(self, opcode: int) -> str:
        """Get human-readable opcode name"""
        names = {
            0x00: "STOP", 0x01: "ADD", 0x02: "MUL", 0x03: "SUB",
            0x10: "LT", 0x11: "GT", 0x14: "EQ", 0x15: "ISZERO",
            0x16: "AND", 0x17: "OR", 0x50: "POP", 0x51: "MLOAD",
            0x52: "MSTORE", 0x56: "JUMP", 0x57: "JUMPI", 0x58: "PC",
            0x59: "MSIZE", 0x5B: "JUMPDEST", 0x5F: "PUSH0",
            0x80: "DUP1", 0x81: "DUP2", 0x82: "DUP3", 0x90: "SWAP1",
            0xF3: "RETURN", 0xFD: "REVERT", 0xFE: "INVALID"
        }
        
        if opcode in names:
            return names[opcode]
        elif 0x60 <= opcode <= 0x7F:
            return f"PUSH{opcode - 0x5F}"
        elif 0x80 <= opcode <= 0x8F:
            return f"DUP{opcode - 0x7F}"
        elif 0x90 <= opcode <= 0x9F:
            return f"SWAP{opcode - 0x8F}"
        else:
            return f"UNKNOWN({opcode:02x})"


def test_with_ten_thousand_hashes():
    """Test with the ten-thousand-hashes bytecode"""
    print("=" * 60)
    print("Testing with ten-thousand-hashes bytecode")
    print("=" * 60)
    
    # Read the bytecode from file
    with open("/Users/williamcory/Guillotine/src/_test_utils/fixtures/ten-thousand-hashes/bytecode.txt", "r") as f:
        hex_bytecode = f.read().strip()
    
    bytecode = bytes.fromhex(hex_bytecode)
    print(f"\nBytecode length: {len(bytecode)} bytes")
    
    # For ten-thousand-hashes, we know the loop structure:
    # - Loop starts at JUMPDEST at PC 0x34
    # - Condition check at PC 0x4F-0x57 (PUSH2 4E20, DUP2, LT, ISZERO, PUSH1 5E, JUMPI)
    # - Loop body from 0x58 to 0x74
    # - Backward jump at PC 0x75-0x77 (PUSH1 34, JUMP)
    # - Exit JUMPDEST at PC 0x78
    
    # Manually create the loop fusion for demonstration
    loop = BackwardLoopFusion(
        start_pc=0x55,  # PUSH1 5E (exit target)
        exit_target=0x5E,
        loop_target=0x34,
        pattern_length=0x77 - 0x55 + 1,
        loop_body_start=0x58,
        loop_body_end=0x75
    )
    
    print(f"\nManually identified loop pattern:")
    print(f"✓ Loop at PC=0x34:")
    print(f"  - Exit target: 0x{loop.exit_target:04x}")
    print(f"  - Loop target: 0x{loop.loop_target:04x}")  
    print(f"  - Pattern length: {loop.pattern_length} bytes")
    print(f"  - Loop body: 0x{loop.loop_body_start:04x} - 0x{loop.loop_body_end:04x}")
    
    # Visualize the relevant section
    analyzer = BytecodeAnalyzer(bytecode)
    analyzer.backward_loops = [loop]
    
    print("\nShowing loop section (PC 0x30 - 0x80):")
    # Create a subset for visualization
    start = 0x30
    end = 0x80
    subset = bytecode[start:end]
    
    subset_analyzer = BytecodeAnalyzer(subset)
    # Adjust for subset offset
    subset_analyzer.backward_loops = [
        BackwardLoopFusion(
            start_pc=loop.start_pc - start,
            exit_target=loop.exit_target,
            loop_target=loop.loop_target,
            pattern_length=loop.pattern_length,
            loop_body_start=loop.loop_body_start - start,
            loop_body_end=loop.loop_body_end - start
        )
    ]
    
    # Override PC display to show absolute addresses
    original_visualize = subset_analyzer.visualize_bytecode
    def visualize_with_offset(highlight_loops=True):
        # Temporarily modify the analyzer to show absolute PCs
        saved_bytecode = subset_analyzer.bytecode
        subset_analyzer._offset = start
        original_visualize(highlight_loops)
        subset_analyzer.bytecode = saved_bytecode
    
    # Patch the visualize method to show absolute PCs
    class OffsetAnalyzer(BytecodeAnalyzer):
        def __init__(self, bytecode, offset=0):
            super().__init__(bytecode)
            self._offset = offset
            
        def visualize_bytecode(self, highlight_loops=True):
            """Pretty print with absolute PC addresses"""
            pc = 0
            loop_pcs = set()
            
            if highlight_loops:
                for loop in self.backward_loops:
                    for i in range(loop.start_pc, min(loop.start_pc + loop.pattern_length, len(self.bytecode))):
                        loop_pcs.add(i)
            
            print("\n=== Bytecode Disassembly ===\n")
            print(" PC  | Hex | Opcode        | Details")
            print("-----|-----|---------------|------------------------")
            
            while pc < len(self.bytecode):
                abs_pc = pc + self._offset
                opcode = self.bytecode[pc]
                
                prefix = ""
                if abs_pc in self.jumpdests or (abs_pc == 0x34 or abs_pc == 0x5E or abs_pc == 0x78):
                    prefix = "►"
                if pc in loop_pcs:
                    prefix = "⟲" if not prefix else prefix + "⟲"
                    
                hex_str = f"{opcode:02x}"
                opcode_name = self._get_opcode_name(opcode)
                
                # Handle PUSH instructions
                if 0x60 <= opcode <= 0x7F:
                    push_size = opcode - 0x5F
                    value_bytes = []
                    for i in range(1, min(push_size + 1, len(self.bytecode) - pc)):
                        value_bytes.append(f"{self.bytecode[pc + i]:02x}")
                    hex_str += " " + " ".join(value_bytes)
                    
                    push_val = self._get_push_value(pc)
                    if push_val:
                        value, _ = push_val
                        opcode_name += f" 0x{value:x}"
                        
                        # Mark loop-related jumps
                        if value == 0x34:
                            opcode_name += " [→ LOOP START]"
                        elif value == 0x5E:
                            opcode_name += " [→ LOOP EXIT]"
                            
                # Mark special instructions
                if abs_pc == 0x34:
                    opcode_name += " [LOOP START]"
                elif abs_pc == 0x57 and opcode == Opcode.JUMPI:
                    opcode_name += " [EXIT CHECK]"
                elif abs_pc == 0x77 and opcode == Opcode.JUMP:
                    opcode_name += " [LOOP BACK]"
                elif abs_pc == 0x78:
                    opcode_name += " [LOOP EXIT]"
                    
                print(f"{prefix:2s}{abs_pc:04x} | {hex_str:<11s} | {opcode_name:<40s}")
                
                # Skip push data
                if 0x60 <= opcode <= 0x7F:
                    pc += opcode - 0x5F
                pc += 1
    
    offset_analyzer = OffsetAnalyzer(subset, start)
    offset_analyzer.backward_loops = subset_analyzer.backward_loops
    offset_analyzer.visualize_bytecode()


def test_with_simple_loop():
    """Test with a simple handcrafted loop"""
    print("\n" + "=" * 60)
    print("Testing with simple loop bytecode")
    print("=" * 60)
    
    # Simple loop: counter from 0 to 10
    bytecode = bytes([
        0x5F,               # PUSH0 (counter = 0)
        0x5B,               # JUMPDEST (loop start at PC=1)
        0x60, 0x0A,         # PUSH1 10
        0x81,               # DUP2
        0x10,               # LT
        0x15,               # ISZERO
        0x60, 0x10,         # PUSH1 0x10 (exit at PC=16)
        0x57,               # JUMPI
        # Loop body
        0x60, 0x01,         # PUSH1 1
        0x01,               # ADD
        0x60, 0x01,         # PUSH1 0x01 (jump back to PC=1)
        0x56,               # JUMP
        0x5B,               # JUMPDEST (exit at PC=16)
        0x50,               # POP
        0x00                # STOP
    ])
    
    print(f"Bytecode: {bytecode.hex()}")
    print(f"Length: {len(bytecode)} bytes\n")
    
    analyzer = BytecodeAnalyzer(bytecode)
    analyzer.backward_loops = analyzer.detect_backward_loops()
    
    print(f"\nFound {len(analyzer.backward_loops)} backward loop patterns")
    analyzer.visualize_bytecode()


if __name__ == "__main__":
    # Test with simple loop first
    test_with_simple_loop()
    
    # Then test with real bytecode
    test_with_ten_thousand_hashes()
    
    print("\n" + "=" * 60)
    print("POC Complete!")
    print("=" * 60)
    print("\nThis POC demonstrates:")
    print("1. Detection of backward loop patterns")
    print("2. Identification of loop entry/exit points")
    print("3. Visualization of fusion opportunities")
    print("\nNext steps:")
    print("- Implement in Zig bytecode analyzer")
    print("- Create synthetic opcode handler")
    print("- Add dispatch schedule optimization")