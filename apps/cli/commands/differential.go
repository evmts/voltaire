package commands

import (
	"bytes"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/urfave/cli/v2"
)

// TraceStep represents a single execution step in the trace
type TraceStep struct {
	PC      uint64            `json:"pc"`
	Op      interface{}       `json:"op"`      // Can be string or number
	OpName  string            `json:"opName"`  // Revme includes this
	Gas     interface{}       `json:"gas"`     // Can be string or number
	GasCost interface{}       `json:"gasCost"` // Can be string or number
	Depth   int               `json:"depth"`
	Stack   []string          `json:"stack,omitempty"`
	Memory  string            `json:"memory,omitempty"`
	Storage map[string]string `json:"storage,omitempty"`
	Error   string            `json:"error,omitempty"`
}

// TraceResult represents the full execution trace
type TraceResult struct {
	Gas         uint64      `json:"gas"`
	Failed      bool        `json:"failed"`
	ReturnValue string      `json:"returnValue"`
	StructLogs  []TraceStep `json:"structLogs"`
}

// RunDifferential runs a differential test between Guillotine and revme
func RunDifferential(c *cli.Context) error {
	// Check if revme is installed
	if _, err := exec.LookPath("revme"); err != nil {
		return fmt.Errorf("revme not found in PATH. Please install revme first:\ncargo install revm-cli")
	}

	// Get fixture name
	if c.Args().Len() == 0 {
		return fmt.Errorf("fixture name required. Usage: differential <fixture-name>")
	}
	fixtureName := c.Args().Get(0)

	// Create temp directory for traces
	tempDir, err := os.MkdirTemp("", "guillotine-diff-*")
	if err != nil {
		return fmt.Errorf("failed to create temp directory: %w", err)
	}
	defer os.RemoveAll(tempDir)

	guillotineTrace := filepath.Join(tempDir, "guillotine.json")
	revmeTrace := filepath.Join(tempDir, "revme.json")

	fmt.Printf("Running differential test for fixture: %s\n", fixtureName)
	fmt.Printf("Temp directory: %s\n", tempDir)

	// Run Guillotine trace
	fmt.Println("\n=== Running Guillotine trace ===")
	if err := runGuillotineTrace(fixtureName, guillotineTrace); err != nil {
		return fmt.Errorf("failed to run Guillotine trace: %w", err)
	}

	// Run revme trace
	fmt.Println("\n=== Running revme trace ===")
	if err := runRevmeTrace(fixtureName, revmeTrace); err != nil {
		return fmt.Errorf("failed to run revme trace: %w", err)
	}

	// Compare traces
	fmt.Println("\n=== Comparing traces ===")
	if err := compareTraces(guillotineTrace, revmeTrace); err != nil {
		return fmt.Errorf("trace comparison failed: %w", err)
	}

	return nil
}

// runGuillotineTrace runs Guillotine and captures the trace
func runGuillotineTrace(fixtureName string, outputPath string) error {
	// Load fixture bytecode and calldata
	bytecode, calldata, err := LoadFixtureBytecodeAndCalldata(fixtureName)
	if err != nil {
		return fmt.Errorf("failed to load fixture: %w", err)
	}

	// Run the trace directly using the exported function from trace.go
	return RunTraceWithSetupToFile(
		"0x1000000000000000000000000000000000000000",  // caller
		"0x1000000000000000000000000000000000000001",  // to
		"",       // value
		calldata, // input
		"",       // gas (default)
		bytecode, // bytecode to deploy
		outputPath, // output file
	)
}

// runRevmeTrace runs revme and captures the trace
func runRevmeTrace(fixtureName string, outputPath string) error {
	// Load fixture bytecode and calldata
	bytecode, calldata, err := LoadFixtureBytecodeAndCalldata(fixtureName)
	if err != nil {
		return fmt.Errorf("failed to load fixture: %w", err)
	}

	// Convert bytecode and calldata to hex strings
	bytecodeHex := fmt.Sprintf("0x%x", bytecode)
	calldataHex := fmt.Sprintf("0x%x", calldata)

	// Build revme command
	// revme evm --trace --input <calldata> <bytecode>
	cmd := exec.Command("revme", "evm",
		"--trace",
		"--input", calldataHex,
		bytecodeHex,
	)

	// Capture output
	var stdout, stderr bytes.Buffer
	cmd.Stdout = &stdout
	cmd.Stderr = &stderr

	// Run command
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("revme execution failed: %w\nstderr: %s", err, stderr.String())
	}

	// Parse revme output - it's line-delimited JSON followed by summary
	// Extract only the JSON trace lines (stop at the summary line)
	var traceLines []string
	for _, line := range strings.Split(stdout.String(), "\n") {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}
		// Stop at the summary line (starts with {"stateRoot":)
		if strings.HasPrefix(line, "{\"stateRoot\":") {
			break
		}
		// Stop at non-JSON lines
		if !strings.HasPrefix(line, "{") {
			break
		}
		// Add trace step line
		if strings.Contains(line, "\"pc\":") {
			traceLines = append(traceLines, line)
		}
	}
	
	// Convert to JSON array
	jsonOutput := "[" + strings.Join(traceLines, ",") + "]"
	
	// Save trace to file
	if err := os.WriteFile(outputPath, []byte(jsonOutput), 0644); err != nil {
		return fmt.Errorf("failed to write revme trace: %w", err)
	}

	return nil
}

// compareTraces compares two trace files and reports differences
func compareTraces(guillotinePath, revmePath string) error {
	// Read Guillotine trace
	guillotineData, err := os.ReadFile(guillotinePath)
	if err != nil {
		return fmt.Errorf("failed to read Guillotine trace: %w", err)
	}

	// Read revme trace
	revmeData, err := os.ReadFile(revmePath)
	if err != nil {
		return fmt.Errorf("failed to read revme trace: %w", err)
	}

	// Parse traces
	var guillotineTrace TraceResult
	if err := json.Unmarshal(guillotineData, &guillotineTrace); err != nil {
		// Try parsing as array of steps if not wrapped in result
		var steps []TraceStep
		if err2 := json.Unmarshal(guillotineData, &steps); err2 != nil {
			return fmt.Errorf("failed to parse Guillotine trace: %w", err)
		}
		guillotineTrace.StructLogs = steps
	}

	var revmeTrace TraceResult
	if err := json.Unmarshal(revmeData, &revmeTrace); err != nil {
		// Try parsing as array of steps if not wrapped in result
		var steps []TraceStep
		if err2 := json.Unmarshal(revmeData, &steps); err2 != nil {
			return fmt.Errorf("failed to parse revme trace: %w", err)
		}
		revmeTrace.StructLogs = steps
	}

	// Compare step by step
	divergenceFound := false
	maxSteps := len(guillotineTrace.StructLogs)
	if len(revmeTrace.StructLogs) > maxSteps {
		maxSteps = len(revmeTrace.StructLogs)
	}

	for i := 0; i < maxSteps; i++ {
		if i >= len(guillotineTrace.StructLogs) {
			fmt.Printf("\n❌ DIVERGENCE at step %d: Guillotine trace ended early\n", i)
			fmt.Printf("   revme continues with: %s\n", revmeTrace.StructLogs[i].Op)
			divergenceFound = true
			break
		}
		if i >= len(revmeTrace.StructLogs) {
			fmt.Printf("\n❌ DIVERGENCE at step %d: revme trace ended early\n", i)
			fmt.Printf("   Guillotine continues with: %s\n", guillotineTrace.StructLogs[i].Op)
			divergenceFound = true
			break
		}

		g := guillotineTrace.StructLogs[i]
		r := revmeTrace.StructLogs[i]

		// Get opcode names for comparison
		gOp := getOpcodeName(g)
		rOp := getOpcodeName(r)
		
		// Compare opcodes
		if gOp != rOp {
			fmt.Printf("\n❌ DIVERGENCE at step %d:\n", i)
			fmt.Printf("   Opcode mismatch: Guillotine=%s, revme=%s\n", gOp, rOp)
			printContext(guillotineTrace.StructLogs, revmeTrace.StructLogs, i)
			divergenceFound = true
			break
		}

		// Compare PC
		if g.PC != r.PC {
			fmt.Printf("\n❌ DIVERGENCE at step %d:\n", i)
			fmt.Printf("   PC mismatch: Guillotine=%d, revme=%d\n", g.PC, r.PC)
			fmt.Printf("   Opcode: %s\n", gOp)
			printContext(guillotineTrace.StructLogs, revmeTrace.StructLogs, i)
			divergenceFound = true
			break
		}

		// Compare stack sizes
		if len(g.Stack) != len(r.Stack) {
			fmt.Printf("\n❌ DIVERGENCE at step %d:\n", i)
			fmt.Printf("   Stack size mismatch: Guillotine=%d, revme=%d\n", len(g.Stack), len(r.Stack))
			fmt.Printf("   Opcode: %s (PC=%d)\n", gOp, g.PC)
			printContext(guillotineTrace.StructLogs, revmeTrace.StructLogs, i)
			divergenceFound = true
			break
		}

		// Compare stack values
		for j := 0; j < len(g.Stack); j++ {
			if !strings.EqualFold(g.Stack[j], r.Stack[j]) {
				fmt.Printf("\n❌ DIVERGENCE at step %d:\n", i)
				fmt.Printf("   Stack[%d] mismatch:\n", j)
				fmt.Printf("   Guillotine: %s\n", g.Stack[j])
				fmt.Printf("   revme:      %s\n", r.Stack[j])
				fmt.Printf("   Opcode: %s (PC=%d)\n", gOp, g.PC)
				printContext(guillotineTrace.StructLogs, revmeTrace.StructLogs, i)
				divergenceFound = true
				break
			}
		}

		if divergenceFound {
			break
		}

		// Compare error state
		if (g.Error != "") != (r.Error != "") {
			fmt.Printf("\n❌ DIVERGENCE at step %d:\n", i)
			fmt.Printf("   Error state mismatch:\n")
			fmt.Printf("   Guillotine error: %s\n", g.Error)
			fmt.Printf("   revme error:      %s\n", r.Error)
			printContext(guillotineTrace.StructLogs, revmeTrace.StructLogs, i)
			divergenceFound = true
			break
		}
	}

	if !divergenceFound {
		fmt.Printf("\n✅ Traces match! Both EVMs executed %d steps identically.\n", len(guillotineTrace.StructLogs))
	}

	return nil
}

// printContext prints the execution context around a divergence point
// getOpcodeName extracts the opcode name from either format
func getOpcodeName(step TraceStep) string {
	// Revme provides OpName field
	if step.OpName != "" {
		return step.OpName
	}
	// Guillotine provides Op as string
	if opStr, ok := step.Op.(string); ok {
		return opStr
	}
	// Fallback
	return fmt.Sprintf("UNKNOWN(%v)", step.Op)
}

func printContext(guillotineSteps, revmeSteps []TraceStep, divergenceIdx int) {
	fmt.Println("\n=== Previous 5 operations ===")
	start := divergenceIdx - 5
	if start < 0 {
		start = 0
	}

	for i := start; i < divergenceIdx && i < len(guillotineSteps) && i < len(revmeSteps); i++ {
		g := guillotineSteps[i]
		r := revmeSteps[i]
		match := "✓"
		gOp := getOpcodeName(g)
		rOp := getOpcodeName(r)
		if gOp != rOp || g.PC != r.PC {
			match = "✗"
		}
		fmt.Printf("[%d] %s PC=%d Op=%s (G:%s R:%s) Stack=%d items\n",
			i, match, g.PC, gOp, gOp, rOp, len(g.Stack))
	}

	fmt.Println("\n=== Divergence point ===")
	if divergenceIdx < len(guillotineSteps) {
		g := guillotineSteps[divergenceIdx]
		fmt.Printf("[%d] Guillotine: PC=%d Op=%s Stack=%d items Gas=%v\n",
			divergenceIdx, g.PC, getOpcodeName(g), len(g.Stack), g.Gas)
		if len(g.Stack) > 0 && len(g.Stack) <= 5 {
			fmt.Println("     Stack (top to bottom):")
			for j, val := range g.Stack {
				fmt.Printf("       [%d]: %s\n", j, val)
			}
		}
	}
	if divergenceIdx < len(revmeSteps) {
		r := revmeSteps[divergenceIdx]
		fmt.Printf("[%d] revme:      PC=%d Op=%s Stack=%d items Gas=%v\n",
			divergenceIdx, r.PC, getOpcodeName(r), len(r.Stack), r.Gas)
		if len(r.Stack) > 0 && len(r.Stack) <= 5 {
			fmt.Println("     Stack (top to bottom):")
			for j, val := range r.Stack {
				fmt.Printf("       [%d]: %s\n", j, val)
			}
		}
	}
}

