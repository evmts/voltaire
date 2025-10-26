package primitives

import (
	"testing"
)

// Test JUMPDEST analysis with simple bytecode
func TestAnalyzeJumpDestSimple(t *testing.T) {
	// JUMPDEST, STOP, JUMPDEST
	code := []byte{0x5b, 0x00, 0x5b}
	bc := NewBytecode(code)

	if !bc.IsValidJumpDest(0) {
		t.Error("Position 0 should be valid JUMPDEST")
	}
	if bc.IsValidJumpDest(1) {
		t.Error("Position 1 should not be valid JUMPDEST")
	}
	if !bc.IsValidJumpDest(2) {
		t.Error("Position 2 should be valid JUMPDEST")
	}
}

// Test PUSH data containing JUMPDEST opcode
func TestAnalyzeJumpDestPushData(t *testing.T) {
	// PUSH1 0x5b (pushes JUMPDEST opcode as data), JUMPDEST (actual valid jump destination)
	code := []byte{0x60, 0x5b, 0x5b}
	bc := NewBytecode(code)

	// Only position 2 should be valid (the actual JUMPDEST)
	// Position 1 (the 0x5b in PUSH data) should NOT be valid
	if bc.IsValidJumpDest(0) {
		t.Error("Position 0 should not be valid JUMPDEST")
	}
	if bc.IsValidJumpDest(1) {
		t.Error("Position 1 (PUSH data) should not be valid JUMPDEST")
	}
	if !bc.IsValidJumpDest(2) {
		t.Error("Position 2 should be valid JUMPDEST")
	}
}

// Test PUSH32 with embedded JUMPDEST bytes
func TestAnalyzeJumpDestPush32(t *testing.T) {
	code := make([]byte, 34)
	code[0] = 0x7f // PUSH32
	// Fill with 32 bytes of data, including some 0x5b (JUMPDEST) bytes
	for i := 1; i < 33; i++ {
		if i%2 == 0 {
			code[i] = 0x5b
		} else {
			code[i] = 0x00
		}
	}
	code[33] = 0x5b // Actual JUMPDEST after PUSH32

	bc := NewBytecode(code)

	// Only position 33 should be valid
	if bc.IsValidJumpDest(0) {
		t.Error("Position 0 should not be valid JUMPDEST")
	}
	for i := 1; i < 33; i++ {
		if bc.IsValidJumpDest(i) {
			t.Errorf("Position %d (inside PUSH32) should not be valid JUMPDEST", i)
		}
	}
	if !bc.IsValidJumpDest(33) {
		t.Error("Position 33 should be valid JUMPDEST")
	}
}

// Test empty bytecode
func TestAnalyzeJumpDestEmpty(t *testing.T) {
	code := []byte{}
	bc := NewBytecode(code)

	if bc.IsValidJumpDest(0) {
		t.Error("Empty bytecode should have no valid JUMPDESTs")
	}

	if bc.Length() != 0 {
		t.Errorf("Expected length 0, got %d", bc.Length())
	}
}

// Test no valid jump destinations
func TestAnalyzeJumpDestNone(t *testing.T) {
	// PUSH1 1, PUSH1 2, ADD, STOP
	code := []byte{0x60, 0x01, 0x60, 0x02, 0x01, 0x00}
	bc := NewBytecode(code)

	for i := 0; i < len(code); i++ {
		if bc.IsValidJumpDest(i) {
			t.Errorf("Position %d should not be valid JUMPDEST", i)
		}
	}

	if bc.HasJumpDests() {
		t.Error("Bytecode should not have any JUMPDESTs")
	}
}

// Test multiple consecutive JUMPDESTs
func TestAnalyzeJumpDestConsecutive(t *testing.T) {
	// JUMPDEST, JUMPDEST, JUMPDEST, STOP
	code := []byte{0x5b, 0x5b, 0x5b, 0x00}
	bc := NewBytecode(code)

	if !bc.IsValidJumpDest(0) {
		t.Error("Position 0 should be valid JUMPDEST")
	}
	if !bc.IsValidJumpDest(1) {
		t.Error("Position 1 should be valid JUMPDEST")
	}
	if !bc.IsValidJumpDest(2) {
		t.Error("Position 2 should be valid JUMPDEST")
	}
	if bc.IsValidJumpDest(3) {
		t.Error("Position 3 should not be valid JUMPDEST")
	}

	if !bc.HasJumpDests() {
		t.Error("Bytecode should have JUMPDESTs")
	}
}

// Test bytecode boundary checking
func TestIsBytecodeBoundary(t *testing.T) {
	// PUSH1 1, JUMPDEST, STOP
	code := []byte{0x60, 0x01, 0x5b, 0x00}

	tests := []struct {
		position int
		expected bool
	}{
		{0, true},  // PUSH1
		{1, false}, // PUSH1 data
		{2, true},  // JUMPDEST
		{3, true},  // STOP
		{4, false}, // Out of bounds
	}

	for _, tt := range tests {
		result := IsBytecodeBoundary(code, tt.position)
		if result != tt.expected {
			t.Errorf("IsBytecodeBoundary(%d) = %v, expected %v", tt.position, result, tt.expected)
		}
	}
}

// Test bytecode validation
func TestValidateBytecode(t *testing.T) {
	tests := []struct {
		name     string
		code     []byte
		expected bool
	}{
		{
			"valid simple",
			[]byte{0x60, 0x01, 0x5b, 0x00},
			true,
		},
		{
			"truncated PUSH1",
			[]byte{0x60}, // PUSH1 with no data
			false,
		},
		{
			"truncated PUSH2",
			[]byte{0x61, 0x01}, // PUSH2 with only 1 byte
			false,
		},
		{
			"valid PUSH32",
			append([]byte{0x7f}, make([]byte, 32)...),
			true,
		},
		{
			"truncated PUSH32",
			append([]byte{0x7f}, make([]byte, 30)...), // Only 30 bytes
			false,
		},
		{
			"empty bytecode",
			[]byte{},
			true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateBytecode(tt.code)
			if result != tt.expected {
				t.Errorf("ValidateBytecode() = %v, expected %v", result, tt.expected)
			}
		})
	}
}

// Test GetOpcode
func TestGetOpcode(t *testing.T) {
	code := []byte{0x60, 0x01, 0x5b}
	bc := NewBytecode(code)

	tests := []struct {
		position    int
		expected    byte
		shouldError bool
	}{
		{0, 0x60, false},
		{1, 0x01, false},
		{2, 0x5b, false},
		{3, 0x00, true}, // Out of bounds
	}

	for _, tt := range tests {
		opcode, err := bc.GetOpcode(tt.position)
		if tt.shouldError {
			if err == nil {
				t.Errorf("GetOpcode(%d) should return error", tt.position)
			}
		} else {
			if err != nil {
				t.Errorf("GetOpcode(%d) returned unexpected error: %v", tt.position, err)
			}
			if opcode != tt.expected {
				t.Errorf("GetOpcode(%d) = 0x%x, expected 0x%x", tt.position, opcode, tt.expected)
			}
		}
	}
}

// Test GetPushData
func TestGetPushData(t *testing.T) {
	// PUSH1 0xff, PUSH2 0x1234, STOP
	code := []byte{0x60, 0xff, 0x61, 0x12, 0x34, 0x00}
	bc := NewBytecode(code)

	tests := []struct {
		position    int
		expected    []byte
		shouldError bool
	}{
		{0, []byte{0xff}, false},        // PUSH1
		{2, []byte{0x12, 0x34}, false},  // PUSH2
		{5, nil, true},                   // STOP (not a PUSH)
		{10, nil, true},                  // Out of bounds
	}

	for _, tt := range tests {
		data, err := bc.GetPushData(tt.position)
		if tt.shouldError {
			if err == nil {
				t.Errorf("GetPushData(%d) should return error", tt.position)
			}
		} else {
			if err != nil {
				t.Errorf("GetPushData(%d) returned unexpected error: %v", tt.position, err)
			}
			if len(data) != len(tt.expected) {
				t.Errorf("GetPushData(%d) length = %d, expected %d", tt.position, len(data), len(tt.expected))
			}
			for i := range data {
				if data[i] != tt.expected[i] {
					t.Errorf("GetPushData(%d)[%d] = 0x%x, expected 0x%x", tt.position, i, data[i], tt.expected[i])
				}
			}
		}
	}
}

// Test complex real-world-like bytecode
func TestComplexBytecode(t *testing.T) {
	// Simulate a more complex bytecode pattern like a simple contract
	code := []byte{
		// Constructor-like pattern
		0x60, 0x80,       // PUSH1 0x80 (pos 0-1)
		0x60, 0x40,       // PUSH1 0x40 (pos 2-3)
		0x52,             // MSTORE (pos 4)
		0x5b,             // JUMPDEST (pos 5)
		0x60, 0x00,       // PUSH1 0x00 (pos 6-7)
		0x35,             // CALLDATALOAD (pos 8)
		0x60, 0xe0,       // PUSH1 0xe0 (pos 9-10)
		0x1c,             // SHR (pos 11)
		0x63, 0x12, 0x34, 0x56, 0x78, // PUSH4 0x12345678 (pos 12-16)
		0x5b,                   // JUMPDEST (pos 17)
		0x14,                   // EQ (pos 18)
		0x61, 0x00, 0x1e,       // PUSH2 0x001e (pos 19-21)
		0x57,                   // JUMPI (pos 22)
		0x5b,                   // JUMPDEST (pos 23)
		0x00,                   // STOP (pos 24)
	}

	bc := NewBytecode(code)

	// Verify JUMPDESTs at correct positions
	expectedJumpDests := []int{5, 17, 23}
	for _, pos := range expectedJumpDests {
		if !bc.IsValidJumpDest(pos) {
			t.Errorf("Position %d should be valid JUMPDEST", pos)
		}
	}

	// Verify non-JUMPDESTs
	nonJumpDests := []int{0, 7, 15, 20}
	for _, pos := range nonJumpDests {
		if bc.IsValidJumpDest(pos) {
			t.Errorf("Position %d should not be valid JUMPDEST", pos)
		}
	}

	// Test PUSH data extraction
	data, err := bc.GetPushData(0)
	if err != nil {
		t.Fatalf("GetPushData(0) failed: %v", err)
	}
	if len(data) != 1 || data[0] != 0x80 {
		t.Errorf("Expected PUSH1 data [0x80], got %v", data)
	}

	data, err = bc.GetPushData(12)
	if err != nil {
		t.Fatalf("GetPushData(12) failed: %v", err)
	}
	expected := []byte{0x12, 0x34, 0x56, 0x78}
	if len(data) != 4 {
		t.Errorf("Expected 4 bytes, got %d", len(data))
	}
	for i := range data {
		if data[i] != expected[i] {
			t.Errorf("PUSH4 data mismatch at byte %d", i)
		}
	}
}

// Test all PUSH opcodes (PUSH1 through PUSH32)
func TestBytecodeAllPushOpcodes(t *testing.T) {
	// Create bytecode with all PUSH opcodes followed by JUMPDEST
	var code []byte

	// PUSH1 through PUSH32
	for pushNum := 1; pushNum <= 32; pushNum++ {
		opcode := byte(0x5f + pushNum) // PUSH1 = 0x60, PUSH2 = 0x61, ..., PUSH32 = 0x7f
		code = append(code, opcode)

		// Fill with dummy data
		for i := 0; i < pushNum; i++ {
			code = append(code, 0xaa)
		}
	}

	// Add final JUMPDEST
	finalJumpDestPos := len(code)
	code = append(code, 0x5b)

	bc := NewBytecode(code)

	// Only the final position should be a valid JUMPDEST
	if !bc.IsValidJumpDest(finalJumpDestPos) {
		t.Errorf("Position %d should be valid JUMPDEST", finalJumpDestPos)
	}

	// Verify none of the PUSH data bytes are treated as JUMPDEST
	for pos := 0; pos < finalJumpDestPos; pos++ {
		if bc.IsValidJumpDest(pos) {
			t.Errorf("Position %d (inside PUSH) should not be valid JUMPDEST", pos)
		}
	}
}

// Test PUSH32 followed immediately by JUMPDEST
func TestPush32FollowedByJumpdest(t *testing.T) {
	code := make([]byte, 34)
	code[0] = 0x7f // PUSH32
	for i := 1; i < 33; i++ {
		code[i] = byte(i)
	}
	code[33] = 0x5b // JUMPDEST

	bc := NewBytecode(code)

	// Only position 33 should be JUMPDEST
	if bc.IsValidJumpDest(0) {
		t.Error("Position 0 should not be valid JUMPDEST")
	}
	for i := 1; i < 33; i++ {
		if bc.IsValidJumpDest(i) {
			t.Errorf("Position %d should not be valid JUMPDEST", i)
		}
	}
	if !bc.IsValidJumpDest(33) {
		t.Error("Position 33 should be valid JUMPDEST")
	}

	// Verify PUSH32 data can be read
	data, err := bc.GetPushData(0)
	if err != nil {
		t.Fatalf("GetPushData(0) failed: %v", err)
	}
	if len(data) != 32 {
		t.Errorf("Expected 32 bytes, got %d", len(data))
	}
}

// Test incomplete PUSH at end of bytecode
func TestIncompletePushAtEnd(t *testing.T) {
	// PUSH1 0x01 (complete), PUSH2 0x02?? (incomplete, missing 1 byte)
	code := []byte{0x60, 0x01, 0x61, 0x02}

	bc := NewBytecode(code)

	if bc.Length() != 4 {
		t.Errorf("Expected length 4, got %d", bc.Length())
	}

	// First PUSH1 should work
	data, err := bc.GetPushData(0)
	if err != nil {
		t.Fatalf("GetPushData(0) failed: %v", err)
	}
	if len(data) != 1 || data[0] != 0x01 {
		t.Errorf("Expected [0x01], got %v", data)
	}

	// Second PUSH2 is incomplete
	_, err = bc.GetPushData(2)
	if err == nil {
		t.Error("GetPushData(2) should fail for incomplete PUSH2")
	}

	// Validation should fail
	if ValidateBytecode(code) {
		t.Error("ValidateBytecode should return false for incomplete PUSH")
	}
}

// Test GetJumpDestPositions
func TestGetJumpDestPositions(t *testing.T) {
	// JUMPDEST, STOP, JUMPDEST, STOP, JUMPDEST
	code := []byte{0x5b, 0x00, 0x5b, 0x00, 0x5b}
	bc := NewBytecode(code)

	positions := bc.GetJumpDestPositions()

	expected := map[int]bool{0: true, 2: true, 4: true}
	if len(positions) != len(expected) {
		t.Errorf("Expected %d positions, got %d", len(expected), len(positions))
	}

	for _, pos := range positions {
		if !expected[pos] {
			t.Errorf("Unexpected position %d in results", pos)
		}
	}
}

// Test ExtractMetadata
func TestExtractMetadata(t *testing.T) {
	tests := []struct {
		name              string
		code              []byte
		expectRuntime     []byte
		expectMetadata    []byte
	}{
		{
			"no metadata",
			[]byte{0x60, 0x80, 0x60, 0x40},
			[]byte{0x60, 0x80, 0x60, 0x40},
			nil,
		},
		{
			"with metadata",
			[]byte{0x60, 0x80, 0xa1, 0x65, 0x00, 0x05}, // Length 5, encoded at end
			[]byte{0x60, 0x80},
			[]byte{0xa1, 0x65},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			runtime, metadata, err := ExtractMetadata(tt.code)
			if err != nil {
				t.Fatalf("ExtractMetadata failed: %v", err)
			}

			if tt.expectMetadata == nil {
				if metadata != nil {
					t.Errorf("Expected no metadata, got %v", metadata)
				}
			} else {
				if len(metadata) != len(tt.expectMetadata) {
					t.Errorf("Metadata length mismatch: expected %d, got %d", len(tt.expectMetadata), len(metadata))
				}
			}

			if len(runtime) != len(tt.expectRuntime) {
				t.Errorf("Runtime length mismatch: expected %d, got %d", len(tt.expectRuntime), len(runtime))
			}
		})
	}
}

// Test IsValidBytecode wrapper
func TestBytecodeIsValid(t *testing.T) {
	validCode := []byte{0x60, 0x01, 0x5b, 0x00}
	if !IsValidBytecode(validCode) {
		t.Error("Valid bytecode should return true")
	}

	invalidCode := []byte{0x60} // Truncated PUSH1
	if IsValidBytecode(invalidCode) {
		t.Error("Invalid bytecode should return false")
	}
}

// Benchmark JUMPDEST analysis
func BenchmarkAnalyzeJumpDest(b *testing.B) {
	// Create a large bytecode (10KB) with scattered JUMPDESTs
	code := make([]byte, 10*1024)
	for i := 0; i < len(code); i++ {
		if i%100 == 0 {
			code[i] = 0x5b // JUMPDEST
		} else if i%50 == 0 {
			code[i] = 0x60 // PUSH1
		} else {
			code[i] = 0x00 // STOP
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = NewBytecode(code)
	}
}

// Benchmark validation
func BenchmarkValidateBytecode(b *testing.B) {
	code := make([]byte, 10*1024)
	for i := 0; i < len(code); i++ {
		if i%100 == 0 {
			code[i] = 0x5b
		} else {
			code[i] = 0x00
		}
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_ = ValidateBytecode(code)
	}
}
