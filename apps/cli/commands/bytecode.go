package commands

import (
	"encoding/hex"
	"fmt"
	"io/ioutil"
	"os"
	"path/filepath"
	"strings"

	"github.com/urfave/cli/v2"
	"github.com/evmts/guillotine/sdks/go/bytecode"
)

// ExecuteBytecode pretty prints EVM bytecode
func ExecuteBytecode(c *cli.Context) error {
	if c.NArg() < 1 {
		return fmt.Errorf("bytecode source required (fixture name, file path, or hex string)")
	}
	
	source := c.Args().Get(0)
	
	// Try to get bytecode from different sources
	bytecodeHex, err := getBytecodeFromSource(source)
	if err != nil {
		return fmt.Errorf("failed to get bytecode: %w", err)
	}
	
	// Convert hex string to bytes
	bytecodeHex = strings.TrimPrefix(bytecodeHex, "0x")
	bytecodeHex = strings.TrimPrefix(bytecodeHex, "0X")
	
	bytecodeBytes, err := hex.DecodeString(bytecodeHex)
	if err != nil {
		return fmt.Errorf("failed to decode bytecode hex: %w", err)
	}
	
	// Use the Zig pretty print function via FFI
	output, err := bytecode.PrettyPrint(bytecodeBytes)
	if err != nil {
		return fmt.Errorf("failed to pretty print bytecode: %w", err)
	}
	
	// Output the result
	fmt.Println(output)
	
	return nil
}

// getProjectRoot finds the project root directory
func getProjectRoot() string {
	// Check environment variable first
	if root := os.Getenv("GUILLOTINE_ROOT"); root != "" {
		return root
	}
	
	// Try to find project root by looking for build.zig
	if cwd, err := os.Getwd(); err == nil {
		for dir := cwd; dir != "/"; dir = filepath.Dir(dir) {
			if _, err := os.Stat(filepath.Join(dir, "build.zig")); err == nil {
				return dir
			}
		}
	}
	
	return ""
}

// getBytecodeFromSource tries to get bytecode from various sources
func getBytecodeFromSource(source string) (string, error) {
	// 1. Check if it's raw hex bytecode (starts with 0x or is all hex chars)
	if strings.HasPrefix(source, "0x") || strings.HasPrefix(source, "0X") {
		return source, nil
	}
	
	// Check if it's all hex characters (no path separators)
	if !strings.Contains(source, "/") && !strings.Contains(source, "\\") && !strings.Contains(source, ".") {
		// Try to parse as hex
		if isHexString(source) {
			return source, nil
		}
	}
	
	// 2. Try as a fixture name or path
	fixturePath := resolveFixturePath(source)
	if _, err := os.Stat(fixturePath); err == nil {
		return getBytecodeFromFixture(fixturePath)
	}
	
	// 3. Try to find fixture by name in src/_test_utils/fixtures
	projectRoot := getProjectRoot()
	if projectRoot != "" {
		fixturesDir := filepath.Join(projectRoot, "src", "_test_utils", "fixtures", source)
		
		// Look for common bytecode file names in the fixture directory
		// Prefer full bytecode over runtime bytecode
		bytecodeFileNames := []string{
			"bytecode.txt",
			"bytecode.hex",
			source + ".hex",
			source + ".txt",
			"deployed_bytecode.txt",
			"runtime_bytecode.txt",
			"runtime_clean.txt",
			"runtime.txt",
		}
		
		for _, fileName := range bytecodeFileNames {
			path := filepath.Join(fixturesDir, fileName)
			if data, err := readBytecodeFile(path); err == nil {
				fmt.Fprintf(os.Stderr, "Note: Using bytecode from %s\n", path)
				return data, nil
			}
		}
	}
	
	// 4. Try as a bytecode file path
	// Check various common locations
	bytecodeFiles := []string{
		source,                                              // As-is
		filepath.Join("test", "official", "fixtures", source), // In fixtures
		filepath.Join("bytecode", source),                     // In bytecode dir
		source + ".hex",                                       // Add .hex extension
		source + ".bin",                                       // Add .bin extension
		filepath.Join("runtime_clean.txt"),                   // Snailtracer default
		filepath.Join("test", "snailtracer", "runtime_clean.txt"),
	}
	
	for _, path := range bytecodeFiles {
		if data, err := readBytecodeFile(path); err == nil {
			return data, nil
		}
	}
	
	// 4. If it still looks like hex, try it as raw bytecode
	if isHexString(source) {
		return source, nil
	}
	
	return "", fmt.Errorf("could not find bytecode from source: %s", source)
}

// getBytecodeFromFixture extracts bytecode from a fixture file
func getBytecodeFromFixture(fixturePath string) (string, error) {
	data, err := ioutil.ReadFile(fixturePath)
	if err != nil {
		return "", fmt.Errorf("failed to read fixture: %w", err)
	}
	
	// Try to parse as a fixture
	params, err := LoadCallParamsFromFixture(fixturePath)
	if err == nil && len(params.Input) > 0 {
		// Return the input data as hex
		return "0x" + hex.EncodeToString(params.Input), nil
	}
	
	// If it's not a standard fixture, maybe it's just bytecode
	content := strings.TrimSpace(string(data))
	if isHexString(content) {
		return content, nil
	}
	
	return "", fmt.Errorf("fixture does not contain valid bytecode")
}

// readBytecodeFile reads bytecode from a file
func readBytecodeFile(path string) (string, error) {
	data, err := ioutil.ReadFile(path)
	if err != nil {
		return "", err
	}
	
	content := strings.TrimSpace(string(data))
	
	// Remove any comments (lines starting with #)
	lines := strings.Split(content, "\n")
	var bytecodeLines []string
	for _, line := range lines {
		line = strings.TrimSpace(line)
		if !strings.HasPrefix(line, "#") && !strings.HasPrefix(line, "//") && line != "" {
			bytecodeLines = append(bytecodeLines, line)
		}
	}
	
	// Join all lines (in case bytecode is split across lines)
	bytecode := strings.Join(bytecodeLines, "")
	
	return bytecode, nil
}

// isHexString checks if a string contains only hex characters (with optional 0x prefix)
func isHexString(s string) bool {
	// Remove 0x prefix if present
	s = strings.TrimPrefix(s, "0x")
	s = strings.TrimPrefix(s, "0X")
	
	if len(s) == 0 {
		return false
	}
	
	// Check if all characters are hex
	for _, c := range s {
		if !((c >= '0' && c <= '9') || (c >= 'a' && c <= 'f') || (c >= 'A' && c <= 'F')) {
			return false
		}
	}
	
	return true
}

