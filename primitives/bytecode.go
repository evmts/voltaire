// Package primitives provides bytecode analysis and validation utilities
// for EVM bytecode.
//
// This module provides:
// - Jump destination (JUMPDEST) analysis
// - Bytecode boundary checking
// - Opcode validation
//
// JUMPDEST analysis is critical for EVM execution to prevent jumping into
// the middle of PUSH instruction data, which could lead to invalid execution.
package primitives

import (
	"errors"
)

// Bytecode errors
var (
	ErrInvalidBytecode     = errors.New("invalid bytecode")
	ErrInvalidJumpDest     = errors.New("invalid jump destination")
	ErrTruncatedPush       = errors.New("truncated PUSH instruction")
	ErrOutOfBounds         = errors.New("position out of bounds")
)

// EVM opcode constants (as byte values)
const (
	opcodeJUMPDEST byte = 0x5b
	opcodePUSH1    byte = 0x60
	opcodePUSH32   byte = 0x7f
)

// JumpDestination represents a valid jump destination in bytecode
type JumpDestination struct {
	Position int
	Valid    bool
}

// Bytecode represents analyzed EVM bytecode with pre-validated jump destinations
type Bytecode struct {
	Code          []byte
	JumpDestMap   map[int]bool
}

// NewBytecode creates a new Bytecode instance with JUMPDEST analysis
func NewBytecode(code []byte) *Bytecode {
	bc := &Bytecode{
		Code:        code,
		JumpDestMap: make(map[int]bool),
	}
	bc.analyzeJumpDestinations()
	return bc
}

// analyzeJumpDestinations scans bytecode to identify valid JUMPDEST positions
// This must skip over PUSH instruction immediate data to avoid treating data
// bytes as instructions
func (bc *Bytecode) analyzeJumpDestinations() {
	i := 0
	for i < len(bc.Code) {
		opcode := bc.Code[i]

		// Check if this is a JUMPDEST
		if opcode == opcodeJUMPDEST {
			bc.JumpDestMap[i] = true
			i++
			continue
		}

		// Check if this is a PUSH instruction (opcodePUSH1 through opcodePUSH32)
		if opcode >= opcodePUSH1 && opcode <= opcodePUSH32 {
			pushSize := int(opcode - opcodePUSH1 + 1)
			// Skip the PUSH opcode itself and all its immediate data bytes
			i += 1 + pushSize
			continue
		}

		// All other opcodes are single byte
		i++
	}
}

// AnalyzeJumpDestinations returns all valid jump destinations in bytecode
func AnalyzeJumpDestinations(code []byte) []JumpDestination {
	bc := NewBytecode(code)
	destinations := []JumpDestination{}

	for pos := range bc.JumpDestMap {
		destinations = append(destinations, JumpDestination{
			Position: pos,
			Valid:    true,
		})
	}

	return destinations
}

// IsValidJumpDest checks if a position is a valid JUMPDEST
func (bc *Bytecode) IsValidJumpDest(position int) bool {
	return bc.JumpDestMap[position]
}

// IsValidJumpDestAt checks if position is a valid JUMPDEST (standalone function)
func IsValidJumpDestAt(code []byte, position int) bool {
	bc := NewBytecode(code)
	return bc.IsValidJumpDest(position)
}

// IsBytecodeBoundary checks if a position is at an opcode boundary
// (not in the middle of PUSH data)
func IsBytecodeBoundary(code []byte, position int) bool {
	if position >= len(code) {
		return false
	}

	i := 0
	for i < len(code) {
		// If we reached the position, it's a boundary
		if i == position {
			return true
		}

		// If we passed it, it's not a boundary
		if i > position {
			return false
		}

		opcode := code[i]

		// Check if this is a PUSH instruction
		if opcode >= opcodePUSH1 && opcode <= opcodePUSH32 {
			pushSize := int(opcode - opcodePUSH1 + 1)
			i += 1 + pushSize
			continue
		}

		// Regular opcode
		i++
	}

	return false
}

// ValidateBytecode validates EVM bytecode structure
// Returns true if bytecode is valid (no truncated PUSH instructions)
func ValidateBytecode(code []byte) bool {
	i := 0
	for i < len(code) {
		opcode := code[i]

		// Check if this is a PUSH instruction
		if opcode >= opcodePUSH1 && opcode <= opcodePUSH32 {
			pushSize := int(opcode - opcodePUSH1 + 1)
			// Check if there's enough data
			if i+pushSize >= len(code) {
				return false // Truncated PUSH
			}
			i += 1 + pushSize
			continue
		}

		// Regular opcode
		i++
	}

	return true
}

// GetOpcode returns the opcode byte at position
func (bc *Bytecode) GetOpcode(position int) (byte, error) {
	if position >= len(bc.Code) {
		return 0, ErrOutOfBounds
	}
	return bc.Code[position], nil
}

// GetPushData returns the data bytes for a PUSH instruction at position
func (bc *Bytecode) GetPushData(position int) ([]byte, error) {
	if position >= len(bc.Code) {
		return nil, ErrOutOfBounds
	}

	opcode := bc.Code[position]
	if opcode < opcodePUSH1 || opcode > opcodePUSH32 {
		return nil, errors.New("not a PUSH instruction")
	}

	pushSize := int(opcode - opcodePUSH1 + 1)
	if position+1+pushSize > len(bc.Code) {
		return nil, ErrTruncatedPush
	}

	data := make([]byte, pushSize)
	copy(data, bc.Code[position+1:position+1+pushSize])
	return data, nil
}

// Length returns the bytecode length
func (bc *Bytecode) Length() int {
	return len(bc.Code)
}

// HasJumpDests returns true if bytecode contains any JUMPDEST instructions
func (bc *Bytecode) HasJumpDests() bool {
	return len(bc.JumpDestMap) > 0
}

// GetJumpDestPositions returns all JUMPDEST positions
func (bc *Bytecode) GetJumpDestPositions() []int {
	positions := []int{}
	for pos := range bc.JumpDestMap {
		positions = append(positions, pos)
	}
	return positions
}

// ParseBytecode is an alias for NewBytecode for compatibility
func ParseBytecode(code []byte) *Bytecode {
	return NewBytecode(code)
}

// ExtractMetadata extracts Solidity metadata from bytecode
// Solidity metadata is appended at the end: 0xa2 0x64 'i' 'p' 'f' 's' [32-byte hash] 0x00 0x33
// or CBOR-encoded metadata
func ExtractMetadata(code []byte) ([]byte, []byte, error) {
	if len(code) < 2 {
		return code, nil, nil
	}

	// Look for metadata marker (0xa2 0x64 = CBOR map with "ipfs" key)
	// Or 0xa1 0x65 = CBOR map with "bzzr0" key (old format)
	// Metadata is at the end, preceded by its length in the last 2 bytes

	// Check if there's a metadata length at the end
	metadataLength := int(code[len(code)-2])<<8 | int(code[len(code)-1])

	if metadataLength > 0 && metadataLength < len(code)-2 {
		// Extract metadata
		metadataStart := len(code) - 2 - metadataLength
		if metadataStart >= 0 {
			metadata := code[metadataStart : len(code)-2]
			runtime := code[:metadataStart]
			return runtime, metadata, nil
		}
	}

	// No metadata found
	return code, nil, nil
}

// IsValidBytecode checks if bytecode is structurally valid
func IsValidBytecode(code []byte) bool {
	return ValidateBytecode(code)
}
