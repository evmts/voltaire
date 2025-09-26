package commands

import (
	"encoding/hex"
	"fmt"
	"regexp"
	"strconv"
	"strings"
)

// compileLLL compiles simple LLL assembly to EVM bytecode
// Supports basic patterns found in Ethereum test suite
func compileLLL(assembly string) ([]byte, error) {
	assembly = strings.TrimSpace(assembly)
	
	// Remove outer braces
	if !strings.HasPrefix(assembly, "{") || !strings.HasSuffix(assembly, "}") {
		return nil, fmt.Errorf("invalid LLL format: must be wrapped in {}")
	}
	assembly = strings.TrimSpace(assembly[1 : len(assembly)-1])
	
	var bytecode []byte
	
	// Pattern 1: [[slot]] value - SSTORE operations
	// Example: [[0]] 0 [[1]] 1 [[2]] 2
	sstorePattern := regexp.MustCompile(`\[\[(\d+)\]\]\s+(\d+)`)
	matches := sstorePattern.FindAllStringSubmatch(assembly, -1)
	
	if len(matches) > 0 {
		for _, match := range matches {
			slot, err := strconv.ParseUint(match[1], 10, 64)
			if err != nil {
				return nil, fmt.Errorf("invalid slot number: %s", match[1])
			}
			value, err := strconv.ParseUint(match[2], 10, 64)
			if err != nil {
				return nil, fmt.Errorf("invalid value: %s", match[2])
			}
			
			// Compile to: PUSH value, PUSH slot, SSTORE
			bytecode = append(bytecode, pushNumber(value)...)
			bytecode = append(bytecode, pushNumber(slot)...)
			bytecode = append(bytecode, 0x55) // SSTORE
		}
		
		// Add STOP at the end if not empty
		if len(bytecode) > 0 {
			bytecode = append(bytecode, 0x00) // STOP
		}
		
		return bytecode, nil
	}
	
	// Pattern 2: (OPCODE args...) - Direct opcodes
	// Example: (REVERT 0 32)
	if strings.HasPrefix(assembly, "(") {
		// Parse S-expression style
		parts := strings.Fields(strings.Trim(assembly, "()"))
		if len(parts) == 0 {
			return nil, fmt.Errorf("empty operation")
		}
		
		opcode := strings.ToUpper(parts[0])
		
		switch opcode {
		case "REVERT":
			if len(parts) != 3 {
				return nil, fmt.Errorf("REVERT requires 2 arguments")
			}
			offset, err := strconv.ParseUint(parts[1], 10, 64)
			if err != nil {
				return nil, err
			}
			size, err := strconv.ParseUint(parts[2], 10, 64)
			if err != nil {
				return nil, err
			}
			
			// PUSH size, PUSH offset, REVERT
			bytecode = append(bytecode, pushNumber(size)...)
			bytecode = append(bytecode, pushNumber(offset)...)
			bytecode = append(bytecode, 0xfd) // REVERT
			return bytecode, nil
			
		case "STOP":
			return []byte{0x00}, nil
			
		case "RETURN":
			if len(parts) != 3 {
				return nil, fmt.Errorf("RETURN requires 2 arguments")
			}
			offset, err := strconv.ParseUint(parts[1], 10, 64)
			if err != nil {
				return nil, err
			}
			size, err := strconv.ParseUint(parts[2], 10, 64)
			if err != nil {
				return nil, err
			}
			
			// PUSH size, PUSH offset, RETURN
			bytecode = append(bytecode, pushNumber(size)...)
			bytecode = append(bytecode, pushNumber(offset)...)
			bytecode = append(bytecode, 0xf3) // RETURN
			return bytecode, nil
			
		default:
			return nil, fmt.Errorf("unsupported opcode: %s", opcode)
		}
	}
	
	// Pattern 3: Simple hex bytecode (no compilation needed)
	if strings.HasPrefix(assembly, "0x") {
		return hex.DecodeString(assembly[2:])
	}
	
	return nil, fmt.Errorf("unsupported LLL pattern: %s", assembly)
}

// pushNumber generates PUSH bytecode for a number
func pushNumber(n uint64) []byte {
	if n == 0 {
		return []byte{0x60, 0x00} // PUSH1 0
	}
	
	// Count bytes needed
	temp := n
	byteCount := 0
	for temp > 0 {
		byteCount++
		temp >>= 8
	}
	
	// Generate PUSH instruction
	result := []byte{byte(0x60 + byteCount - 1)} // PUSH1 = 0x60, PUSH2 = 0x61, etc.
	
	// Add value bytes (big-endian)
	for i := byteCount - 1; i >= 0; i-- {
		result = append(result, byte(n>>(8*uint(i))))
	}
	
	return result
}

// isLLLAssembly checks if code string is LLL assembly
func isLLLAssembly(code string) bool {
	return strings.HasPrefix(code, "{") && strings.HasSuffix(code, "}")
}