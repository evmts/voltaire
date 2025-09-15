package commands

import (
	"fmt"
	"os"
	"strings"

	"guillotine-cli/internal/compiler"

	"github.com/urfave/cli/v2"
)

// RunCompile compiles Solidity source code
func RunCompile(c *cli.Context) error {
	// Get source code - either from inline or file
	var source string
	var filename string
	
	if c.IsSet("source") {
		source = c.String("source")
		filename = "inline.sol"
	} else if c.IsSet("file") {
		filepath := c.String("file")
		content, err := os.ReadFile(filepath)
		if err != nil {
			return fmt.Errorf("failed to read source file: %w", err)
		}
		source = string(content)
		
		// Extract filename from path
		parts := strings.Split(filepath, "/")
		filename = parts[len(parts)-1]
	} else {
		return fmt.Errorf("either --source or --file must be provided")
	}
	
	// Setup compiler settings
	settings := compiler.CompilerSettings{
		OptimizerEnabled:       c.Bool("optimize"),
		OptimizerRuns:          uint32(c.Uint("optimize-runs")),
		EVMVersion:             c.String("evm-version"),
		OutputAbi:              true,
		OutputBytecode:         true,
		OutputDeployedBytecode: true,
		OutputAst:              false,
	}
	
	// Compile the source
	result, err := compiler.CompileSource(filename, source, settings)
	if err != nil {
		return fmt.Errorf("compilation failed: %w", err)
	}
	
	// Check for compilation errors
	if len(result.Errors) > 0 {
		fmt.Fprintf(os.Stderr, "Compilation errors:\n")
		for _, err := range result.Errors {
			fmt.Fprintf(os.Stderr, "  - %s\n", err)
		}
		if len(result.Contracts) == 0 {
			return fmt.Errorf("compilation failed with errors")
		}
	}
	
	// Show warnings if any
	if len(result.Warnings) > 0 {
		fmt.Fprintf(os.Stderr, "Warnings:\n")
		for _, warning := range result.Warnings {
			fmt.Fprintf(os.Stderr, "  - %s\n", warning)
		}
	}
	
	// Format output based on requested format
	var output string
	format := c.String("format")
	
	switch format {
	case "json":
		output, err = result.ToJSON()
		if err != nil {
			return fmt.Errorf("failed to format as JSON: %w", err)
		}
	case "hex":
		// Output just the bytecode in hex format
		if len(result.Contracts) > 0 {
			output = result.Contracts[0].Bytecode
		} else {
			return fmt.Errorf("no contracts compiled")
		}
	case "combined":
		// Output ABI and bytecode in a combined format
		if len(result.Contracts) > 0 {
			contract := result.Contracts[0]
			output = fmt.Sprintf("ABI:\n%s\n\nBytecode:\n%s\n\nDeployed Bytecode:\n%s\n",
				contract.ABI, contract.Bytecode, contract.DeployedBytecode)
		} else {
			return fmt.Errorf("no contracts compiled")
		}
	default:
		return fmt.Errorf("unsupported format: %s", format)
	}
	
	// Output to file or stdout
	outputPath := c.String("output")
	if outputPath != "" {
		if err := os.WriteFile(outputPath, []byte(output), 0644); err != nil {
			return fmt.Errorf("failed to write output file: %w", err)
		}
		fmt.Fprintf(os.Stderr, "Compilation result written to: %s\n", outputPath)
	} else {
		fmt.Print(output)
	}
	
	// Print summary to stderr
	fmt.Fprintf(os.Stderr, "\nCompiled %d contract(s) successfully\n", len(result.Contracts))
	for _, contract := range result.Contracts {
		fmt.Fprintf(os.Stderr, "  - %s\n", contract.Name)
	}
	
	return nil
}