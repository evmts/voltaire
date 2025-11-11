package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the client coinbase address.
//
// Example:
// Result: "0xfe3b557e8fb62b89f4916b721be55ceb828dbd73"
//
// Implements the eth_coinbase JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_coinbase"

// Params represents the parameters for eth_coinbase
type Params struct {
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
	})
}

// UnmarshalJSON implements json.Unmarshaler for Params.
func (p *Params) UnmarshalJSON(data []byte) error {
	var arr []json.RawMessage
	if err := json.Unmarshal(data, &arr); err != nil {
		return err
	}

	if len(arr) != 0 {
		return fmt.Errorf("expected 0 parameters, got %d", len(arr))
	}

	return nil
}

// Result represents the result for eth_coinbase
//
// hex encoded address
type Result struct {
	Value types.Address `json:"-"`
}

// MarshalJSON implements json.Marshaler for Result.
func (r Result) MarshalJSON() ([]byte, error) {
	return json.Marshal(r.Value)
}

// UnmarshalJSON implements json.Unmarshaler for Result.
func (r *Result) UnmarshalJSON(data []byte) error {
	return json.Unmarshal(data, &r.Value)
}
