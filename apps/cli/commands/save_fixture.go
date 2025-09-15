package commands

import (
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/evmts/guillotine/sdks/go/evm"
	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

type CallResultData struct {
	Success        bool     `json:"success"`
	GasUsed        string   `json:"gasUsed"`
	Output         string   `json:"output,omitempty"`
	CreatedAddress string   `json:"createdAddress,omitempty"`
	Logs           []string `json:"logs,omitempty"`
	Error          string   `json:"error,omitempty"`
}

// SaveFixture saves the current call parameters as a fixture
func SaveFixture(c *cli.Context) error {
	if c.NArg() < 1 {
		return fmt.Errorf("fixture name required")
	}
	
	fixtureName := c.Args().Get(0)
	if !strings.HasSuffix(fixtureName, ".json") {
		fixtureName += ".json"
	}
	
	// Parse call parameters directly without trying to load fixtures
	caller, err := ParseAddress(c.String("caller"))
	if err != nil {
		return fmt.Errorf("invalid caller address: %w", err)
	}
	
	to, err := ParseAddress(c.String("to"))
	if err != nil && c.String("to") != "" {
		return fmt.Errorf("invalid to address: %w", err)
	}
	
	value, err := ParseBigInt(c.String("value"))
	if err != nil {
		return fmt.Errorf("invalid value: %w", err)
	}
	
	gas, err := ParseGas(c.String("gas"))
	if err != nil {
		return fmt.Errorf("invalid gas: %w", err)
	}
	
	inputBytes, err := ParseHex(c.String("input"))
	if err != nil && c.String("input") != "" {
		return fmt.Errorf("invalid input data: %w", err)
	}
	
	params := CallParams{
		CommonParams: CommonParams{
			Caller: caller,
			Gas:    gas,
		},
		To:     to,
		Value:  value,
		Input:  inputBytes,
	}
	
	// Convert addresses to hex strings
	callerHex := fmt.Sprintf("0x%x", params.Caller.Bytes())
	toHex := ""
	if params.To != (primitives.Address{}) {
		toHex = fmt.Sprintf("0x%x", params.To.Bytes())
	}
	
	// Convert input to hex
	inputHex := ""
	if len(params.Input) > 0 {
		inputHex = "0x" + hex.EncodeToString(params.Input)
	}
	
	// Create fixture data with transaction in blocks structure
	fixture := FixtureData{
		Pre: make(map[string]AccountState),
		Blocks: []BlockData{
			{
				Transactions: []TransactionData{
					{
						From:     callerHex,
						To:       toHex,
						Value:    params.Value.String(),
						Data:     inputHex,
						GasLimit: fmt.Sprintf("%d", params.Gas),
					},
				},
			},
		},
		PostState: make(map[string]AccountState),
	}
	
	// If execute flag is set, run the call and capture result
	if c.Bool("execute") {
		vm, err := evm.New()
		if err != nil {
			return fmt.Errorf("failed to create EVM: %w", err)
		}
		defer vm.Destroy()
		
		// Set up pre-state with balance for caller
		if err := ExecuteWithBalance(vm, params.Caller, params.Value); err != nil {
			return fmt.Errorf("failed to set balance: %w", err)
		}
		
		// Execute call
		result, err := vm.Call(evm.Call{
			Caller: params.Caller,
			To:     params.To,
			Value:  params.Value,
			Input:  params.Input,
			Gas:    params.Gas,
		})
		
		if err == nil {
			// Store result as metadata for now (could extend FixtureData later)
			gasUsed := params.Gas - result.GasLeft
			_ = gasUsed // Store in metadata if needed
			
			if result.CreatedAddress != nil {
				// Store created address in metadata if needed
				_ = result.CreatedAddress
			}
			
			// Add post-state if execution succeeded
			if result.Success {
				fixture.PostState = make(map[string]AccountState)
				// Simplified - in a real implementation you'd capture actual state changes
			}
		}
	}
	
	// Determine save directory
	saveDir := determineFixtureDirectory(c)
	
	// Create directory if it doesn't exist
	if err := os.MkdirAll(saveDir, 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}
	
	// Save fixture with metadata
	fixtureWrapper := struct {
		*FixtureData
		Metadata struct {
			Description string `json:"description,omitempty"`
			CreatedAt   string `json:"created_at"`
			Network     string `json:"network"`
		} `json:"_metadata"`
	}{
		FixtureData: &fixture,
	}
	
	fixtureWrapper.Metadata.Description = c.String("description")
	fixtureWrapper.Metadata.CreatedAt = time.Now().Format(time.RFC3339)
	fixtureWrapper.Metadata.Network = c.String("network")
	
	// Save fixture
	fixturePath := filepath.Join(saveDir, fixtureName)
	data, err := json.MarshalIndent(fixtureWrapper, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal fixture: %w", err)
	}
	
	if err := ioutil.WriteFile(fixturePath, data, 0644); err != nil {
		return fmt.Errorf("failed to write fixture: %w", err)
	}
	
	fmt.Printf("Fixture saved to: %s\n", fixturePath)
	return nil
}

// LoadFixture loads and displays a fixture
func LoadFixture(c *cli.Context) error {
	if c.NArg() < 1 {
		return fmt.Errorf("fixture name or path required")
	}
	
	fixturePath := c.Args().Get(0)
	
	// Try to resolve the fixture path
	if !filepath.IsAbs(fixturePath) && !strings.Contains(fixturePath, "/") {
		// Just a name, search for it
		searchPaths := []string{
			filepath.Join("test", "official", "fixtures"),
			filepath.Join(os.Getenv("HOME"), ".guillotine", "fixtures"),
		}
		
		for _, dir := range searchPaths {
			testPath := filepath.Join(dir, fixturePath)
			if !strings.HasSuffix(testPath, ".json") {
				testPath += ".json"
			}
			if _, err := os.Stat(testPath); err == nil {
				fixturePath = testPath
				break
			}
		}
	}
	
	// Load fixture
	data, err := ioutil.ReadFile(fixturePath)
	if err != nil {
		return fmt.Errorf("failed to read fixture: %w", err)
	}
	
	var fixture FixtureData
	if err := json.Unmarshal(data, &fixture); err != nil {
		return fmt.Errorf("failed to parse fixture: %w", err)
	}
	
	// Display fixture
	fmt.Printf("Fixture: %s\n", filepath.Base(fixturePath))
	
	// Check for metadata
	if raw, err := ioutil.ReadFile(fixturePath); err == nil {
		var withMeta struct {
			Metadata struct {
				Description string `json:"description"`
				CreatedAt   string `json:"created_at"`
				Network     string `json:"network"`
			} `json:"_metadata"`
		}
		if json.Unmarshal(raw, &withMeta) == nil && withMeta.Metadata.Description != "" {
			fmt.Printf("Description: %s\n", withMeta.Metadata.Description)
			if withMeta.Metadata.CreatedAt != "" {
				fmt.Printf("Created: %s\n", withMeta.Metadata.CreatedAt)
			}
			if withMeta.Metadata.Network != "" {
				fmt.Printf("Network: %s\n", withMeta.Metadata.Network)
			}
		}
	}
	
	if len(fixture.Blocks) > 0 && len(fixture.Blocks[0].Transactions) > 0 {
		tx := fixture.Blocks[0].Transactions[0]
		fmt.Printf("\nTransaction:\n")
		fmt.Printf("  From: %s\n", tx.From)
		if tx.To != "" {
			fmt.Printf("  To: %s\n", tx.To)
		}
		fmt.Printf("  Value: %s\n", tx.Value)
		if tx.Data != "" {
			fmt.Printf("  Data: %s\n", tx.Data)
		}
		fmt.Printf("  Gas Limit: %s\n", tx.GasLimit)
	}
	
	return nil
}

// ListFixtures lists available fixtures
func ListFixtures(c *cli.Context) error {
	var searchDirs []string
	
	if dir := c.String("dir"); dir != "" {
		searchDirs = []string{dir}
	} else {
		// Default search directories
		searchDirs = []string{
			filepath.Join("test", "official", "fixtures"),
			filepath.Join(os.Getenv("HOME"), ".guillotine", "fixtures"),
		}
		
		// Add git repo fixtures if in a git repo
		if isGitRepo() {
			searchDirs = append([]string{filepath.Join("fixtures", "custom")}, searchDirs...)
		}
	}
	
	fmt.Println("Available fixtures:")
	
	for _, dir := range searchDirs {
		if _, err := os.Stat(dir); os.IsNotExist(err) {
			continue
		}
		
		fmt.Printf("\n%s:\n", dir)
		
		files, err := ioutil.ReadDir(dir)
		if err != nil {
			fmt.Printf("  Error reading directory: %v\n", err)
			continue
		}
		
		for _, file := range files {
			if strings.HasSuffix(file.Name(), ".json") {
				fmt.Printf("  - %s\n", strings.TrimSuffix(file.Name(), ".json"))
			}
		}
	}
	
	return nil
}

// determineFixtureDirectory determines where to save the fixture
func determineFixtureDirectory(c *cli.Context) string {
	// If directory explicitly specified, use it
	if dir := c.String("dir"); dir != "" {
		return dir
	}
	
	// Check if we're in a git repo with fixtures directory
	if isGitRepo() {
		fixturesDir := filepath.Join("fixtures", "custom")
		if _, err := os.Stat("fixtures"); err == nil {
			return fixturesDir
		}
		
		// Try from repo root
		repoRoot := getGitRepoRoot()
		if repoRoot != "" {
			fixturesDir = filepath.Join(repoRoot, "fixtures", "custom")
			if _, err := os.Stat(filepath.Join(repoRoot, "fixtures")); err == nil {
				return fixturesDir
			}
		}
	}
	
	// Fall back to user's home directory
	homeDir := os.Getenv("HOME")
	if homeDir == "" {
		homeDir = os.Getenv("USERPROFILE") // Windows
	}
	
	return filepath.Join(homeDir, ".guillotine", "fixtures")
}

// isGitRepo checks if the current directory is in a git repository
func isGitRepo() bool {
	cmd := exec.Command("git", "rev-parse", "--git-dir")
	err := cmd.Run()
	return err == nil
}

// getGitRepoRoot gets the root directory of the git repository
func getGitRepoRoot() string {
	cmd := exec.Command("git", "rev-parse", "--show-toplevel")
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}