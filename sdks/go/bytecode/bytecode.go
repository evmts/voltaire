package bytecode

/*
#cgo CFLAGS: -I../../../zig-out/include
#cgo LDFLAGS: -L../../../zig-out/lib -lguillotine_ffi
#include <stdlib.h>
#include <string.h>

// External function from Zig
extern size_t evm_bytecode_pretty_print(const unsigned char* data, size_t data_len, char* buffer, size_t buffer_len);
*/
import "C"
import (
	"fmt"
	"unsafe"
)

// PrettyPrint formats EVM bytecode with colorized disassembly
func PrettyPrint(bytecode []byte) (string, error) {
	if len(bytecode) == 0 {
		return "", fmt.Errorf("empty bytecode")
	}

	// First call to get required buffer size
	requiredSize := C.evm_bytecode_pretty_print(
		(*C.uchar)(unsafe.Pointer(&bytecode[0])),
		C.size_t(len(bytecode)),
		nil,
		0,
	)

	if requiredSize == 0 {
		return "", fmt.Errorf("failed to pretty print bytecode")
	}

	// Allocate buffer and get the pretty printed output
	buffer := make([]byte, requiredSize)
	actualSize := C.evm_bytecode_pretty_print(
		(*C.uchar)(unsafe.Pointer(&bytecode[0])),
		C.size_t(len(bytecode)),
		(*C.char)(unsafe.Pointer(&buffer[0])),
		C.size_t(len(buffer)),
	)

	if actualSize == 0 {
		return "", fmt.Errorf("failed to pretty print bytecode")
	}

	// Convert to string (actualSize includes null terminator)
	return string(buffer[:actualSize-1]), nil
}