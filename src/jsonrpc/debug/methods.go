package debug

// Package debug provides Debug JSON-RPC methods.
//
// This file provides a type-safe mapping of debug namespace methods.

// Method name constants
const (
	MethodDebugGetBadBlocks = "debug_getBadBlocks"
	MethodDebugGetRawBlock = "debug_getRawBlock"
	MethodDebugGetRawHeader = "debug_getRawHeader"
	MethodDebugGetRawReceipts = "debug_getRawReceipts"
	MethodDebugGetRawTransaction = "debug_getRawTransaction"
)

// MethodRegistry maps method names to their string identifiers
var MethodRegistry = map[string]string{
	"debug_getBadBlocks": MethodDebugGetBadBlocks,
	"debug_getRawBlock": MethodDebugGetRawBlock,
	"debug_getRawHeader": MethodDebugGetRawHeader,
	"debug_getRawReceipts": MethodDebugGetRawReceipts,
	"debug_getRawTransaction": MethodDebugGetRawTransaction,
}
