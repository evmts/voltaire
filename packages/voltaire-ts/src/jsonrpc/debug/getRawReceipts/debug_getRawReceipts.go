package debug

import (
	"encoding/json"
	"fmt"

	"github.com/ethereum/execution-apis/types"
)

// Returns an array of EIP-2718 binary-encoded receipts.
//
// Example:
// Block: "0x32026E"
// Result: ...
//
// Implements the debug_getRawReceipts JSON-RPC method.

// Method is the JSON-RPC method name
const Method = "debug_getRawReceipts"

// Params represents the parameters for debug_getRawReceipts
type Params struct {
	// Block number or tag
	Block types.Quantity `json:"-"`
}

// MarshalJSON implements json.Marshaler for Params.
// JSON-RPC 2.0 uses positional array parameters.
func (p Params) MarshalJSON() ([]byte, error) {
	return json.Marshal([]interface{}{
		p.Block,
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

	if err := json.Unmarshal(arr[0], &p.Block); err != nil {
		return fmt.Errorf("parameter 0 (Block): %w", err)
	}

	return nil
}

// Result represents the result for debug_getRawReceipts
//
// Receipt array
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
