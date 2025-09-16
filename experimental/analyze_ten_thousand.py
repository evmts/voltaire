#!/usr/bin/env python3
"""Analyze the ten-thousand-hashes bytecode to understand its loop structure"""

hex_bytecode = "6080604052348015600e575f5ffd5b50609780601a5f395ff3fe6080604052348015600e575f5ffd5b50600436106026575f3560e01c806330627b7c14602a575b5f5ffd5b60306032565b005b5f5b614e20811015605e5760408051602081018390520160408051601f19818403019052526001016034565b5056fea26469706673582212202c247f39d615d7f66942cd6ed505d8ea34fbfcbe16ac875ed08c4a9c229325f364736f6c634300081e0033"

bytecode = bytes.fromhex(hex_bytecode)

print("Analyzing ten-thousand-hashes bytecode")
print("=" * 60)

# Find the interesting part (the loop)
# Looking for pattern around "5f5b614e20811015605e57"
target_pattern = bytes.fromhex("5f5b614e20811015605e57")

if target_pattern in bytecode:
    idx = bytecode.index(target_pattern)
    print(f"Found loop pattern at offset 0x{idx:04x}")
    
    # Show context
    start = max(0, idx - 10)
    end = min(len(bytecode), idx + 50)
    
    print(f"\nBytecode from 0x{start:04x} to 0x{end:04x}:")
    pc = start
    while pc < end:
        op = bytecode[pc]
        hex_str = f"{op:02x}"
        
        # Handle PUSH instructions
        if 0x60 <= op <= 0x7f:
            push_size = op - 0x5f
            for i in range(1, min(push_size + 1, end - pc)):
                hex_str += f" {bytecode[pc + i]:02x}"
            
        # Mark the loop start
        marker = ""
        if pc == idx:
            marker = ">>> LOOP START >>>"
        elif pc == idx + len(target_pattern):
            marker = "<<< PATTERN END <<<"
            
        print(f"  {pc:04x}: {hex_str:20s} {marker}")
        
        # Skip push data
        if 0x60 <= op <= 0x7f:
            pc += op - 0x5f
        pc += 1
    
    print("\nPattern breakdown:")
    print("  5f       - PUSH0 (counter = 0)")
    print("  5b       - JUMPDEST (loop start)")  
    print("  61 4e 20 - PUSH2 0x4e20 (20000 decimal)")
    print("  81       - DUP2 (duplicate counter)")
    print("  10       - LT (counter < 20000)")
    print("  15       - ISZERO (invert condition)")
    print("  60 5e    - PUSH1 0x5e (exit target)")
    print("  57       - JUMPI (exit if done)")
    
    # Find the backward jump
    back_jump = bytes.fromhex("6034565b")  # PUSH1 0x34, JUMP, JUMPDEST
    if back_jump in bytecode:
        back_idx = bytecode.index(back_jump)
        print(f"\nFound backward jump at 0x{back_idx:04x}:")
        print(f"  60 34 - PUSH1 0x34 (target PC)")
        print(f"  56    - JUMP (unconditional)")
        print(f"  5b    - JUMPDEST (exit point)")
        
        # The actual loop target is at absolute PC 0x34
        print(f"\nLoop structure:")
        print(f"  Loop starts at PC 0x34 (JUMPDEST)")
        print(f"  Exit check at PC 0x{idx:04x}")
        print(f"  Backward jump at PC 0x{back_idx:04x}")
        print(f"  Exit point at PC 0x{back_idx + 3:04x}")