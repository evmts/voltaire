package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// HelpPanel provides context-aware help and opcode documentation
type HelpPanel struct {
	*ViewportComponent
	provider    DataProvider
	mode        HelpMode
	selectedOp  byte
}

// HelpMode represents different help views
type HelpMode int

const (
	HelpOverview HelpMode = iota
	HelpOpcode
	HelpCommands
	HelpKeyboard
)

// NewHelpPanel creates a new help panel
func NewHelpPanel(provider DataProvider, width, height int) *HelpPanel {
	vp := NewViewportComponent("Help", width, height)
	
	return &HelpPanel{
		ViewportComponent: vp,
		provider:          provider,
		mode:              HelpOverview,
		selectedOp:        0x00,
	}
}

// SetMode changes the help view mode
func (h *HelpPanel) SetMode(mode HelpMode) {
	h.mode = mode
	
	switch mode {
	case HelpOverview:
		h.title = "💡 Help Overview"
	case HelpOpcode:
		h.title = "📚 Opcode Reference"
	case HelpCommands:
		h.title = "⌨️  Command Reference"
	case HelpKeyboard:
		h.title = "🎮 Keyboard Shortcuts"
	}
}

// ShowOpcodeHelp shows help for a specific opcode
func (h *HelpPanel) ShowOpcodeHelp(opcode byte) {
	h.selectedOp = opcode
	h.SetMode(HelpOpcode)
}

// ShowCurrentOpcodeHelp shows help for the current instruction
func (h *HelpPanel) ShowCurrentOpcodeHelp() {
	state := h.provider.GetState()
	if state.PC < uint64(len(state.Bytecode)) {
		h.ShowOpcodeHelp(state.Bytecode[state.PC])
	}
}

// Render generates the help content based on current mode
func (h *HelpPanel) Render() {
	var lines []string
	
	switch h.mode {
	case HelpOverview:
		lines = h.renderOverview()
	case HelpOpcode:
		lines = h.renderOpcodeHelp()
	case HelpCommands:
		lines = h.renderCommandHelp()
	case HelpKeyboard:
		lines = h.renderKeyboardHelp()
	}
	
	content := strings.Join(lines, "\n")
	h.SetContent(content)
}

// renderOverview shows the main help overview
func (h *HelpPanel) renderOverview() []string {
	var lines []string
	
	lines = append(lines, titleStyle.Render("🔍 EVM Debugger Help"))
	lines = append(lines, "")
	
	sectionStyle := stackIndexStyle.Copy().Bold(true)
	descStyle := baseStyle.Copy().Foreground(ColorInfo)
	
	// Quick start
	lines = append(lines, sectionStyle.Render("🚀 Quick Start"))
	lines = append(lines, descStyle.Render("• Space - Step through instructions one by one"))
	lines = append(lines, descStyle.Render("• R - Run continuously until breakpoint"))
	lines = append(lines, descStyle.Render("• B - Toggle breakpoint at current instruction"))
	lines = append(lines, descStyle.Render("• Tab - Switch between panels"))
	lines = append(lines, "")
	
	// Current state
	lines = append(lines, sectionStyle.Render("📊 Current State"))
	state := h.provider.GetState()
	
	if state.PC < uint64(len(state.Bytecode)) {
		currentOp := state.Bytecode[state.PC]
		var opName string
		for _, inst := range state.Instructions {
			if inst.PC == state.PC {
				opName = inst.Name
				break
			}
		}
		
		lines = append(lines, descStyle.Render(fmt.Sprintf("• Current instruction: %s (0x%02X)", opName, currentOp)))
		lines = append(lines, descStyle.Render(fmt.Sprintf("• Press F1 for detailed help on %s", opName)))
	}
	
	lines = append(lines, descStyle.Render(fmt.Sprintf("• Stack size: %d items", len(state.Stack))))
	lines = append(lines, descStyle.Render(fmt.Sprintf("• Gas remaining: %d", state.Gas)))
	lines = append(lines, "")
	
	// Help modes
	lines = append(lines, sectionStyle.Render("📚 Help Topics"))
	lines = append(lines, descStyle.Render("• F1 - Opcode reference for current instruction"))
	lines = append(lines, descStyle.Render("• F2 - Command reference"))
	lines = append(lines, descStyle.Render("• F3 - Keyboard shortcuts"))
	lines = append(lines, descStyle.Render("• Esc - Return to this overview"))
	lines = append(lines, "")
	
	// Tips
	lines = append(lines, sectionStyle.Render("💡 Pro Tips"))
	lines = append(lines, descStyle.Render("• Use : to enter command mode"))
	lines = append(lines, descStyle.Render("• Type 'help <command>' for specific command help"))
	lines = append(lines, descStyle.Render("• Watch memory with 'watch 0x40 label'"))
	lines = append(lines, descStyle.Render("• View execution profile with 'profile'"))
	
	return lines
}

// renderOpcodeHelp shows detailed help for a specific opcode
func (h *HelpPanel) renderOpcodeHelp() []string {
	var lines []string
	
	opInfo := getOpcodeInfo(h.selectedOp)
	
	// Header
	headerStyle := titleStyle.Copy().Background(ColorBgAlt)
	lines = append(lines, headerStyle.Render(fmt.Sprintf("📚 Opcode: %s (0x%02X)", opInfo.Name, h.selectedOp)))
	lines = append(lines, "")
	
	// Basic info section
	infoStyle := baseStyle.Copy().Foreground(ColorSecondary).Bold(true)
	valueStyle := baseStyle.Copy().Foreground(ColorInfo)
	
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		infoStyle.Render("Operation: "),
		valueStyle.Render(opInfo.Operation),
	))
	
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		infoStyle.Render("Gas Cost: "),
		GetGasStyle(opInfo.Gas, 1000).Render(fmt.Sprintf("%d", opInfo.Gas)),
	))
	
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		infoStyle.Render("Since: "),
		valueStyle.Render(opInfo.Since),
	))
	lines = append(lines, "")
	
	// Stack effects
	lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("📥 Stack Input:"))
	if len(opInfo.StackInput) == 0 {
		lines = append(lines, valueStyle.Render("  None"))
	} else {
		for i, input := range opInfo.StackInput {
			lines = append(lines, valueStyle.Render(fmt.Sprintf("  [%d] %s", i, input)))
		}
	}
	lines = append(lines, "")
	
	lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("📤 Stack Output:"))
	if len(opInfo.StackOutput) == 0 {
		lines = append(lines, valueStyle.Render("  None"))
	} else {
		for i, output := range opInfo.StackOutput {
			lines = append(lines, valueStyle.Render(fmt.Sprintf("  [%d] %s", i, output)))
		}
	}
	lines = append(lines, "")
	
	// Description
	lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("🎯 What it does:"))
	lines = append(lines, valueStyle.Render(opInfo.Description))
	lines = append(lines, "")
	
	// Behavior notes
	if len(opInfo.Behavior) > 0 {
		lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("⚠️  Behavior:"))
		for _, note := range opInfo.Behavior {
			lines = append(lines, valueStyle.Render("• "+note))
		}
		lines = append(lines, "")
	}
	
	// Example
	if opInfo.Example != "" {
		lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("🧪 Example:"))
		exampleStyle := baseStyle.Copy().Foreground(ColorSuccess)
		lines = append(lines, exampleStyle.Render(opInfo.Example))
		lines = append(lines, "")
	}
	
	// Common patterns
	if len(opInfo.CommonPatterns) > 0 {
		lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("💡 Common patterns:"))
		for _, pattern := range opInfo.CommonPatterns {
			lines = append(lines, valueStyle.Render("• "+pattern))
		}
	}
	
	return lines
}

// renderCommandHelp shows command reference
func (h *HelpPanel) renderCommandHelp() []string {
	var lines []string
	
	lines = append(lines, titleStyle.Render("⌨️  Command Reference"))
	lines = append(lines, "")
	
	sectionStyle := stackIndexStyle.Copy().Bold(true)
	cmdStyle := baseStyle.Copy().Foreground(ColorSuccess)
	descStyle := baseStyle.Copy().Foreground(ColorInfo)
	
	// Execution commands
	lines = append(lines, sectionStyle.Render("🏃 Execution Control:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("step, s"),
		descStyle.Render("Execute one instruction"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("run, r"),
		descStyle.Render("Run until breakpoint or completion"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("pause, p"),
		descStyle.Render("Pause execution"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("reset, x"),
		descStyle.Render("Reset to beginning"),
	))
	lines = append(lines, "")
	
	// Breakpoint commands
	lines = append(lines, sectionStyle.Render("🔴 Breakpoints:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("break 0x10, b 0x10"),
		descStyle.Render("Set breakpoint at address"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("clear 0x10, cl 0x10"),
		descStyle.Render("Clear breakpoint at address"),
	))
	lines = append(lines, "")
	
	// Navigation commands
	lines = append(lines, sectionStyle.Render("🧭 Navigation:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("jump 0x10, j 0x10"),
		descStyle.Render("Jump to address (no execution)"),
	))
	lines = append(lines, "")
	
	// Memory commands
	lines = append(lines, sectionStyle.Render("🔍 Memory Watching:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("watch 0x40"),
		descStyle.Render("Watch memory address"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("watch 0x40 \"label\""),
		descStyle.Render("Watch with custom label"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("unwatch 0x40"),
		descStyle.Render("Stop watching address"),
	))
	lines = append(lines, "")
	
	// Information commands
	lines = append(lines, sectionStyle.Render("📊 Information:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("info gas, i gas"),
		descStyle.Render("Show gas usage information"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("info stack, i stack"),
		descStyle.Render("Show stack information"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("info blocks"),
		descStyle.Render("Show basic block info"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("trace 5, t 5"),
		descStyle.Render("Show last N execution steps"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		cmdStyle.Width(20).Render("profile, prof"),
		descStyle.Render("Show execution profiling"),
	))
	
	return lines
}

// renderKeyboardHelp shows keyboard shortcuts
func (h *HelpPanel) renderKeyboardHelp() []string {
	var lines []string
	
	lines = append(lines, titleStyle.Render("🎮 Keyboard Shortcuts"))
	lines = append(lines, "")
	
	sectionStyle := stackIndexStyle.Copy().Bold(true)
	keyStyle := baseStyle.Copy().Foreground(ColorSuccess).Bold(true)
	descStyle := baseStyle.Copy().Foreground(ColorInfo)
	
	// Execution shortcuts
	lines = append(lines, sectionStyle.Render("🏃 Execution:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("Space, Enter"),
		descStyle.Render("Step forward one instruction"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("R"),
		descStyle.Render("Run/Resume execution"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("P"),
		descStyle.Render("Pause execution"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("X"),
		descStyle.Render("Reset to beginning"),
	))
	lines = append(lines, "")
	
	// Navigation shortcuts
	lines = append(lines, sectionStyle.Render("🧭 Navigation:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("Tab"),
		descStyle.Render("Switch panels (Bytecode → Stack → Memory)"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("Shift+Tab"),
		descStyle.Render("Switch panels in reverse"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("↑/↓, K/J"),
		descStyle.Render("Navigate within active panel"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("Page Up/Down"),
		descStyle.Render("Fast scroll within panels"),
	))
	lines = append(lines, "")
	
	// Debugging shortcuts
	lines = append(lines, sectionStyle.Render("🔴 Debugging:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("B"),
		descStyle.Render("Toggle breakpoint at current PC"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render(":"),
		descStyle.Render("Enter command mode"),
	))
	lines = append(lines, "")
	
	// Help shortcuts
	lines = append(lines, sectionStyle.Render("💡 Help:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("F1"),
		descStyle.Render("Help for current opcode"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("F2"),
		descStyle.Render("Command reference"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("F3"),
		descStyle.Render("Keyboard shortcuts (this screen)"),
	))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("Esc"),
		descStyle.Render("Close help / Return to overview"),
	))
	lines = append(lines, "")
	
	// System shortcuts
	lines = append(lines, sectionStyle.Render("🖥️  System:"))
	lines = append(lines, lipgloss.JoinHorizontal(lipgloss.Left,
		keyStyle.Width(15).Render("Q, Ctrl+C"),
		descStyle.Render("Quit debugger"),
	))
	
	return lines
}

// OpcodeInfo contains detailed information about an opcode
type OpcodeInfo struct {
	Name           string
	Operation      string
	Gas            uint64
	Since          string
	StackInput     []string
	StackOutput    []string
	Description    string
	Behavior       []string
	Example        string
	CommonPatterns []string
}

// getOpcodeInfo returns detailed information for an opcode
func getOpcodeInfo(opcode byte) OpcodeInfo {
	switch opcode {
	case 0x00:
		return OpcodeInfo{
			Name:        "STOP",
			Operation:   "Halt execution",
			Gas:         0,
			Since:       "Frontier",
			StackInput:  []string{},
			StackOutput: []string{},
			Description: "Halts execution successfully. This marks the end of contract execution.",
			Behavior:    []string{"Always succeeds", "No return data", "Remaining gas is refunded"},
			Example:     "Execution completes normally",
			CommonPatterns: []string{
				"End of constructor",
				"Fallback function termination",
				"Early exit conditions",
			},
		}
	case 0x01:
		return OpcodeInfo{
			Name:        "ADD",
			Operation:   "Addition",
			Gas:         3,
			Since:       "Frontier",
			StackInput:  []string{"a (uint256)", "b (uint256)"},
			StackOutput: []string{"a + b (uint256)"},
			Description: "Adds the top two values on the stack and pushes the result.",
			Behavior: []string{
				"Wraps on overflow (modulo 2^256)",
				"Always succeeds",
				"Pops 2 values, pushes 1",
			},
			Example: "Stack [5, 3] → [8] (5 + 3 = 8)",
			CommonPatterns: []string{
				"Arithmetic calculations",
				"Address calculations",
				"Loop counters",
				"Offset computations",
			},
		}
	case 0x03:
		return OpcodeInfo{
			Name:        "SUB",
			Operation:   "Subtraction",
			Gas:         3,
			Since:       "Frontier",
			StackInput:  []string{"a (uint256)", "b (uint256)"},
			StackOutput: []string{"a - b (uint256)"},
			Description: "Subtracts the second stack value from the first and pushes the result.",
			Behavior: []string{
				"Wraps on underflow (modulo 2^256)",
				"Always succeeds",
				"Pops 2 values, pushes 1",
			},
			Example: "Stack [10, 3] → [7] (10 - 3 = 7)",
			CommonPatterns: []string{
				"Balance calculations",
				"Size decrements",
				"Bounds checking",
				"Time differences",
			},
		}
	case 0x60:
		return OpcodeInfo{
			Name:        "PUSH1",
			Operation:   "Push 1-byte value",
			Gas:         3,
			Since:       "Frontier",
			StackInput:  []string{},
			StackOutput: []string{"value (uint256)"},
			Description: "Pushes a 1-byte value from bytecode onto the stack.",
			Behavior: []string{
				"Reads next byte from bytecode",
				"Zero-extends to 256 bits",
				"Always succeeds",
			},
			Example: "PUSH1 0x42 → Stack: [0x42]",
			CommonPatterns: []string{
				"Small constants (0-255)",
				"Opcode values",
				"Small offsets",
				"Boolean values (0x00, 0x01)",
			},
		}
	default:
		return OpcodeInfo{
			Name:           fmt.Sprintf("0x%02X", opcode),
			Operation:      "Unknown opcode",
			Gas:            0,
			Since:          "Unknown",
			StackInput:     []string{},
			StackOutput:    []string{},
			Description:    "This opcode is not recognized or not yet implemented.",
			Behavior:       []string{"May be invalid", "Could cause revert"},
			Example:        "No example available",
			CommonPatterns: []string{"Unknown usage patterns"},
		}
	}
}