package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Signs and submits a transaction.
//
// Example:
// Transaction: ...
// Result: "0xe670ec64341771606e55d6b4ca35a1a6b75ee3d5145a99d05921026d1527331"
//
// Implements the eth_sendTransaction JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_sendTransaction"

// Params represents the parameters for eth_sendTransaction
type Params struct {
	// Transaction object generic to all types
	Transaction types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Transaction,
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

	if err := json.Unmarshal(arr[0], &p.Transaction); err != nil {
		return fmt.Errorf("parameter 0 (Transaction): %w", err)
	}

	return nil
}

// Result represents the result for eth_sendTransaction
//
// 32 byte hex value
type Result struct {
	Value types.Hash `json:"-"`
}

// MarshalJSON implements json.Marshaler for Result.
func (r Result) MarshalJSON() ([]byte, error) {
	return json.Marshal(r.Value)
}

// UnmarshalJSON implements json.Unmarshaler for Result.
func (r *Result) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &r.Value)
}
