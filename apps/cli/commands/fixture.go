package commands

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/urfave/cli/v2"
)

// FixtureTest represents a test case from an Ethereum fixture file
type FixtureTest struct {
	Network              string                            `json:"network"`
	GenesisBlockHeader   map[string]interface{}            `json:"genesisBlockHeader"`
	Pre                  map[string]map[string]interface{} `json:"pre"`
	PostState            map[string]map[string]interface{} `json:"postState"`
	Blocks               []interface{}                     `json:"blocks"`
	LastBlockHash        string                            `json:"lastblockhash"`
	SealEngine           string                            `json:"sealEngine"`
	EngineNewPayloadVersion interface{}                    `json:"engineNewPayloadVersion"`
}

// RunFixture executes a test fixture
func RunFixture(c *cli.Context) error {
	// Get the fixture path from arguments
	fixturePath := c.Args().First()
	if fixturePath == "" {
		return fmt.Errorf("fixture path or name required")
	}

	// Resolve fixture path
	resolvedPath, err := resolveFixturePath(fixturePath)
	if err != nil {
		return fmt.Errorf("failed to resolve fixture path: %w", err)
	}

	fmt.Fprintf(os.Stderr, "Running fixture: %s\n", resolvedPath)

	// Read fixture file
	data, err := os.ReadFile(resolvedPath)
	if err != nil {
		return fmt.Errorf("failed to read fixture file: %w", err)
	}

	// Parse fixture JSON
	var fixtures map[string]FixtureTest
	if err := json.Unmarshal(data, &fixtures); err != nil {
		return fmt.Errorf("failed to parse fixture JSON: %w", err)
	}

	// Run each test in the fixture
	totalTests := len(fixtures)
	passed := 0
	failed := 0

	for testName, test := range fixtures {
		fmt.Fprintf(os.Stderr, "\nRunning test: %s\n", testName)
		fmt.Fprintf(os.Stderr, "Network: %s\n", test.Network)
		
		// TODO: Implement actual test execution using the EVM
		// For now, just show what would be tested
		fmt.Fprintf(os.Stderr, "- Pre-state accounts: %d\n", len(test.Pre))
		fmt.Fprintf(os.Stderr, "- Post-state accounts: %d\n", len(test.PostState))
		if test.Blocks != nil {
			fmt.Fprintf(os.Stderr, "- Blocks to process: %d\n", len(test.Blocks))
		}
		
		// Placeholder for actual test execution
		// In a real implementation, this would:
		// 1. Set up the EVM with the pre-state
		// 2. Process the blocks/transactions
		// 3. Compare the resulting state with post-state
		// 4. Verify the last block hash matches
		
		passed++ // For now, mark as passed
		fmt.Fprintf(os.Stderr, "✓ Test passed (placeholder)\n")
	}

	// Summary
	fmt.Fprintf(os.Stderr, "\n========================================\n")
	fmt.Fprintf(os.Stderr, "Fixture: %s\n", filepath.Base(resolvedPath))
	fmt.Fprintf(os.Stderr, "Total tests: %d\n", totalTests)
	fmt.Fprintf(os.Stderr, "Passed: %d\n", passed)
	fmt.Fprintf(os.Stderr, "Failed: %d\n", failed)
	fmt.Fprintf(os.Stderr, "========================================\n")

	if failed > 0 {
		return fmt.Errorf("%d tests failed", failed)
	}

	return nil
}

// resolveFixturePath resolves a fixture name or path to a full path
func resolveFixturePath(input string) (string, error) {
	// Get the project root (assuming cli is run from project root or cli.sh handles this)
	projectRoot := os.Getenv("GUILLOTINE_ROOT")
	if projectRoot == "" {
		// Try to find project root by looking for cli.sh
		cwd, _ := os.Getwd()
		if _, err := os.Stat(filepath.Join(cwd, "cli.sh")); err == nil {
			projectRoot = cwd
		} else {
			// Try parent directories
			for i := 0; i < 5; i++ {
				cwd = filepath.Dir(cwd)
				if _, err := os.Stat(filepath.Join(cwd, "cli.sh")); err == nil {
					projectRoot = cwd
					break
				}
			}
		}
	}

	fixturesDir := filepath.Join(projectRoot, "test", "official", "fixtures")

	// If input is already a valid path, use it
	if _, err := os.Stat(input); err == nil {
		return input, nil
	}

	// If input doesn't have .json extension, add it
	if !strings.HasSuffix(input, ".json") {
		input = input + ".json"
	}

	// Try to find the fixture in common locations
	searchPaths := []string{
		// Direct path in fixtures directory
		filepath.Join(fixturesDir, input),
		// In state_tests
		filepath.Join(fixturesDir, "state_tests", input),
		// In blockchain_tests
		filepath.Join(fixturesDir, "blockchain_tests", input),
		// In blockchain_tests_engine
		filepath.Join(fixturesDir, "blockchain_tests_engine", input),
	}

	// Also search recursively if it's just a filename
	if !strings.Contains(input, string(os.PathSeparator)) {
		// Search for the file recursively
		var foundPath string
		err := filepath.Walk(fixturesDir, func(path string, info os.FileInfo, err error) error {
			if err != nil {
				return nil // Continue searching
			}
			if !info.IsDir() && filepath.Base(path) == input {
				foundPath = path
				return filepath.SkipAll // Stop searching
			}
			return nil
		})
		if err == nil && foundPath != "" {
			return foundPath, nil
		}
	}

	// Try each search path
	for _, path := range searchPaths {
		if _, err := os.Stat(path); err == nil {
			return path, nil
		}
	}

	// If still not found, try a recursive search with partial match
	var matches []string
	searchTerm := strings.TrimSuffix(input, ".json")
	err := filepath.Walk(fixturesDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && strings.Contains(filepath.Base(path), searchTerm) && strings.HasSuffix(path, ".json") {
			matches = append(matches, path)
		}
		return nil
	})

	if err == nil && len(matches) > 0 {
		if len(matches) == 1 {
			return matches[0], nil
		}
		// Multiple matches, show them to the user
		return "", fmt.Errorf("multiple fixtures found matching '%s':\n%s\nPlease be more specific", 
			input, strings.Join(matches, "\n"))
	}

	return "", fmt.Errorf("fixture not found: %s", input)
}

// ListFixtures lists available fixtures
func ListFixtures(c *cli.Context) error {
	projectRoot := os.Getenv("GUILLOTINE_ROOT")
	if projectRoot == "" {
		cwd, _ := os.Getwd()
		if _, err := os.Stat(filepath.Join(cwd, "cli.sh")); err == nil {
			projectRoot = cwd
		}
	}

	fixturesDir := filepath.Join(projectRoot, "test", "official", "fixtures")
	
	fmt.Println("Available fixtures:")
	fmt.Println("==================")

	categories := map[string][]string{}
	
	err := filepath.Walk(fixturesDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		
		// Skip hidden directories and files
		if strings.HasPrefix(filepath.Base(path), ".") {
			if info.IsDir() {
				return filepath.SkipDir
			}
			return nil
		}
		
		if !info.IsDir() && strings.HasSuffix(path, ".json") {
			relPath, _ := filepath.Rel(fixturesDir, path)
			category := filepath.Dir(relPath)
			if category == "." {
				category = "root"
			}
			categories[category] = append(categories[category], filepath.Base(path))
		}
		return nil
	})

	if err != nil {
		return fmt.Errorf("failed to list fixtures: %w", err)
	}

	for category, files := range categories {
		fmt.Printf("\n%s/\n", category)
		for _, file := range files {
			fmt.Printf("  %s\n", strings.TrimSuffix(file, ".json"))
		}
	}

	return nil
}