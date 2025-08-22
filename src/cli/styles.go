package main

import (
	"github.com/charmbracelet/lipgloss"
)

// Color palette - Professional dark theme with functional colors
var (
	// Base colors
	ColorPrimary   = lipgloss.Color("#00D7FF") // Bright cyan - headers, focus
	ColorSecondary = lipgloss.Color("#FFB86C") // Orange - highlights
	ColorSuccess   = lipgloss.Color("#50FA7B") // Green - success, positive values
	ColorWarning   = lipgloss.Color("#F1FA8C") // Yellow - warnings, current instruction
	ColorDanger    = lipgloss.Color("#FF5555") // Red - errors, critical
	ColorInfo      = lipgloss.Color("#8BE9FD") // Light cyan - info text
	ColorMuted     = lipgloss.Color("#6272A4") // Gray - secondary text
	ColorBorder    = lipgloss.Color("#44475A") // Dark gray - borders
	ColorBg        = lipgloss.Color("#282A36") // Background
	ColorBgAlt     = lipgloss.Color("#21222C") // Alternative background
)

// Style definitions
var (
	// Base styles
	baseStyle = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#F8F8F2"))

	// Header styles
	headerStyle = baseStyle.Copy().
			Foreground(ColorPrimary).
			Bold(true).
			Padding(0, 1)

	titleStyle = headerStyle.Copy().
			Background(ColorBg).
			Foreground(ColorPrimary).
			Bold(true).
			Padding(0, 2)

	// Panel styles
	panelStyle = baseStyle.Copy().
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorBorder).
			Padding(1, 2)

	activePanelStyle = panelStyle.Copy().
				BorderForeground(ColorPrimary)

	// Content styles
	instructionStyle = baseStyle.Copy().
				Padding(0, 1)

	currentInstructionStyle = instructionStyle.Copy().
					Background(ColorWarning).
					Foreground(lipgloss.Color("#000000")).
					Bold(true)

	breakpointStyle = instructionStyle.Copy().
				Background(ColorDanger).
				Foreground(lipgloss.Color("#FFFFFF")).
				Bold(true)

	stackItemStyle = baseStyle.Copy().
			Padding(0, 1)

	stackIndexStyle = stackItemStyle.Copy().
				Foreground(ColorMuted)

	stackValueStyle = stackItemStyle.Copy().
				Foreground(ColorSuccess)

	memoryAddressStyle = baseStyle.Copy().
				Foreground(ColorMuted)

	memoryDataStyle = baseStyle.Copy().
				Foreground(ColorInfo)

	memoryChangedStyle = memoryDataStyle.Copy().
				Foreground(ColorWarning).
				Bold(true)

	// Status styles
	statusRunningStyle = baseStyle.Copy().
				Foreground(ColorSuccess).
				Bold(true)

	statusPausedStyle = baseStyle.Copy().
				Foreground(ColorWarning).
				Bold(true)

	statusErrorStyle = baseStyle.Copy().
				Foreground(ColorDanger).
				Bold(true)

	statusStoppedStyle = baseStyle.Copy().
				Foreground(ColorMuted).
				Bold(true)

	// Gas styles
	gasNormalStyle = baseStyle.Copy().
			Foreground(ColorSuccess)

	gasLowStyle = baseStyle.Copy().
			Foreground(ColorWarning)

	gasCriticalStyle = baseStyle.Copy().
				Foreground(ColorDanger).
				Bold(true)

	// Footer/help styles
	helpStyle = baseStyle.Copy().
			Foreground(ColorMuted).
			Italic(true)

	keyStyle = baseStyle.Copy().
			Foreground(ColorInfo).
			Bold(true)

	// Error message styles
	errorStyle = baseStyle.Copy().
			Foreground(ColorDanger).
			Bold(true).
			Border(lipgloss.RoundedBorder()).
			BorderForeground(ColorDanger).
			Padding(1, 2)
)

// Helper functions for dynamic styling

// GetStatusStyle returns the appropriate style for execution status
func GetStatusStyle(status ExecutionStatus) lipgloss.Style {
	switch status {
	case StatusRunning:
		return statusRunningStyle
	case StatusPaused:
		return statusPausedStyle
	case StatusError:
		return statusErrorStyle
	case StatusStopped, StatusCompleted:
		return statusStoppedStyle
	default:
		return baseStyle
	}
}

// GetGasStyle returns the appropriate style based on gas level
func GetGasStyle(current, max uint64) lipgloss.Style {
	percentage := float64(current) / float64(max)
	switch {
	case percentage > 0.5:
		return gasNormalStyle
	case percentage > 0.2:
		return gasLowStyle
	default:
		return gasCriticalStyle
	}
}

// FormatHex formats a hex value with proper styling
func FormatHex(value string) string {
	return memoryDataStyle.Render(value)
}

// FormatAddress formats a memory address with proper styling
func FormatAddress(addr string) string {
	return memoryAddressStyle.Render(addr)
}

// FormatInstruction formats an instruction with appropriate styling
func FormatInstruction(inst Instruction, isCurrent, isBreakpoint bool) string {
	text := inst.String()
	
	if isBreakpoint {
		return breakpointStyle.Render("● " + text)
	}
	
	if isCurrent {
		return currentInstructionStyle.Render("► " + text)
	}
	
	return instructionStyle.Render("  " + text)
}

// Layout dimensions - responsive to terminal size
type LayoutDims struct {
	Width           int
	Height          int
	LeftPanelWidth  int
	RightPanelWidth int
	StackHeight     int
	MemoryHeight    int
}

// CalculateLayout calculates responsive layout dimensions
func CalculateLayout(termWidth, termHeight int) LayoutDims {
	// Reserve space for borders, titles, and footer
	usableWidth := termWidth - 4   // Account for outer borders
	usableHeight := termHeight - 6 // Account for header, footer, borders

	// Split width: 60% for bytecode, 40% for stack/memory
	leftWidth := int(float64(usableWidth) * 0.6)
	rightWidth := usableWidth - leftWidth

	// Split right panel: 60% for stack, 40% for memory
	stackHeight := int(float64(usableHeight) * 0.6)
	memoryHeight := usableHeight - stackHeight

	return LayoutDims{
		Width:           termWidth,
		Height:          termHeight,
		LeftPanelWidth:  leftWidth,
		RightPanelWidth: rightWidth,
		StackHeight:     stackHeight,
		MemoryHeight:    memoryHeight,
	}
}