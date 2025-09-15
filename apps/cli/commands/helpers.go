package commands

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"strings"

	guillotine "github.com/evmts/guillotine/sdks/go"
	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// ========================
// Common Parameter Types
// ========================

type CommonParams struct {
	Caller primitives.Address
	Gas    uint64
}

type CallParams struct {
	CommonParams
	To    primitives.Address
	Value *big.Int
	Input []byte
}

type CreateParams struct {
	CommonParams
	Value    *big.Int
	InitCode []byte
	Salt     *big.Int // Only for CREATE2
}

// ========================
// Parsing Functions
// ========================

// ParseAddress converts a hex string to an Address
func ParseAddress(s string) (primitives.Address, error) {
	return primitives.AddressFromHex(s)
}

// ParseBigInt converts a string to a big.Int (supports decimal and hex with 0x prefix)
func ParseBigInt(s string) (*big.Int, error) {
	if s == "" {
		return big.NewInt(0), nil
	}
	if strings.HasPrefix(s, "0x") || strings.HasPrefix(s, "0X") {
		// Parse as hex
		s = s[2:]
		n := new(big.Int)
		_, ok := n.SetString(s, 16)
		if !ok {
			return nil, fmt.Errorf("invalid hex number: %s", s)
		}
		return n, nil
	}
	// Parse as decimal
	n := new(big.Int)
	_, ok := n.SetString(s, 10)
	if !ok {
		return nil, fmt.Errorf("invalid decimal number: %s", s)
	}
	return n, nil
}

// ParseGas converts a string to uint64 gas value
func ParseGas(s string) (uint64, error) {
	n, err := ParseBigInt(s)
	if err != nil {
		return 0, err
	}
	if !n.IsUint64() {
		return 0, fmt.Errorf("gas value too large: %s", s)
	}
	return n.Uint64(), nil
}

// ParseHex converts a hex string to bytes
func ParseHex(s string) ([]byte, error) {
	original := s
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "0x")
	s = strings.TrimPrefix(s, "0X")
	
	// Debug logging
	fmt.Fprintf(os.Stderr, "parseHex: original len=%d, after trim len=%d\n", len(original), len(s))
	if len(s) % 2 != 0 {
		fmt.Fprintf(os.Stderr, "WARNING: Odd number of hex chars: %d\n", len(s))
		// Pad with a zero if odd
		s = s + "0"
	}
	
	result, err := hex.DecodeString(s)
	if err != nil {
		fmt.Fprintf(os.Stderr, "hex.DecodeString error: %v\n", err)
	}
	return result, err
}

// ========================
// Parameter Parsing Helpers
// ========================

// ParseCommonParams extracts caller and gas parameters (used by all commands)
func ParseCommonParams(c *cli.Context) (CommonParams, error) {
	caller, err := ParseAddress(c.String("caller"))
	if err != nil {
		return CommonParams{}, fmt.Errorf("invalid caller address: %w", err)
	}
	
	gas, err := ParseGas(c.String("gas"))
	if err != nil {
		return CommonParams{}, fmt.Errorf("invalid gas: %w", err)
	}
	
	return CommonParams{Caller: caller, Gas: gas}, nil
}

// ParseCallParams extracts parameters for CALL-like operations
func ParseCallParams(c *cli.Context, needValue bool) (CallParams, error) {
	common, err := ParseCommonParams(c)
	if err != nil {
		return CallParams{}, err
	}
	
	to, err := ParseAddress(c.String("to"))
	if err != nil {
		return CallParams{}, fmt.Errorf("invalid to address: %w", err)
	}
	
	var value *big.Int
	if needValue {
		value, err = ParseBigInt(c.String("value"))
		if err != nil {
			return CallParams{}, fmt.Errorf("invalid value: %w", err)
		}
	} else {
		value = big.NewInt(0)
	}
	
	input, err := ParseHex(c.String("input"))
	if err != nil {
		return CallParams{}, fmt.Errorf("invalid input data: %w", err)
	}
	
	return CallParams{
		CommonParams: common,
		To:          to,
		Value:       value,
		Input:       input,
	}, nil
}

// ParseCreateParams extracts parameters for CREATE operations
func ParseCreateParams(c *cli.Context, needSalt bool) (CreateParams, error) {
	common, err := ParseCommonParams(c)
	if err != nil {
		return CreateParams{}, err
	}
	
	value, err := ParseBigInt(c.String("value"))
	if err != nil {
		return CreateParams{}, fmt.Errorf("invalid value: %w", err)
	}
	
	initCode, err := ParseHex(c.String("init-code"))
	if err != nil {
		return CreateParams{}, fmt.Errorf("invalid init code: %w", err)
	}
	
	var salt *big.Int
	if needSalt {
		salt, err = ParseBigInt(c.String("salt"))
		if err != nil {
			return CreateParams{}, fmt.Errorf("invalid salt: %w", err)
		}
	}
	
	return CreateParams{
		CommonParams: common,
		Value:       value,
		InitCode:    initCode,
		Salt:        salt,
	}, nil
}

// ========================
// EVM Setup and Execution
// ========================

// SetupEVM creates and initializes an EVM instance with proper state
func SetupEVM(c *cli.Context) (*evm.EVM, error) {
	vm, err := evm.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM: %w", err)
	}
	
	// TODO: Setup initial state from flags if needed
	// For now, we'll use defaults
	
	return vm, nil
}

// ExecuteWithBalance ensures the caller has sufficient balance before execution
func ExecuteWithBalance(vm *evm.EVM, caller primitives.Address, value *big.Int) error {
	if value != nil && value.Sign() > 0 {
		// Ensure caller has sufficient balance
		balance := new(big.Int).Add(value, big.NewInt(1000000000000000000))
		if err := vm.SetBalance(caller, balance); err != nil {
			return fmt.Errorf("failed to set caller balance: %w", err)
		}
	}
	return nil
}

// ========================
// Output Formatting
// ========================

// CallResultJSON represents the JSON format of a call result
type CallResultJSON struct {
	Success           bool                    `json:"success"`
	GasUsed           string                  `json:"gasUsed"`
	Output            string                  `json:"output,omitempty"`
	CreatedAddress    string                  `json:"createdAddress,omitempty"`
	Logs              []LogEntryJSON          `json:"logs,omitempty"`
	SelfDestructs     []SelfDestructJSON      `json:"selfDestructs,omitempty"`
	AccessedAddresses []string                `json:"accessedAddresses,omitempty"`
	AccessedStorage   []StorageAccessJSON     `json:"accessedStorage,omitempty"`
	Error             string                  `json:"error,omitempty"`
}

// LogEntryJSON represents a log entry in JSON format
type LogEntryJSON struct {
	Address string   `json:"address"`
	Topics  []string `json:"topics"`
	Data    string   `json:"data"`
}

// SelfDestructJSON represents a self-destruct record in JSON format
type SelfDestructJSON struct {
	Contract    string `json:"contract"`
	Beneficiary string `json:"beneficiary"`
}

// StorageAccessJSON represents a storage access in JSON format
type StorageAccessJSON struct {
	Address string `json:"address"`
	Slot    string `json:"slot"`
}

// OutputResult formats and outputs the CallResult based on format flag
func OutputResult(c *cli.Context, result *guillotine.CallResult) error {
	format := c.String("format")
	
	// Check for execution failure
	if !result.Success {
		if format == "json" {
			// Output error in JSON format
			jsonResult := CallResultJSON{
				Success: false,
				GasUsed: fmt.Sprintf("0x%x", c.Uint64("gas") - result.GasLeft),
				Error:   result.ErrorInfo,
			}
			if len(result.Output) > 0 {
				jsonResult.Output = fmt.Sprintf("0x%x", result.Output)
			}
			jsonBytes, err := json.MarshalIndent(jsonResult, "", "  ")
			if err != nil {
				return fmt.Errorf("failed to marshal JSON: %w", err)
			}
			fmt.Println(string(jsonBytes))
			return nil
		}
		
		// Non-JSON error output
		if result.ErrorInfo != "" {
			return fmt.Errorf("execution failed: %s", result.ErrorInfo)
		}
		if len(result.Output) > 0 {
			// Revert with data
			return fmt.Errorf("execution reverted: 0x%x", result.Output)
		}
		return fmt.Errorf("execution failed")
	}
	
	switch format {
	case "hex":
		// For create operations, output the created address
		if result.CreatedAddress != nil {
			fmt.Printf("%s\n", result.CreatedAddress.Hex())
		} else if len(result.Output) > 0 {
			fmt.Printf("0x%x\n", result.Output)
		} else {
			fmt.Printf("0x\n")
		}
		
	case "json":
		// Build comprehensive JSON output
		jsonResult := CallResultJSON{
			Success: result.Success,
			GasUsed: fmt.Sprintf("0x%x", c.Uint64("gas") - result.GasLeft),
		}
		
		// Add output if present
		if len(result.Output) > 0 {
			jsonResult.Output = fmt.Sprintf("0x%x", result.Output)
		}
		
		// Add created address if present
		if result.CreatedAddress != nil {
			jsonResult.CreatedAddress = result.CreatedAddress.Hex()
		}
		
		// Add logs if present
		if len(result.Logs) > 0 {
			jsonResult.Logs = make([]LogEntryJSON, len(result.Logs))
			for i, log := range result.Logs {
				jsonLog := LogEntryJSON{
					Address: log.Address.Hex(),
					Data:    fmt.Sprintf("0x%x", log.Data),
				}
				jsonLog.Topics = make([]string, len(log.Topics))
				for j, topic := range log.Topics {
					jsonLog.Topics[j] = fmt.Sprintf("0x%064x", topic)
				}
				jsonResult.Logs[i] = jsonLog
			}
		}
		
		// Add self-destructs if present
		if len(result.SelfDestructs) > 0 {
			jsonResult.SelfDestructs = make([]SelfDestructJSON, len(result.SelfDestructs))
			for i, sd := range result.SelfDestructs {
				jsonResult.SelfDestructs[i] = SelfDestructJSON{
					Contract:    sd.Contract.Hex(),
					Beneficiary: sd.Beneficiary.Hex(),
				}
			}
		}
		
		// Add accessed addresses if present
		if len(result.AccessedAddresses) > 0 {
			jsonResult.AccessedAddresses = make([]string, len(result.AccessedAddresses))
			for i, addr := range result.AccessedAddresses {
				jsonResult.AccessedAddresses[i] = addr.Hex()
			}
		}
		
		// Add accessed storage if present
		if len(result.AccessedStorage) > 0 {
			jsonResult.AccessedStorage = make([]StorageAccessJSON, len(result.AccessedStorage))
			for i, storage := range result.AccessedStorage {
				jsonResult.AccessedStorage[i] = StorageAccessJSON{
					Address: storage.Address.Hex(),
					Slot:    fmt.Sprintf("0x%064x", storage.Slot),
				}
			}
		}
		
		// Marshal and output JSON
		jsonBytes, err := json.MarshalIndent(jsonResult, "", "  ")
		if err != nil {
			return fmt.Errorf("failed to marshal JSON: %w", err)
		}
		fmt.Println(string(jsonBytes))
		
	default:
		return fmt.Errorf("unknown format: %s", format)
	}
	
	return nil
}

// ========================
// Math Helpers
// ========================

func Min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

func Max(a, b int) int {
	if a > b {
		return a
	}
	return b
}