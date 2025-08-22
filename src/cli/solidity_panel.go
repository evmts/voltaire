package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// SolidityPanel displays the Solidity source code corresponding to current bytecode execution
type SolidityPanel struct {
	provider DataProvider
	width    int
	height   int
	active   bool
	title    string
	style    lipgloss.Style
}

// NewSolidityPanel creates a new Solidity source panel
func NewSolidityPanel(provider DataProvider, width, height int) *SolidityPanel {
	return &SolidityPanel{
		provider: provider,
		width:    width,
		height:   height,
		active:   false,
		title:    "Solidity Source",
		style:    panelStyle,
	}
}

// SetActive sets whether this panel is currently focused
func (sp *SolidityPanel) SetActive(active bool) {
	sp.active = active
}

// Render generates the panel display
func (sp *SolidityPanel) Render() string {
	return sp.View()
}

// View returns the rendered panel content
func (sp *SolidityPanel) View() string {
	state := sp.provider.GetState()
	sourceMap := state.SourceMap
	
	// Get current source location based on PC
	currentLoc, hasMapping := sourceMap.Mappings[state.PC]
	
	var content strings.Builder
	
	// Function header
	if sourceMap.CurrentFunction != nil {
		content.WriteString(sp.renderFunctionHeader(sourceMap.CurrentFunction))
		content.WriteString("\n")
	}
	
	// Source code with highlighting
	if hasMapping {
		content.WriteString(sp.renderSourceWithHighlight(sourceMap.SourceCode, currentLoc))
	} else {
		content.WriteString(sp.renderFullSource(sourceMap.SourceCode))
	}
	
	// Current location info
	content.WriteString("\n")
	content.WriteString(sp.renderLocationInfo(currentLoc, hasMapping))
	
	// Create bordered content
	contentStr := content.String()
	lines := strings.Split(contentStr, "\n")
	
	// Truncate to fit panel height (accounting for borders and title)
	maxLines := sp.height - 4
	if len(lines) > maxLines {
		lines = lines[:maxLines]
	}
	
	// Ensure each line fits width
	for i, line := range lines {
		if len(line) > sp.width-4 {
			lines[i] = line[:sp.width-7] + "..."
		}
	}
	
	innerContent := strings.Join(lines, "\n")
	
	// Apply styling based on active state
	borderStyle := ColorSecondary
	titleColor := ColorSecondary
	if sp.active {
		borderStyle = ColorSuccess
		titleColor = ColorSuccess
	}
	
	style := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(borderStyle).
		Padding(0, 1).
		Width(sp.width).
		Height(sp.height)
	
	title := lipgloss.NewStyle().
		Foreground(titleColor).
		Bold(true).
		Render(sp.title)
	
	return style.Render(title + "\n" + innerContent)
}

// renderFunctionHeader displays current function information
func (sp *SolidityPanel) renderFunctionHeader(fn *FunctionInfo) string {
	var header strings.Builder
	
	// Function signature
	fnStyle := lipgloss.NewStyle().Foreground(ColorPrimary).Bold(true)
	visStyle := lipgloss.NewStyle().Foreground(ColorMuted)
	
	header.WriteString(fnStyle.Render("function "))
	header.WriteString(lipgloss.NewStyle().Foreground(ColorSuccess).Render(fn.Name))
	header.WriteString("() ")
	header.WriteString(visStyle.Render(fn.Visibility))
	
	if fn.StateMutability != "nonpayable" {
		header.WriteString(" ")
		header.WriteString(visStyle.Render(fn.StateMutability))
	}
	
	// Function selector
	selector := fmt.Sprintf("0x%x", fn.Selector)
	header.WriteString(" ")
	header.WriteString(lipgloss.NewStyle().Foreground(ColorSecondary).Render("[" + selector + "]"))
	
	return header.String()
}

// renderSourceWithHighlight shows source code with current line highlighted
func (sp *SolidityPanel) renderSourceWithHighlight(sourceCode string, currentLoc SourceLocation) string {
	lines := strings.Split(sourceCode, "\n")
	var result strings.Builder
	
	// Calculate visible range around current line
	currentLine := currentLoc.Line - 1 // Convert to 0-based
	contextLines := 3
	start := max(0, currentLine-contextLines)
	end := min(len(lines), currentLine+contextLines+1)
	
	for i := start; i < end; i++ {
		lineNum := i + 1
		line := lines[i]
		
		// Truncate long lines
		if len(line) > sp.width-10 {
			line = line[:sp.width-13] + "..."
		}
		
		// Style the line
		lineNumStr := fmt.Sprintf("%2d", lineNum)
		
		if lineNum == currentLoc.Line {
			// Highlight current line
			result.WriteString(lipgloss.NewStyle().
				Foreground(ColorWarning).
				Bold(true).
				Render("►" + lineNumStr + " " + line))
		} else {
			// Normal line
			result.WriteString(lipgloss.NewStyle().
				Foreground(ColorSecondary).
				Render(" " + lineNumStr + " "))
			result.WriteString(line)
		}
		
		if i < end-1 {
			result.WriteString("\n")
		}
	}
	
	return result.String()
}

// renderFullSource shows full source when no specific mapping
func (sp *SolidityPanel) renderFullSource(sourceCode string) string {
	lines := strings.Split(sourceCode, "\n")
	var result strings.Builder
	
	maxLines := min(len(lines), sp.height-6)
	
	for i := 0; i < maxLines; i++ {
		line := lines[i]
		
		// Truncate long lines
		if len(line) > sp.width-8 {
			line = line[:sp.width-11] + "..."
		}
		
		lineNum := fmt.Sprintf("%2d", i+1)
		result.WriteString(lipgloss.NewStyle().
			Foreground(ColorSecondary).
			Render(" " + lineNum + " " + line))
		
		if i < maxLines-1 {
			result.WriteString("\n")
		}
	}
	
	return result.String()
}

// renderLocationInfo shows details about current source location
func (sp *SolidityPanel) renderLocationInfo(loc SourceLocation, hasMapping bool) string {
	if !hasMapping {
		return lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render("No source mapping for current PC")
	}
	
	var info strings.Builder
	
	// Source text
	info.WriteString(lipgloss.NewStyle().
		Foreground(ColorPrimary).
		Bold(true).
		Render("Code: "))
	info.WriteString(lipgloss.NewStyle().
		Foreground(ColorInfo).
		Render(loc.SourceText))
	
	// Context
	if loc.Context != "" {
		info.WriteString("\n")
		info.WriteString(lipgloss.NewStyle().
			Foreground(ColorPrimary).
			Bold(true).
			Render("Context: "))
		info.WriteString(lipgloss.NewStyle().
			Foreground(ColorMuted).
			Render(loc.Context))
	}
	
	// Location details
	info.WriteString("\n")
	info.WriteString(lipgloss.NewStyle().
		Foreground(ColorSecondary).
		Render(fmt.Sprintf("Line %d, Col %d", loc.Line, loc.Column)))
	
	return info.String()
}

// Helper functions
func max(a, b int) int {
	if a > b {
		return a
	}
	return b
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}