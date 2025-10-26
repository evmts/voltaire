package primitives

import "testing"

func TestOpcodeString(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected string
	}{
		{STOP, "STOP"},
		{ADD, "ADD"},
		{KECCAK256, "KECCAK256"},
		{PUSH1, "PUSH1"},
		{PUSH32, "PUSH32"},
		{DUP1, "DUP1"},
		{SWAP1, "SWAP1"},
		{LOG0, "LOG0"},
		{CREATE, "CREATE"},
		{SELFDESTRUCT, "SELFDESTRUCT"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := tt.op.String()
			if result != tt.expected {
				t.Errorf("%v.String() = %s, want %s", tt.op, result, tt.expected)
			}
		})
	}
}

func TestIsPush(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected bool
	}{
		{PUSH0, true},
		{PUSH1, true},
		{PUSH16, true},
		{PUSH32, true},
		{ADD, false},
		{DUP1, false},
		{SWAP1, false},
		{STOP, false},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.IsPush()
			if result != tt.expected {
				t.Errorf("%v.IsPush() = %v, want %v", tt.op, result, tt.expected)
			}
		})
	}
}

func TestPushSize(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected int
	}{
		{PUSH0, 0},
		{PUSH1, 1},
		{PUSH2, 2},
		{PUSH16, 16},
		{PUSH32, 32},
		{ADD, 0},
		{DUP1, 0},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.PushSize()
			if result != tt.expected {
				t.Errorf("%v.PushSize() = %d, want %d", tt.op, result, tt.expected)
			}
		})
	}
}

func TestIsDup(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected bool
	}{
		{DUP1, true},
		{DUP8, true},
		{DUP16, true},
		{PUSH1, false},
		{SWAP1, false},
		{ADD, false},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.IsDup()
			if result != tt.expected {
				t.Errorf("%v.IsDup() = %v, want %v", tt.op, result, tt.expected)
			}
		})
	}
}

func TestDupPosition(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected int
	}{
		{DUP1, 1},
		{DUP2, 2},
		{DUP8, 8},
		{DUP16, 16},
		{PUSH1, 0},
		{SWAP1, 0},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.DupPosition()
			if result != tt.expected {
				t.Errorf("%v.DupPosition() = %d, want %d", tt.op, result, tt.expected)
			}
		})
	}
}

func TestIsSwap(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected bool
	}{
		{SWAP1, true},
		{SWAP8, true},
		{SWAP16, true},
		{DUP1, false},
		{PUSH1, false},
		{ADD, false},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.IsSwap()
			if result != tt.expected {
				t.Errorf("%v.IsSwap() = %v, want %v", tt.op, result, tt.expected)
			}
		})
	}
}

func TestSwapPosition(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected int
	}{
		{SWAP1, 1},
		{SWAP2, 2},
		{SWAP8, 8},
		{SWAP16, 16},
		{DUP1, 0},
		{PUSH1, 0},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.SwapPosition()
			if result != tt.expected {
				t.Errorf("%v.SwapPosition() = %d, want %d", tt.op, result, tt.expected)
			}
		})
	}
}

func TestIsLog(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected bool
	}{
		{LOG0, true},
		{LOG1, true},
		{LOG2, true},
		{LOG3, true},
		{LOG4, true},
		{PUSH1, false},
		{ADD, false},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.IsLog()
			if result != tt.expected {
				t.Errorf("%v.IsLog() = %v, want %v", tt.op, result, tt.expected)
			}
		})
	}
}

func TestLogTopics(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected int
	}{
		{LOG0, 0},
		{LOG1, 1},
		{LOG2, 2},
		{LOG3, 3},
		{LOG4, 4},
		{PUSH1, 0},
		{ADD, 0},
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.LogTopics()
			if result != tt.expected {
				t.Errorf("%v.LogTopics() = %d, want %d", tt.op, result, tt.expected)
			}
		})
	}
}

func TestIsValid(t *testing.T) {
	tests := []struct {
		op       Opcode
		expected bool
	}{
		{STOP, true},
		{ADD, true},
		{PUSH1, true},
		{PUSH32, true},
		{DUP1, true},
		{SWAP1, true},
		{LOG0, true},
		{SELFDESTRUCT, true},
		{Opcode(0xef), false}, // Undefined opcode
		{Opcode(0xa5), false}, // Between LOG4 and CREATE
	}

	for _, tt := range tests {
		t.Run(tt.op.String(), func(t *testing.T) {
			result := tt.op.IsValid()
			if result != tt.expected {
				t.Errorf("%v.IsValid() = %v, want %v", tt.op, result, tt.expected)
			}
		})
	}
}

func TestAllPushOpcodes(t *testing.T) {
	// Test all PUSH opcodes from PUSH0 to PUSH32
	for i := 0x5f; i <= 0x7f; i++ {
		op := Opcode(i)
		if !op.IsPush() {
			t.Errorf("Opcode 0x%02x should be a PUSH opcode", i)
		}

		expectedSize := 0
		if i > 0x5f {
			expectedSize = int(i) - 0x5f
		}

		if op.PushSize() != expectedSize {
			t.Errorf("Opcode 0x%02x should have PushSize %d, got %d", i, expectedSize, op.PushSize())
		}
	}
}

func TestAllDupOpcodes(t *testing.T) {
	// Test all DUP opcodes from DUP1 to DUP16
	for i := 0x80; i <= 0x8f; i++ {
		op := Opcode(i)
		if !op.IsDup() {
			t.Errorf("Opcode 0x%02x should be a DUP opcode", i)
		}

		expectedPos := int(i) - 0x7f
		if op.DupPosition() != expectedPos {
			t.Errorf("Opcode 0x%02x should have DupPosition %d, got %d", i, expectedPos, op.DupPosition())
		}
	}
}

func TestAllSwapOpcodes(t *testing.T) {
	// Test all SWAP opcodes from SWAP1 to SWAP16
	for i := 0x90; i <= 0x9f; i++ {
		op := Opcode(i)
		if !op.IsSwap() {
			t.Errorf("Opcode 0x%02x should be a SWAP opcode", i)
		}

		expectedPos := int(i) - 0x8f
		if op.SwapPosition() != expectedPos {
			t.Errorf("Opcode 0x%02x should have SwapPosition %d, got %d", i, expectedPos, op.SwapPosition())
		}
	}
}

func TestAllLogOpcodes(t *testing.T) {
	// Test all LOG opcodes from LOG0 to LOG4
	for i := 0xa0; i <= 0xa4; i++ {
		op := Opcode(i)
		if !op.IsLog() {
			t.Errorf("Opcode 0x%02x should be a LOG opcode", i)
		}

		expectedTopics := int(i) - 0xa0
		if op.LogTopics() != expectedTopics {
			t.Errorf("Opcode 0x%02x should have LogTopics %d, got %d", i, expectedTopics, op.LogTopics())
		}
	}
}

func TestOpcodeBoundaries(t *testing.T) {
	// Test boundary conditions
	if Opcode(0x5e).IsPush() {
		t.Error("0x5e (MCOPY) should not be a PUSH opcode")
	}

	if !Opcode(0x5f).IsPush() {
		t.Error("0x5f (PUSH0) should be a PUSH opcode")
	}

	if !Opcode(0x7f).IsPush() {
		t.Error("0x7f (PUSH32) should be a PUSH opcode")
	}

	if Opcode(0x80).IsPush() {
		t.Error("0x80 (DUP1) should not be a PUSH opcode")
	}
}
