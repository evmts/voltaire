package commands

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"math/big"
	"os"
	"path/filepath"
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
	s = strings.TrimSpace(s)
	s = strings.TrimPrefix(s, "0x")
	s = strings.TrimPrefix(s, "0X")
	
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
	// Check if a fixture is provided as positional argument
	if c.Args().Len() > 0 {
		fixturePath := c.Args().First()
		params, err := LoadCallParamsFromFixture(fixturePath)
		if err != nil {
			// If fixture loading fails, continue with normal parsing
			fmt.Fprintf(os.Stderr, "Warning: Could not load fixture %s: %v\n", fixturePath, err)
		} else {
			// Override with any CLI flags that were explicitly set
			if c.IsSet("caller") {
				caller, err := ParseAddress(c.String("caller"))
				if err == nil {
					params.Caller = caller
				}
			}
			if c.IsSet("gas") {
				gas, err := ParseGas(c.String("gas"))
				if err == nil {
					params.Gas = gas
				}
			}
			if c.IsSet("to") {
				to, err := ParseAddress(c.String("to"))
				if err == nil {
					params.To = to
				}
			}
			if c.IsSet("value") && needValue {
				value, err := ParseBigInt(c.String("value"))
				if err == nil {
					params.Value = value
				}
			}
			if c.IsSet("input") {
				input, err := ParseHex(c.String("input"))
				if err == nil {
					params.Input = input
				}
			}
			return params, nil
		}
	}
	
	// Normal parsing from CLI flags
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
// Fixture Support
// ========================

// FixtureData represents the structure of a test fixture
type FixtureData struct {
	Pre       map[string]AccountState `json:"pre"`
	Blocks    []BlockData             `json:"blocks"`
	PostState map[string]AccountState `json:"postState"`
}

// AccountState represents an account in the fixture
type AccountState struct {
	Balance string            `json:"balance"`
	Code    string            `json:"code"`
	Nonce   string            `json:"nonce"`
	Storage map[string]string `json:"storage"`
}

// BlockData represents a block in the fixture
type BlockData struct {
	Transactions []TransactionData `json:"transactions"`
}

// TransactionData represents a transaction in the fixture
type TransactionData struct {
	Data     string `json:"data"`
	GasLimit string `json:"gasLimit"`
	Value    string `json:"value"`
	To       string `json:"to"`
	From     string `json:"sender"`
}

// LoadCallParamsFromFixture loads call parameters from a fixture file
func LoadCallParamsFromFixture(fixturePath string) (CallParams, error) {
	// Resolve fixture path
	resolvedPath := resolveFixturePath(fixturePath)
	
	// Check if it's a simple bytecode/calldata pair or full fixture
	if strings.Contains(fixturePath, "bytecode") || strings.Contains(fixturePath, "runtime") {
		// Simple bytecode file
		return loadSimpleBytecodeFixture(resolvedPath)
	}
	
	// Try to load as JSON fixture
	data, err := os.ReadFile(resolvedPath)
	if err != nil {
		return CallParams{}, fmt.Errorf("failed to read fixture: %w", err)
	}
	
	// Try to parse as a full test fixture
	var fixtures map[string]json.RawMessage
	if err := json.Unmarshal(data, &fixtures); err != nil {
		// Maybe it's a simple hex file
		return loadSimpleBytecodeFixture(resolvedPath)
	}
	
	// Get the first test from the fixture
	for _, testData := range fixtures {
		var test struct {
			Pre    map[string]AccountState `json:"pre"`
			Blocks []BlockData             `json:"blocks"`
		}
		if err := json.Unmarshal(testData, &test); err != nil {
			continue
		}
		
		// Extract bytecode and calldata from the first transaction
		if len(test.Blocks) > 0 && len(test.Blocks[0].Transactions) > 0 {
			tx := test.Blocks[0].Transactions[0]
			
			params := CallParams{
				CommonParams: CommonParams{
					Gas: 10000000, // Default gas
				},
				Value: big.NewInt(0),
			}
			
			// Parse transaction data
			if tx.Data != "" {
				params.Input, _ = ParseHex(tx.Data)
			}
			
			if tx.GasLimit != "" {
				if gas, err := ParseBigInt(tx.GasLimit); err == nil {
					params.Gas = gas.Uint64()
				}
			}
			
			if tx.Value != "" {
				params.Value, _ = ParseBigInt(tx.Value)
			}
			
			if tx.To != "" && tx.To != "0x" {
				params.To, _ = ParseAddress(tx.To)
			}
			
			if tx.From != "" {
				params.Caller, _ = ParseAddress(tx.From)
			} else {
				// Default caller
				params.Caller, _ = ParseAddress("0xa94f5374fce5edbc8e2a8697c15331677e6ebf0b")
			}
			
			// If there's a contract in pre-state, deploy it first
			for addr, account := range test.Pre {
				if account.Code != "" && account.Code != "0x" {
					// This is a contract that needs to be deployed
					if params.To.Hex() == "0x0000000000000000000000000000000000000000" {
						// If no 'to' address, use this contract address
						params.To, _ = ParseAddress(addr)
					}
				}
			}
			
			return params, nil
		}
	}
	
	return CallParams{}, fmt.Errorf("no valid test data found in fixture")
}

// loadSimpleBytecodeFixture loads bytecode and calldata from simple files
func loadSimpleBytecodeFixture(path string) (CallParams, error) {
	// Try to find bytecode and calldata files
	dir := filepath.Dir(path)
	base := filepath.Base(path)
	
	var bytecodeFile, calldataFile string
	
	// Look for companion files
	if strings.Contains(base, "bytecode") || strings.Contains(base, "runtime") {
		bytecodeFile = path
		// Look for calldata file
		calldataFile = filepath.Join(dir, "calldata.txt")
		if _, err := os.Stat(calldataFile); err != nil {
			calldataFile = filepath.Join(dir, "calldata.hex")
		}
	} else if strings.Contains(base, "calldata") {
		calldataFile = path
		// Look for bytecode file
		bytecodeFile = filepath.Join(dir, "runtime_clean.txt")
		if _, err := os.Stat(bytecodeFile); err != nil {
			bytecodeFile = filepath.Join(dir, "bytecode.hex")
		}
	}
	
	params := CallParams{
		CommonParams: CommonParams{
			Caller: primitives.Address{}, // Will be set to default
			Gas:    10000000,
		},
		Value: big.NewInt(0),
	}
	
	// Load calldata if found
	if calldataFile != "" {
		if data, err := os.ReadFile(calldataFile); err == nil {
			params.Input, _ = ParseHex(string(data))
		}
	}
	
	// For bytecode, we'd need to deploy it first, but for now just note it
	if bytecodeFile != "" {
		fmt.Fprintf(os.Stderr, "Note: Bytecode file found at %s\n", bytecodeFile)
	}
	
	// Set defaults
	params.Caller, _ = ParseAddress("0x1000000000000000000000000000000000000000")
	params.To, _ = ParseAddress("0x1000000000000000000000000000000000000001")
	
	return params, nil
}

// resolveFixturePath resolves a fixture name or path to an actual file
func resolveFixturePath(input string) string {
	// If it's already a valid path, return it
	if _, err := os.Stat(input); err == nil {
		return input
	}
	
	// Try to find it in the test fixtures directory
	projectRoot := os.Getenv("GUILLOTINE_ROOT")
	if projectRoot == "" {
		// Try to find project root
		if cwd, err := os.Getwd(); err == nil {
			// Look for cli.sh to identify project root
			for dir := cwd; dir != "/"; dir = filepath.Dir(dir) {
				if _, err := os.Stat(filepath.Join(dir, "cli.sh")); err == nil {
					projectRoot = dir
					break
				}
			}
		}
	}
	
	if projectRoot != "" {
		// Look in test fixtures
		fixturesDir := filepath.Join(projectRoot, "test", "official", "fixtures")
		
		// Try direct path
		testPath := filepath.Join(fixturesDir, input)
		if _, err := os.Stat(testPath); err == nil {
			return testPath
		}
		
		// Try with .json extension
		testPath = filepath.Join(fixturesDir, input+".json")
		if _, err := os.Stat(testPath); err == nil {
			return testPath
		}
		
		// Search recursively for a matching file
		var found string
		filepath.Walk(fixturesDir, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}
			if strings.Contains(filepath.Base(path), input) {
				found = path
				return filepath.SkipAll
			}
			return nil
		})
		if found != "" {
			return found
		}
	}
	
	return input
}

// SetupEVMWithFixture creates an EVM and loads state from a fixture
func SetupEVMWithFixture(c *cli.Context) (*evm.EVM, error) {
	vm, err := evm.New()
	if err != nil {
		return nil, fmt.Errorf("failed to create EVM: %w", err)
	}
	
	// Check if a fixture is provided
	if c.Args().Len() > 0 {
		fixturePath := c.Args().First()
		resolvedPath := resolveFixturePath(fixturePath)
		
		// Try to load fixture and set up state
		if data, err := os.ReadFile(resolvedPath); err == nil {
			var fixtures map[string]json.RawMessage
			if err := json.Unmarshal(data, &fixtures); err == nil {
				// Load pre-state from first test
				for _, testData := range fixtures {
					var test struct {
						Pre map[string]AccountState `json:"pre"`
					}
					if err := json.Unmarshal(testData, &test); err == nil {
						// Set up pre-state accounts
						for addr, account := range test.Pre {
							address, _ := ParseAddress(addr)
							
							// Set balance
							if account.Balance != "" {
								balance, _ := ParseBigInt(account.Balance)
								vm.SetBalance(address, balance)
							}
							
							// Set code
							if account.Code != "" && account.Code != "0x" {
								code, _ := ParseHex(account.Code)
								vm.SetCode(address, code)
							}
							
							// Set storage
							for key, value := range account.Storage {
								storageKey, _ := ParseBigInt(key)
								storageValue, _ := ParseBigInt(value)
								vm.SetStorage(address, storageKey, storageValue)
							}
						}
						
						fmt.Fprintf(os.Stderr, "Loaded pre-state from fixture with %d accounts\n", len(test.Pre))
						break
					}
				}
			}
		}
	}
	
	return vm, nil
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