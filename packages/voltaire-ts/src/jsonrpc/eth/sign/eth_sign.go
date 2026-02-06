package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns an EIP-191 signature over the provided data.
//
// Example:
// Address: "0x9b2055d370f73ec7d8a03e965129118dc8f5bf83"
// Message: "0xdeadbeaf"
// Result: "0xa3f20717a250c2b0b729b7e5becbff67fdaef7e0699da4de7ca5895b02a170a12d887fd3b17bfdce3481f10bea41f45ba9f709d39ce8325427b57afcfc994cee1b"
//
// Implements the eth_sign JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_sign"

// Params represents the parameters for eth_sign
type Params struct {
	// hex encoded address
	Address types.Address `json:"-"`
	// hex encoded bytes
	Message types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Address,
		p.Message,
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 2 {
		return fmt.Errorf("expected 2 parameters, got %d", len(arr))
	}

	if err := json.Unmarshal(arr[0], &p.Address); err != nil {
		return fmt.Errorf("parameter 0 (Address): %w", err)
	}

	if err := json.Unmarshal(arr[1], &p.Message); err != nil {
		return fmt.Errorf("parameter 1 (Message): %w", err)
	}

	return nil
}

// Result represents the result for eth_sign
//
// 65 hex encoded bytes
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
