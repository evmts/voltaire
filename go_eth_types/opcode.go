// EVM Opcode enumeration and utilities
//
// This module provides comprehensive support for all EVM opcodes with
// utilities for opcode properties, gas costs, and stack requirements.

package primitives

import "fmt"

// Opcode represents an EVM opcode
type Opcode byte

// 0x00s: Stop and Arithmetic Operations
const (
	STOP       Opcode = 0x00
	ADD        Opcode = 0x01
	MUL        Opcode = 0x02
	SUB        Opcode = 0x03
	DIV        Opcode = 0x04
	SDIV       Opcode = 0x05
	MOD        Opcode = 0x06
	SMOD       Opcode = 0x07
	ADDMOD     Opcode = 0x08
	MULMOD     Opcode = 0x09
	EXP        Opcode = 0x0a
	SIGNEXTEND Opcode = 0x0b
)

// 0x10s: Comparison & Bitwise Logic Operations
const (
	LT     Opcode = 0x10
	GT     Opcode = 0x11
	SLT    Opcode = 0x12
	SGT    Opcode = 0x13
	EQ     Opcode = 0x14
	ISZERO Opcode = 0x15
	AND    Opcode = 0x16
	OR     Opcode = 0x17
	XOR    Opcode = 0x18
	NOT    Opcode = 0x19
	BYTE   Opcode = 0x1a
	SHL    Opcode = 0x1b
	SHR    Opcode = 0x1c
	SAR    Opcode = 0x1d
)

// 0x20s: Crypto
const (
	KECCAK256 Opcode = 0x20
)

// 0x30s: Environmental Information
const (
	ADDRESS        Opcode = 0x30
	BALANCE        Opcode = 0x31
	ORIGIN         Opcode = 0x32
	CALLER         Opcode = 0x33
	CALLVALUE      Opcode = 0x34
	CALLDATALOAD   Opcode = 0x35
	CALLDATASIZE   Opcode = 0x36
	CALLDATACOPY   Opcode = 0x37
	CODESIZE       Opcode = 0x38
	CODECOPY       Opcode = 0x39
	GASPRICE       Opcode = 0x3a
	EXTCODESIZE    Opcode = 0x3b
	EXTCODECOPY    Opcode = 0x3c
	RETURNDATASIZE Opcode = 0x3d
	RETURNDATACOPY Opcode = 0x3e
	EXTCODEHASH    Opcode = 0x3f
)

// 0x40s: Block Information
const (
	BLOCKHASH   Opcode = 0x40
	COINBASE    Opcode = 0x41
	TIMESTAMP   Opcode = 0x42
	NUMBER      Opcode = 0x43
	DIFFICULTY  Opcode = 0x44 // PREVRANDAO after Merge
	GASLIMIT    Opcode = 0x45
	CHAINID     Opcode = 0x46
	SELFBALANCE Opcode = 0x47
	BASEFEE     Opcode = 0x48
	BLOBHASH    Opcode = 0x49
	BLOBBASEFEE Opcode = 0x4a
)

// 0x50s: Stack, Memory, Storage and Flow Operations
const (
	POP      Opcode = 0x50
	MLOAD    Opcode = 0x51
	MSTORE   Opcode = 0x52
	MSTORE8  Opcode = 0x53
	SLOAD    Opcode = 0x54
	SSTORE   Opcode = 0x55
	JUMP     Opcode = 0x56
	JUMPI    Opcode = 0x57
	PC       Opcode = 0x58
	MSIZE    Opcode = 0x59
	GAS      Opcode = 0x5a
	JUMPDEST Opcode = 0x5b
	TLOAD    Opcode = 0x5c
	TSTORE   Opcode = 0x5d
	MCOPY    Opcode = 0x5e
	PUSH0    Opcode = 0x5f
)

// 0x60-0x7f: PUSH1-PUSH32
const (
	PUSH1  Opcode = 0x60
	PUSH2  Opcode = 0x61
	PUSH3  Opcode = 0x62
	PUSH4  Opcode = 0x63
	PUSH5  Opcode = 0x64
	PUSH6  Opcode = 0x65
	PUSH7  Opcode = 0x66
	PUSH8  Opcode = 0x67
	PUSH9  Opcode = 0x68
	PUSH10 Opcode = 0x69
	PUSH11 Opcode = 0x6a
	PUSH12 Opcode = 0x6b
	PUSH13 Opcode = 0x6c
	PUSH14 Opcode = 0x6d
	PUSH15 Opcode = 0x6e
	PUSH16 Opcode = 0x6f
	PUSH17 Opcode = 0x70
	PUSH18 Opcode = 0x71
	PUSH19 Opcode = 0x72
	PUSH20 Opcode = 0x73
	PUSH21 Opcode = 0x74
	PUSH22 Opcode = 0x75
	PUSH23 Opcode = 0x76
	PUSH24 Opcode = 0x77
	PUSH25 Opcode = 0x78
	PUSH26 Opcode = 0x79
	PUSH27 Opcode = 0x7a
	PUSH28 Opcode = 0x7b
	PUSH29 Opcode = 0x7c
	PUSH30 Opcode = 0x7d
	PUSH31 Opcode = 0x7e
	PUSH32 Opcode = 0x7f
)

// 0x80s: DUP1-DUP16
const (
	DUP1  Opcode = 0x80
	DUP2  Opcode = 0x81
	DUP3  Opcode = 0x82
	DUP4  Opcode = 0x83
	DUP5  Opcode = 0x84
	DUP6  Opcode = 0x85
	DUP7  Opcode = 0x86
	DUP8  Opcode = 0x87
	DUP9  Opcode = 0x88
	DUP10 Opcode = 0x89
	DUP11 Opcode = 0x8a
	DUP12 Opcode = 0x8b
	DUP13 Opcode = 0x8c
	DUP14 Opcode = 0x8d
	DUP15 Opcode = 0x8e
	DUP16 Opcode = 0x8f
)

// 0x90s: SWAP1-SWAP16
const (
	SWAP1  Opcode = 0x90
	SWAP2  Opcode = 0x91
	SWAP3  Opcode = 0x92
	SWAP4  Opcode = 0x93
	SWAP5  Opcode = 0x94
	SWAP6  Opcode = 0x95
	SWAP7  Opcode = 0x96
	SWAP8  Opcode = 0x97
	SWAP9  Opcode = 0x98
	SWAP10 Opcode = 0x99
	SWAP11 Opcode = 0x9a
	SWAP12 Opcode = 0x9b
	SWAP13 Opcode = 0x9c
	SWAP14 Opcode = 0x9d
	SWAP15 Opcode = 0x9e
	SWAP16 Opcode = 0x9f
)

// 0xa0s: LOG0-LOG4
const (
	LOG0 Opcode = 0xa0
	LOG1 Opcode = 0xa1
	LOG2 Opcode = 0xa2
	LOG3 Opcode = 0xa3
	LOG4 Opcode = 0xa4
)

// 0xf0s: System Operations
const (
	CREATE       Opcode = 0xf0
	CALL         Opcode = 0xf1
	CALLCODE     Opcode = 0xf2
	RETURN       Opcode = 0xf3
	DELEGATECALL Opcode = 0xf4
	CREATE2      Opcode = 0xf5
	AUTH         Opcode = 0xf6 // EIP-3074
	AUTHCALL     Opcode = 0xf7 // EIP-3074
	STATICCALL   Opcode = 0xfa
	REVERT       Opcode = 0xfd
	INVALID      Opcode = 0xfe
	SELFDESTRUCT Opcode = 0xff
)

// String returns the name of the opcode
func (op Opcode) String() string {
	switch op {
	case STOP:
		return "STOP"
	case ADD:
		return "ADD"
	case MUL:
		return "MUL"
	case SUB:
		return "SUB"
	case DIV:
		return "DIV"
	case SDIV:
		return "SDIV"
	case MOD:
		return "MOD"
	case SMOD:
		return "SMOD"
	case ADDMOD:
		return "ADDMOD"
	case MULMOD:
		return "MULMOD"
	case EXP:
		return "EXP"
	case SIGNEXTEND:
		return "SIGNEXTEND"
	case LT:
		return "LT"
	case GT:
		return "GT"
	case SLT:
		return "SLT"
	case SGT:
		return "SGT"
	case EQ:
		return "EQ"
	case ISZERO:
		return "ISZERO"
	case AND:
		return "AND"
	case OR:
		return "OR"
	case XOR:
		return "XOR"
	case NOT:
		return "NOT"
	case BYTE:
		return "BYTE"
	case SHL:
		return "SHL"
	case SHR:
		return "SHR"
	case SAR:
		return "SAR"
	case KECCAK256:
		return "KECCAK256"
	case ADDRESS:
		return "ADDRESS"
	case BALANCE:
		return "BALANCE"
	case ORIGIN:
		return "ORIGIN"
	case CALLER:
		return "CALLER"
	case CALLVALUE:
		return "CALLVALUE"
	case CALLDATALOAD:
		return "CALLDATALOAD"
	case CALLDATASIZE:
		return "CALLDATASIZE"
	case CALLDATACOPY:
		return "CALLDATACOPY"
	case CODESIZE:
		return "CODESIZE"
	case CODECOPY:
		return "CODECOPY"
	case GASPRICE:
		return "GASPRICE"
	case EXTCODESIZE:
		return "EXTCODESIZE"
	case EXTCODECOPY:
		return "EXTCODECOPY"
	case RETURNDATASIZE:
		return "RETURNDATASIZE"
	case RETURNDATACOPY:
		return "RETURNDATACOPY"
	case EXTCODEHASH:
		return "EXTCODEHASH"
	case BLOCKHASH:
		return "BLOCKHASH"
	case COINBASE:
		return "COINBASE"
	case TIMESTAMP:
		return "TIMESTAMP"
	case NUMBER:
		return "NUMBER"
	case DIFFICULTY:
		return "DIFFICULTY"
	case GASLIMIT:
		return "GASLIMIT"
	case CHAINID:
		return "CHAINID"
	case SELFBALANCE:
		return "SELFBALANCE"
	case BASEFEE:
		return "BASEFEE"
	case BLOBHASH:
		return "BLOBHASH"
	case BLOBBASEFEE:
		return "BLOBBASEFEE"
	case POP:
		return "POP"
	case MLOAD:
		return "MLOAD"
	case MSTORE:
		return "MSTORE"
	case MSTORE8:
		return "MSTORE8"
	case SLOAD:
		return "SLOAD"
	case SSTORE:
		return "SSTORE"
	case JUMP:
		return "JUMP"
	case JUMPI:
		return "JUMPI"
	case PC:
		return "PC"
	case MSIZE:
		return "MSIZE"
	case GAS:
		return "GAS"
	case JUMPDEST:
		return "JUMPDEST"
	case TLOAD:
		return "TLOAD"
	case TSTORE:
		return "TSTORE"
	case MCOPY:
		return "MCOPY"
	case PUSH0:
		return "PUSH0"
	case PUSH1:
		return "PUSH1"
	case PUSH2:
		return "PUSH2"
	case PUSH3:
		return "PUSH3"
	case PUSH4:
		return "PUSH4"
	case PUSH5:
		return "PUSH5"
	case PUSH6:
		return "PUSH6"
	case PUSH7:
		return "PUSH7"
	case PUSH8:
		return "PUSH8"
	case PUSH9:
		return "PUSH9"
	case PUSH10:
		return "PUSH10"
	case PUSH11:
		return "PUSH11"
	case PUSH12:
		return "PUSH12"
	case PUSH13:
		return "PUSH13"
	case PUSH14:
		return "PUSH14"
	case PUSH15:
		return "PUSH15"
	case PUSH16:
		return "PUSH16"
	case PUSH17:
		return "PUSH17"
	case PUSH18:
		return "PUSH18"
	case PUSH19:
		return "PUSH19"
	case PUSH20:
		return "PUSH20"
	case PUSH21:
		return "PUSH21"
	case PUSH22:
		return "PUSH22"
	case PUSH23:
		return "PUSH23"
	case PUSH24:
		return "PUSH24"
	case PUSH25:
		return "PUSH25"
	case PUSH26:
		return "PUSH26"
	case PUSH27:
		return "PUSH27"
	case PUSH28:
		return "PUSH28"
	case PUSH29:
		return "PUSH29"
	case PUSH30:
		return "PUSH30"
	case PUSH31:
		return "PUSH31"
	case PUSH32:
		return "PUSH32"
	case DUP1:
		return "DUP1"
	case DUP2:
		return "DUP2"
	case DUP3:
		return "DUP3"
	case DUP4:
		return "DUP4"
	case DUP5:
		return "DUP5"
	case DUP6:
		return "DUP6"
	case DUP7:
		return "DUP7"
	case DUP8:
		return "DUP8"
	case DUP9:
		return "DUP9"
	case DUP10:
		return "DUP10"
	case DUP11:
		return "DUP11"
	case DUP12:
		return "DUP12"
	case DUP13:
		return "DUP13"
	case DUP14:
		return "DUP14"
	case DUP15:
		return "DUP15"
	case DUP16:
		return "DUP16"
	case SWAP1:
		return "SWAP1"
	case SWAP2:
		return "SWAP2"
	case SWAP3:
		return "SWAP3"
	case SWAP4:
		return "SWAP4"
	case SWAP5:
		return "SWAP5"
	case SWAP6:
		return "SWAP6"
	case SWAP7:
		return "SWAP7"
	case SWAP8:
		return "SWAP8"
	case SWAP9:
		return "SWAP9"
	case SWAP10:
		return "SWAP10"
	case SWAP11:
		return "SWAP11"
	case SWAP12:
		return "SWAP12"
	case SWAP13:
		return "SWAP13"
	case SWAP14:
		return "SWAP14"
	case SWAP15:
		return "SWAP15"
	case SWAP16:
		return "SWAP16"
	case LOG0:
		return "LOG0"
	case LOG1:
		return "LOG1"
	case LOG2:
		return "LOG2"
	case LOG3:
		return "LOG3"
	case LOG4:
		return "LOG4"
	case CREATE:
		return "CREATE"
	case CALL:
		return "CALL"
	case CALLCODE:
		return "CALLCODE"
	case RETURN:
		return "RETURN"
	case DELEGATECALL:
		return "DELEGATECALL"
	case CREATE2:
		return "CREATE2"
	case AUTH:
		return "AUTH"
	case AUTHCALL:
		return "AUTHCALL"
	case STATICCALL:
		return "STATICCALL"
	case REVERT:
		return "REVERT"
	case INVALID:
		return "INVALID"
	case SELFDESTRUCT:
		return "SELFDESTRUCT"
	default:
		return fmt.Sprintf("UNKNOWN(0x%02x)", byte(op))
	}
}

// IsPush checks if opcode is a PUSH operation (PUSH0-PUSH32)
func (op Opcode) IsPush() bool {
	return op >= 0x5f && op <= 0x7f
}

// PushSize returns the number of bytes pushed for PUSH operations (0-32)
// Returns 0 for non-PUSH opcodes
func (op Opcode) PushSize() int {
	if !op.IsPush() {
		return 0
	}
	if op == 0x5f {
		return 0 // PUSH0
	}
	return int(op) - 0x5f
}

// IsDup checks if opcode is a DUP operation (DUP1-DUP16)
func (op Opcode) IsDup() bool {
	return op >= 0x80 && op <= 0x8f
}

// DupPosition returns the DUP position (1-16)
// Returns 0 for non-DUP opcodes
func (op Opcode) DupPosition() int {
	if !op.IsDup() {
		return 0
	}
	return int(op) - 0x7f
}

// IsSwap checks if opcode is a SWAP operation (SWAP1-SWAP16)
func (op Opcode) IsSwap() bool {
	return op >= 0x90 && op <= 0x9f
}

// SwapPosition returns the SWAP position (1-16)
// Returns 0 for non-SWAP opcodes
func (op Opcode) SwapPosition() int {
	if !op.IsSwap() {
		return 0
	}
	return int(op) - 0x8f
}

// IsLog checks if opcode is a LOG operation (LOG0-LOG4)
func (op Opcode) IsLog() bool {
	return op >= 0xa0 && op <= 0xa4
}

// LogTopics returns the number of topics for LOG operations (0-4)
// Returns 0 for non-LOG opcodes
func (op Opcode) LogTopics() int {
	if !op.IsLog() {
		return 0
	}
	return int(op) - 0xa0
}

// IsValid checks if the opcode is a valid EVM opcode
func (op Opcode) IsValid() bool {
	// Check if it's a defined opcode
	switch op {
	case STOP, ADD, MUL, SUB, DIV, SDIV, MOD, SMOD, ADDMOD, MULMOD, EXP, SIGNEXTEND,
		LT, GT, SLT, SGT, EQ, ISZERO, AND, OR, XOR, NOT, BYTE, SHL, SHR, SAR,
		KECCAK256,
		ADDRESS, BALANCE, ORIGIN, CALLER, CALLVALUE, CALLDATALOAD, CALLDATASIZE, CALLDATACOPY,
		CODESIZE, CODECOPY, GASPRICE, EXTCODESIZE, EXTCODECOPY, RETURNDATASIZE, RETURNDATACOPY, EXTCODEHASH,
		BLOCKHASH, COINBASE, TIMESTAMP, NUMBER, DIFFICULTY, GASLIMIT, CHAINID, SELFBALANCE, BASEFEE, BLOBHASH, BLOBBASEFEE,
		POP, MLOAD, MSTORE, MSTORE8, SLOAD, SSTORE, JUMP, JUMPI, PC, MSIZE, GAS, JUMPDEST, TLOAD, TSTORE, MCOPY,
		CREATE, CALL, CALLCODE, RETURN, DELEGATECALL, CREATE2, AUTH, AUTHCALL, STATICCALL, REVERT, INVALID, SELFDESTRUCT:
		return true
	}

	// Check if it's a PUSH, DUP, SWAP, or LOG opcode
	return op.IsPush() || op.IsDup() || op.IsSwap() || op.IsLog()
}
