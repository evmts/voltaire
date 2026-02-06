// Package jsonrpc provides Ethereum JSON-RPC type definitions.
//
// This package combines all namespace methods into a unified interface.
// Methods are organized by namespace for tree-shakability - import only
// the namespaces you need.
package jsonrpc

// Available namespaces:
//   - engine: import "github.com/ethereum/execution-apis/engine"
//   - eth: import "github.com/ethereum/execution-apis/eth"
//   - debug: import "github.com/ethereum/execution-apis/debug"
//
// Primitive types are available at:
//   - types: import "github.com/ethereum/execution-apis/types"
