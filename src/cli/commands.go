package main

import (
	"fmt"
	"strconv"
	"strings"
)

// CommandMode represents different modes the TUI can be in
type CommandMode int

const (
	ModeTUI CommandMode = iota
	ModeCommand
	ModeHelp
)

// Command represents a parsed command
type Command struct {
	Name string
	Args []string
	Raw  string
}

// CommandResult represents the result of executing a command
type CommandResult struct {
	Success bool
	Message string
	Data    interface{}
}

// CommandHandler handles command execution
type CommandHandler struct {
	provider DataProvider
}

// NewCommandHandler creates a new command handler
func NewCommandHandler(provider DataProvider) *CommandHandler {
	return &CommandHandler{
		provider: provider,
	}
}

// ParseCommand parses a command string into a Command struct
func ParseCommand(input string) Command {
	input = strings.TrimSpace(input)
	if input == "" {
		return Command{Raw: input}
	}

	parts := strings.Fields(input)
	if len(parts) == 0 {
		return Command{Raw: input}
	}

	return Command{
		Name: parts[0],
		Args: parts[1:],
		Raw:  input,
	}
}

// Execute executes a command and returns the result
func (c *CommandHandler) Execute(cmd Command) CommandResult {
	switch cmd.Name {
	case "":
		return CommandResult{Success: true, Message: ""}

	case "help", "h":
		return c.handleHelp(cmd.Args)

	case "break", "b":
		return c.handleBreakpoint(cmd.Args)

	case "clear", "cl":
		return c.handleClearBreakpoint(cmd.Args)

	case "jump", "j":
		return c.handleJump(cmd.Args)

	case "watch", "w":
		return c.handleWatch(cmd.Args)

	case "unwatch", "uw":
		return c.handleUnwatch(cmd.Args)

	case "info", "i":
		return c.handleInfo(cmd.Args)

	case "step", "s":
		return c.handleStep(cmd.Args)

	case "run", "r":
		return c.handleRun(cmd.Args)

	case "pause", "p":
		return c.handlePause(cmd.Args)

	case "reset", "x":
		return c.handleReset(cmd.Args)

	case "trace", "t":
		return c.handleTrace(cmd.Args)

	case "profile", "prof":
		return c.handleProfile(cmd.Args)

	case "quit", "q":
		return CommandResult{Success: true, Message: "quit", Data: "quit"}

	default:
		return CommandResult{
			Success: false,
			Message: fmt.Sprintf("Unknown command: %s. Type 'help' for available commands.", cmd.Name),
		}
	}
}

// handleHelp shows help information
func (c *CommandHandler) handleHelp(args []string) CommandResult {
	if len(args) == 0 {
		help := `Available Commands:

Execution Control:
  step, s              - Execute one instruction
  run, r               - Run until breakpoint or completion
  pause, p             - Pause execution
  reset, x             - Reset to beginning

Breakpoints:
  break <pc>, b <pc>   - Set breakpoint at address (hex: 0x1234)
  clear <pc>, cl <pc>  - Clear breakpoint at address

Navigation:
  jump <pc>, j <pc>    - Jump to address without executing

Memory Watching:
  watch <addr> [label], w <addr> [label] - Watch memory address
  unwatch <addr>, uw <addr>              - Stop watching address

Information:
  info gas, i gas      - Show gas usage information
  info stack, i stack  - Show detailed stack information
  info blocks, i blocks - Show basic block information
  trace [count], t [count] - Show execution history
  profile, prof        - Show execution profiling data

General:
  help [command], h [command] - Show help (for specific command)
  quit, q                     - Quit debugger

Examples:
  break 0x10           - Set breakpoint at PC 0x10
  watch 0x40 "storage" - Watch memory at 0x40 with label
  info gas             - Show gas usage statistics
  trace 5              - Show last 5 execution steps`

		return CommandResult{Success: true, Message: help}
	}

	// Help for specific command
	cmdName := args[0]
	switch cmdName {
	case "break", "b":
		return CommandResult{Success: true, Message: "break <address> - Set breakpoint at hex address (e.g., break 0x10)"}
	case "watch", "w":
		return CommandResult{Success: true, Message: "watch <address> [label] - Watch memory address (e.g., watch 0x40 \"storage\")"}
	case "info", "i":
		return CommandResult{Success: true, Message: "info <topic> - Show information. Topics: gas, stack, blocks"}
	case "trace", "t":
		return CommandResult{Success: true, Message: "trace [count] - Show execution history (default: 10 steps)"}
	default:
		return CommandResult{Success: false, Message: fmt.Sprintf("No specific help available for '%s'", cmdName)}
	}
}

// handleBreakpoint sets a breakpoint
func (c *CommandHandler) handleBreakpoint(args []string) CommandResult {
	if len(args) == 0 {
		return CommandResult{Success: false, Message: "Usage: break <address> (e.g., break 0x10)"}
	}

	addr, err := parseAddress(args[0])
	if err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Invalid address: %s", args[0])}
	}

	c.provider.SetBreakpoint(addr)
	return CommandResult{Success: true, Message: fmt.Sprintf("Breakpoint set at 0x%04X", addr)}
}

// handleClearBreakpoint clears a breakpoint
func (c *CommandHandler) handleClearBreakpoint(args []string) CommandResult {
	if len(args) == 0 {
		return CommandResult{Success: false, Message: "Usage: clear <address> (e.g., clear 0x10)"}
	}

	addr, err := parseAddress(args[0])
	if err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Invalid address: %s", args[0])}
	}

	c.provider.ClearBreakpoint(addr)
	return CommandResult{Success: true, Message: fmt.Sprintf("Breakpoint cleared at 0x%04X", addr)}
}

// handleJump jumps to an address
func (c *CommandHandler) handleJump(args []string) CommandResult {
	if len(args) == 0 {
		return CommandResult{Success: false, Message: "Usage: jump <address> (e.g., jump 0x10)"}
	}

	addr, err := parseAddress(args[0])
	if err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Invalid address: %s", args[0])}
	}

	state := c.provider.GetState()
	state.PC = addr
	return CommandResult{Success: true, Message: fmt.Sprintf("Jumped to 0x%04X", addr)}
}

// handleWatch adds a memory watch
func (c *CommandHandler) handleWatch(args []string) CommandResult {
	if len(args) == 0 {
		return CommandResult{Success: false, Message: "Usage: watch <address> [label] (e.g., watch 0x40 \"storage\")"}
	}

	addr, err := parseAddress(args[0])
	if err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Invalid address: %s", args[0])}
	}

	label := fmt.Sprintf("Watch_%X", addr)
	if len(args) > 1 {
		label = strings.Join(args[1:], " ")
		// Remove quotes if present
		label = strings.Trim(label, "\"'")
	}

	c.provider.AddWatchedAddress(addr, label)
	return CommandResult{Success: true, Message: fmt.Sprintf("Watching memory at 0x%04X (%s)", addr, label)}
}

// handleUnwatch removes a memory watch
func (c *CommandHandler) handleUnwatch(args []string) CommandResult {
	if len(args) == 0 {
		return CommandResult{Success: false, Message: "Usage: unwatch <address> (e.g., unwatch 0x40)"}
	}

	addr, err := parseAddress(args[0])
	if err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Invalid address: %s", args[0])}
	}

	c.provider.RemoveWatchedAddress(addr)
	return CommandResult{Success: true, Message: fmt.Sprintf("Stopped watching memory at 0x%04X", addr)}
}

// handleInfo shows various information
func (c *CommandHandler) handleInfo(args []string) CommandResult {
	if len(args) == 0 {
		return CommandResult{Success: false, Message: "Usage: info <topic>. Topics: gas, stack, blocks"}
	}

	state := c.provider.GetState()
	topic := args[0]

	switch topic {
	case "gas":
		gasPercent := float64(state.Gas) / float64(state.MaxGas) * 100
		info := fmt.Sprintf(`Gas Information:
  Current: %d
  Maximum: %d
  Used: %d (%.1f%%)
  Remaining: %.1f%%`,
			state.Gas, state.MaxGas, state.MaxGas-state.Gas,
			100-gasPercent, gasPercent)
		return CommandResult{Success: true, Message: info}

	case "stack":
		info := fmt.Sprintf("Stack Information:\n  Size: %d items\n  Maximum reached: %d",
			len(state.Stack), state.Profile.MaxStackSize)
		if len(state.Stack) > 0 {
			info += fmt.Sprintf("\n  Top value: %s", state.Stack[0].String())
		}
		return CommandResult{Success: true, Message: info}

	case "blocks":
		info := "Basic Block Information:\n"
		for _, block := range state.BasicBlocks {
			info += fmt.Sprintf("  Block %d: PC 0x%04X-0x%04X, Gas: %d, Hits: %d\n",
				block.ID, block.StartPC, block.EndPC, block.TotalGas, block.HitCount)
		}
		return CommandResult{Success: true, Message: info}

	default:
		return CommandResult{Success: false, Message: fmt.Sprintf("Unknown info topic: %s. Available: gas, stack, blocks", topic)}
	}
}

// handleStep executes one step
func (c *CommandHandler) handleStep(args []string) CommandResult {
	if err := c.provider.Step(); err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Step failed: %s", err)}
	}
	return CommandResult{Success: true, Message: "Stepped forward"}
}

// handleRun starts execution
func (c *CommandHandler) handleRun(args []string) CommandResult {
	if err := c.provider.Run(); err != nil {
		return CommandResult{Success: false, Message: fmt.Sprintf("Run failed: %s", err)}
	}
	return CommandResult{Success: true, Message: "Running..."}
}

// handlePause pauses execution
func (c *CommandHandler) handlePause(args []string) CommandResult {
	c.provider.Pause()
	return CommandResult{Success: true, Message: "Execution paused"}
}

// handleReset resets execution
func (c *CommandHandler) handleReset(args []string) CommandResult {
	c.provider.Reset()
	return CommandResult{Success: true, Message: "Reset to beginning"}
}

// handleTrace shows execution history
func (c *CommandHandler) handleTrace(args []string) CommandResult {
	count := 10 // default
	if len(args) > 0 {
		if c, err := strconv.Atoi(args[0]); err == nil && c > 0 {
			count = c
		}
	}

	state := c.provider.GetState()
	history := state.ExecutionHistory
	
	if len(history) == 0 {
		return CommandResult{Success: true, Message: "No execution history available"}
	}

	// Get last 'count' steps
	start := 0
	if len(history) > count {
		start = len(history) - count
	}

	trace := fmt.Sprintf("Execution History (last %d steps):\n", len(history[start:]))
	for _, step := range history[start:] {
		gasUsed := step.GasBefore - step.GasAfter
		trace += fmt.Sprintf("  Step %d: PC 0x%04X %s (-%d gas)\n",
			step.StepNumber, step.PC, step.OpcodeName, gasUsed)
	}

	return CommandResult{Success: true, Message: trace}
}

// handleProfile shows execution profiling data
func (c *CommandHandler) handleProfile(args []string) CommandResult {
	state := c.provider.GetState()
	profile := state.Profile

	if profile.TotalSteps == 0 {
		return CommandResult{Success: true, Message: "No profiling data available"}
	}

	info := fmt.Sprintf(`Execution Profile:
  Total Steps: %d
  Total Gas Used: %d
  Max Stack Size: %d

Instruction Frequency:`, profile.TotalSteps, profile.TotalGasUsed, profile.MaxStackSize)

	for name, count := range profile.InstructionCounts {
		percentage := float64(count) / float64(profile.TotalSteps) * 100
		gasUsed := profile.GasUsage[name]
		info += fmt.Sprintf("\n  %s: %d times (%.1f%%), %d gas", name, count, percentage, gasUsed)
	}

	info += "\n\nBasic Block Hits:"
	for blockID, hits := range profile.BasicBlockHits {
		info += fmt.Sprintf("\n  Block %d: %d hits", blockID, hits)
	}

	return CommandResult{Success: true, Message: info}
}

// parseAddress parses a hex address string
func parseAddress(addr string) (uint64, error) {
	// Remove 0x prefix if present
	addr = strings.TrimPrefix(addr, "0x")
	addr = strings.TrimPrefix(addr, "0X")
	
	return strconv.ParseUint(addr, 16, 64)
}