package debug

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns an array of EIP-2718 binary-encoded transactions.
//
// Example:
// Transaction hash: "0x3a2fd1a5ea9ffee477f449be53a49398533d2c006a5815023920d1c397298df3"
// Result: "0xf8678084342770c182520894658bdf435d810c91414ec09147daa6db624063798203e880820a95a0af5fc351b9e457a31f37c84e5cd99dd3c5de60af3de33c6f4160177a2c786a60a0201da7a21046af55837330a2c52fc1543cd4d9ead00ddf178dd96935b607ff9b"
//
// Implements the debug_getRawTransaction JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "debug_getRawTransaction"

// Params represents the parameters for debug_getRawTransaction
type Params struct {
	// 32 byte hex value
	Transaction hash types.Hash `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Transaction hash,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 1 {
		return fmt.Errorf("expected 1 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.Transaction hash); err != nil {
		return fmt.Errorf("parameter 0 (Transaction hash): %w", err)
	}

	return nil
}

// Result represents the result for debug_getRawTransaction
//
// hex encoded bytes
type Result struct {
	Value types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Result.
func (r Result) MarshalJSON() ([]byte, error) {
	return json.Marshal(r.Value)
}

// UnmarshalJSON implements json.Unmarshaler for Result.
func (r *Result) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &r.Value)
}
