package commands

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"

	"github.com/evmts/guillotine/sdks/go/primitives"
	"github.com/urfave/cli/v2"
)

// ExecuteBench runs the call command via hyperfine for benchmarking
func ExecuteBench(c *cli.Context) error {
	// Check if hyperfine is installed
	if _, err := exec.LookPath("hyperfine"); err != nil {
		return fmt.Errorf(`
❌ hyperfine is not installed

Hyperfine is required to run benchmarks. Please install it using cargo:

  cargo install hyperfine

Or via your package manager:
  - macOS: brew install hyperfine
  - Ubuntu/Debian: apt install hyperfine
  - Arch: pacman -S hyperfine

For more installation options, see: https://github.com/sharkdp/hyperfine`)
	}

	// Get the path to the guil CLI binary
	guilPath, err := getGuilPath()
	if err != nil {
		return fmt.Errorf("failed to find guil CLI: %w", err)
	}

	// Build hyperfine arguments
	hyperfineArgs := []string{}

	// Add hyperfine-specific flags
	if c.IsSet("warmup") {
		hyperfineArgs = append(hyperfineArgs, "--warmup", strconv.Itoa(c.Int("warmup")))
	}
	if c.IsSet("runs") {
		hyperfineArgs = append(hyperfineArgs, "--runs", strconv.Itoa(c.Int("runs")))
	}
	if c.IsSet("min-runs") {
		hyperfineArgs = append(hyperfineArgs, "--min-runs", strconv.Itoa(c.Int("min-runs")))
	}
	if c.IsSet("max-runs") {
		hyperfineArgs = append(hyperfineArgs, "--max-runs", strconv.Itoa(c.Int("max-runs")))
	}
	if c.IsSet("prepare") {
		hyperfineArgs = append(hyperfineArgs, "--prepare", c.String("prepare"))
	}
	if c.IsSet("cleanup") {
		hyperfineArgs = append(hyperfineArgs, "--cleanup", c.String("cleanup"))
	}
	if c.IsSet("parameter-scan") {
		hyperfineArgs = append(hyperfineArgs, "--parameter-scan", c.String("parameter-scan"))
	}
	if c.IsSet("parameter-step") {
		hyperfineArgs = append(hyperfineArgs, "--parameter-step", strconv.Itoa(c.Int("parameter-step")))
	}
	if c.IsSet("parameter-list") {
		hyperfineArgs = append(hyperfineArgs, "--parameter-list", c.String("parameter-list"))
	}
	if c.Bool("show-output") {
		hyperfineArgs = append(hyperfineArgs, "--show-output")
	}
	if c.IsSet("export-json") {
		hyperfineArgs = append(hyperfineArgs, "--export-json", c.String("export-json"))
	}
	if c.IsSet("export-csv") {
		hyperfineArgs = append(hyperfineArgs, "--export-csv", c.String("export-csv"))
	}
	if c.IsSet("export-markdown") {
		hyperfineArgs = append(hyperfineArgs, "--export-markdown", c.String("export-markdown"))
	}
	if c.IsSet("time-unit") {
		hyperfineArgs = append(hyperfineArgs, "--time-unit", c.String("time-unit"))
	}

	// Build the guil call command
	var guilCmd string
	
	// Check if any call parameters were provided
	hasCallParams := c.IsSet("caller") || c.IsSet("to") || c.IsSet("value") || 
		c.IsSet("input") || c.IsSet("gas") || c.Args().Len() > 0

	if !hasCallParams {
		// Default to snailtracer benchmark
		fmt.Println("No call parameters provided, using default snailtracer benchmark...")
		
		// Build command for snailtracer
		bytecodePath := "/Users/williamcory/Guillotine/src/_test_utils/fixtures/snailtracer/runtime_clean.txt"
		calldataPath := "/Users/williamcory/Guillotine/src/_test_utils/fixtures/snailtracer/calldata.txt"
		
		// Read bytecode and calldata to deploy and call
		guilCmd = fmt.Sprintf(`%s call --caller %s --to %s --gas %d --format hex`,
			guilPath,
			"0x1000000000000000000000000000000000000000",
			"0x1000000000000000000000000000000000000001",
			10000000,
		)
		
		// We need to prepare the environment with the contract code
		// This would require setting up the contract first, so let's use trace command instead
		guilCmd = fmt.Sprintf(`%s trace --bytecode %s --calldata %s --gas %d --out /tmp/bench_trace.json`,
			guilPath,
			bytecodePath,
			calldataPath,
			10000000,
		)
	} else {
		// Build call command with provided parameters
		guilCmd = fmt.Sprintf("%s call", guilPath)
		
		// Add call parameters
		if c.IsSet("caller") {
			guilCmd += fmt.Sprintf(" --caller %s", c.String("caller"))
		} else {
			guilCmd += " --caller 0x1000000000000000000000000000000000000000"
		}
		
		if c.IsSet("to") {
			guilCmd += fmt.Sprintf(" --to %s", c.String("to"))
		} else {
			guilCmd += " --to 0x1000000000000000000000000000000000000001"
		}
		
		if c.IsSet("value") {
			guilCmd += fmt.Sprintf(" --value %s", c.String("value"))
		} else {
			guilCmd += " --value 0"
		}
		
		if c.IsSet("input") {
			guilCmd += fmt.Sprintf(" --input %s", c.String("input"))
		}
		
		if c.IsSet("gas") {
			guilCmd += fmt.Sprintf(" --gas %s", c.String("gas"))
		} else {
			guilCmd += " --gas 10000000"
		}
		
		guilCmd += fmt.Sprintf(" --format %s", c.String("format"))
		
		// Add fixture argument if provided
		if c.Args().Len() > 0 {
			guilCmd += fmt.Sprintf(" %s", c.Args().First())
		}
	}

	// Add the command to hyperfine
	hyperfineArgs = append(hyperfineArgs, guilCmd)

	// If comparing, add the comparison command
	if c.IsSet("compare") {
		compareCmd := c.String("compare")
		hyperfineArgs = append(hyperfineArgs, compareCmd)
	}

	// Print the command for debugging
	fmt.Fprintf(os.Stderr, "Running: hyperfine %s\n", strings.Join(hyperfineArgs, " "))

	// Execute hyperfine
	cmd := exec.Command("hyperfine", hyperfineArgs...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	cmd.Stdin = os.Stdin

	return cmd.Run()
}

// getGuilPath finds the path to the guil CLI binary
func getGuilPath() (string, error) {
	// First, try to find the guil.sh script
	cwd, err := os.Getwd()
	if err != nil {
		return "", err
	}

	// Look for guil.sh in parent directories
	for dir := cwd; dir != "/"; dir = filepath.Dir(dir) {
		guilSh := filepath.Join(dir, "guil.sh")
		if _, err := os.Stat(guilSh); err == nil {
			// Found guil.sh, return it
			return guilSh, nil
		}
		
		// Also check for the compiled binary
		guilBin := filepath.Join(dir, "apps", "cli", "guillotine-cli")
		if _, err := os.Stat(guilBin); err == nil {
			return guilBin, nil
		}
	}

	// Try to find in PATH
	if path, err := exec.LookPath("guil"); err == nil {
		return path, nil
	}

	if path, err := exec.LookPath("guillotine-cli"); err == nil {
		return path, nil
	}

	return "", fmt.Errorf("could not find guil CLI (tried guil.sh, guillotine-cli, and guil in PATH)")
}

// GetDefaultSnailTracerParams returns default parameters for snailtracer benchmark
func GetDefaultSnailTracerParams() CallParams {
	caller, _ := primitives.AddressFromHex("0x1000000000000000000000000000000000000000")
	to, _ := primitives.AddressFromHex("0x1000000000000000000000000000000000000001")
	
	return CallParams{
		CommonParams: CommonParams{
			Caller: caller,
			Gas:    10000000,
		},
		To:    to,
		Value: nil,
		Input: nil,
	}
}