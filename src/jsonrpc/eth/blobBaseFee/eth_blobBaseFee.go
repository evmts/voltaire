package eth

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns the base fee per blob gas in wei.
//
// Example:
// Result: "0x3f5694c1f"
//
// Implements the eth_blobBaseFee JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "eth_blobBaseFee"

// Params represents the parameters for eth_blobBaseFee
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

// Result represents the result for eth_blobBaseFee
//
// Blob gas base fee
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
