package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// StackDiffPanel shows before/after stack visualization with operation preview
type StackDiffPanel struct {
	*ViewportComponent
	provider DataProvider
	enabled  bool
}

// NewStackDiffPanel creates a new stack diff panel
func NewStackDiffPanel(provider DataProvider, width, height int) *StackDiffPanel {
	vp := NewViewportComponent("Stack Preview", width, height)
	
	return &StackDiffPanel{
		ViewportComponent: vp,
		provider:          provider,
		enabled:           true,
	}
}

// SetEnabled toggles the stack diff visualization
func (s *StackDiffPanel) SetEnabled(enabled bool) {
	s.enabled = enabled
	if enabled {
		s.title = "Stack Preview"
	} else {
		s.title = "Stack"
	}
}

// Render generates the stack diff content
func (s *StackDiffPanel) Render() {
	if !s.enabled {
		s.renderNormalStack()
		return
	}

	_ = s.provider.GetState()
	
	// Get operation preview
	preview := s.provider.GetNextOperation()
	if preview == nil {
		s.renderNormalStack()
		return
	}

	var lines []string
	
	// Operation description header
	opStyle := titleStyle.Copy().
		Background(ColorBgAlt).
		Foreground(ColorSecondary).
		Bold(true)
	
	opHeader := fmt.Sprintf("Next: %s (⚡%d gas)", preview.Instruction.Name, preview.GasCost)
	lines = append(lines, opStyle.Render(opHeader))
	lines = append(lines, "")
	
	// Description
	descStyle := baseStyle.Copy().
		Foreground(ColorInfo).
		Italic(true)
	lines = append(lines, descStyle.Render(preview.Description))
	lines = append(lines, "")
	
	// Before/After comparison
	beforeLines := s.formatStackState(preview.StackBefore, "Before")
	afterLines := s.formatStackState(preview.StackAfter, "After")
	
	// Calculate max lines to show side by side
	maxLines := len(beforeLines)
	if len(afterLines) > maxLines {
		maxLines = len(afterLines)
	}
	
	// Pad shorter side with empty lines
	for len(beforeLines) < maxLines {
		beforeLines = append(beforeLines, "")
	}
	for len(afterLines) < maxLines {
		afterLines = append(afterLines, "")
	}
	
	// Create side-by-side layout
	width := (s.viewport.Width - 4) / 2 // Account for borders and separator
	
	for i := 0; i < maxLines; i++ {
		beforePart := lipgloss.NewStyle().Width(width).Render(beforeLines[i])
		afterPart := lipgloss.NewStyle().Width(width).Render(afterLines[i])
		
		line := lipgloss.JoinHorizontal(lipgloss.Top,
			beforePart,
			stackIndexStyle.Render(" │ "),
			afterPart,
		)
		lines = append(lines, line)
	}
	
	// Show potential completion
	if preview.WillComplete {
		lines = append(lines, "")
		completeStyle := statusStoppedStyle.Copy().Bold(true)
		lines = append(lines, completeStyle.Render("🏁 This instruction will complete execution"))
	}
	
	content := strings.Join(lines, "\n")
	s.SetContent(content)
}

// renderNormalStack renders the standard stack view
func (s *StackDiffPanel) renderNormalStack() {
	state := s.provider.GetState()
	var lines []string
	
	if len(state.Stack) == 0 {
		lines = append(lines, stackItemStyle.Render("  [empty]"))
	} else {
		// Show "Top" label
		lines = append(lines, stackIndexStyle.Render("  Top"))
		
		// Show stack items (limited to fit in view)
		maxItems := s.viewport.Height - 2 // Account for Top/Bottom labels
		itemsToShow := len(state.Stack)
		if itemsToShow > maxItems {
			itemsToShow = maxItems
		}
		
		for i := 0; i < itemsToShow; i++ {
			item := state.Stack[i]
			indexStr := fmt.Sprintf("[%d]:", item.Index)
			valueStr := item.String()
			
			line := lipgloss.JoinHorizontal(lipgloss.Left,
				stackIndexStyle.Width(6).Render(indexStr),
				" ",
				stackValueStyle.Render(valueStr),
			)
			
			lines = append(lines, line)
		}
		
		// Show truncation indicator if needed
		if len(state.Stack) > maxItems {
			remaining := len(state.Stack) - maxItems
			lines = append(lines, stackIndexStyle.Render(fmt.Sprintf("  ... (%d more)", remaining)))
		}
		
		// Show "Bottom" label if we have items
		if len(state.Stack) > 0 {
			lines = append(lines, stackIndexStyle.Render("  Bottom"))
		}
	}
	
	content := strings.Join(lines, "\n")
	s.SetContent(content)
}

// formatStackState formats a stack state for display
func (s *StackDiffPanel) formatStackState(stack []StackItem, label string) []string {
	var lines []string
	
	// Header
	headerStyle := stackIndexStyle.Copy().Bold(true)
	lines = append(lines, headerStyle.Render(label))
	
	if len(stack) == 0 {
		lines = append(lines, stackItemStyle.Render("  [empty]"))
		return lines
	}
	
	// Show top indicator
	lines = append(lines, stackIndexStyle.Render("  Top"))
	
	// Show stack items (limited for space)
	maxItems := 8 // Reasonable limit for side-by-side view
	itemsToShow := len(stack)
	if itemsToShow > maxItems {
		itemsToShow = maxItems
	}
	
	for i := 0; i < itemsToShow; i++ {
		item := stack[i]
		indexStr := fmt.Sprintf("[%d]:", item.Index)
		
		// Shorten the value for side-by-side display
		valueStr := item.String()
		if len(valueStr) > 20 {
			valueStr = valueStr[:17] + "..."
		}
		
		line := lipgloss.JoinHorizontal(lipgloss.Left,
			stackIndexStyle.Width(4).Render(indexStr),
			" ",
			stackValueStyle.Render(valueStr),
		)
		
		lines = append(lines, line)
	}
	
	// Show truncation indicator if needed
	if len(stack) > maxItems {
		remaining := len(stack) - maxItems
		lines = append(lines, stackIndexStyle.Render(fmt.Sprintf("  ... (%d more)", remaining)))
	}
	
	// Show bottom indicator if we have items
	lines = append(lines, stackIndexStyle.Render("  Bottom"))
	
	return lines
}

// ToggleMode switches between preview and normal stack view
func (s *StackDiffPanel) ToggleMode() {
	s.enabled = !s.enabled
	s.SetEnabled(s.enabled)
}