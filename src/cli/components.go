package main

import (
	"fmt"
	"strings"

	"github.com/charmbracelet/bubbles/viewport"
	"github.com/charmbracelet/lipgloss"
)

// ViewportComponent wraps a viewport with additional functionality
type ViewportComponent struct {
	viewport     viewport.Model
	title        string
	active       bool
	showLineNums bool
}

// NewViewportComponent creates a new viewport component
func NewViewportComponent(title string, width, height int) *ViewportComponent {
	vp := viewport.New(width-4, height-4) // Account for borders and padding
	vp.Style = lipgloss.NewStyle()
	
	return &ViewportComponent{
		viewport:     vp,
		title:        title,
		active:       false,
		showLineNums: false,
	}
}

// SetActive sets the active state of the component
func (v *ViewportComponent) SetActive(active bool) {
	v.active = active
}

// SetContent sets the content of the viewport
func (v *ViewportComponent) SetContent(content string) {
	v.viewport.SetContent(content)
}

// View renders the component
func (v *ViewportComponent) View() string {
	title := headerStyle.Render(v.title)
	
	var style lipgloss.Style
	if v.active {
		style = activePanelStyle
	} else {
		style = panelStyle
	}
	
	return style.Render(
		lipgloss.JoinVertical(lipgloss.Left,
			title,
			v.viewport.View(),
		),
	)
}

// Update forwards updates to the viewport
func (v *ViewportComponent) Update(msg interface{}) {
	var cmd interface{}
	v.viewport, cmd = v.viewport.Update(msg)
	_ = cmd // We'll handle commands at the app level
}

// BytecodePanel displays disassembled bytecode with current instruction highlighting
type BytecodePanel struct {
	*ViewportComponent
	provider      DataProvider
	showGasCosts  bool
	showBasicBlocks bool
}

// NewBytecodePanel creates a new bytecode panel
func NewBytecodePanel(provider DataProvider, width, height int) *BytecodePanel {
	vp := NewViewportComponent("Bytecode", width, height)
	vp.showLineNums = true
	
	return &BytecodePanel{
		ViewportComponent: vp,
		provider:          provider,
		showGasCosts:      true,
		showBasicBlocks:   true,
	}
}

// Render generates the bytecode view content
func (b *BytecodePanel) Render() {
	state := b.provider.GetState()
	var lines []string
	
	// Group instructions by basic blocks if enabled
	if b.showBasicBlocks && len(state.BasicBlocks) > 0 {
		lines = b.renderWithBasicBlocks(state)
	} else {
		lines = b.renderSimple(state)
	}
	
	content := strings.Join(lines, "\n")
	b.SetContent(content)
	
	// Auto-scroll to current instruction
	if state.Status == StatusRunning || state.Status == StatusPaused {
		currentLine := -1
		for i, inst := range state.Instructions {
			if inst.PC == state.PC {
				currentLine = i
				break
			}
		}
		if currentLine >= 0 {
			// Scroll to keep current instruction visible
			lineHeight := 1
			viewportHeight := b.viewport.Height
			halfHeight := viewportHeight / 2
			
			if currentLine > halfHeight {
				targetOffset := (currentLine - halfHeight) * lineHeight
				if targetOffset != b.viewport.YOffset {
					b.viewport.SetYOffset(targetOffset)
				}
			} else {
				b.viewport.SetYOffset(0)
			}
		}
	}
}

// renderWithBasicBlocks renders bytecode grouped by basic blocks
func (b *BytecodePanel) renderWithBasicBlocks(state *EVMState) []string {
	var lines []string
	
	for _, block := range state.BasicBlocks {
		// Basic block header
		blockStyle := panelStyle.Copy().
			Foreground(ColorSecondary).
			Border(lipgloss.RoundedBorder(), true, true, false, false)
		
		header := fmt.Sprintf("╭─ Basic Block %d ──── Total Gas: %d ──── Hits: %d ─",
			block.ID, block.TotalGas, block.HitCount)
		lines = append(lines, blockStyle.Render(header))
		
		// Instructions in this block
		for _, inst := range state.Instructions {
			if inst.BasicBlock == block.ID {
				lines = append(lines, b.formatInstruction(inst, state))
			}
		}
		
		// Basic block footer
		footer := "╰" + strings.Repeat("─", len(header)-2) + "╯"
		lines = append(lines, blockStyle.Render(footer))
		lines = append(lines, "") // Spacing between blocks
	}
	
	return lines
}

// renderSimple renders bytecode without basic block grouping
func (b *BytecodePanel) renderSimple(state *EVMState) []string {
	var lines []string
	
	for _, inst := range state.Instructions {
		lines = append(lines, b.formatInstruction(inst, state))
	}
	
	return lines
}

// formatInstruction formats a single instruction with all details
func (b *BytecodePanel) formatInstruction(inst Instruction, state *EVMState) string {
	isCurrent := inst.PC == state.PC
	isBreakpoint := b.provider.IsBreakpoint(inst.PC)
	
	// Format PC address
	pcStr := fmt.Sprintf("0x%04X:", inst.PC)
	addrStyle := memoryAddressStyle.Copy()
	if isCurrent {
		addrStyle = addrStyle.Background(ColorWarning).Foreground(lipgloss.Color("#000000"))
	}
	
	// Format instruction name and args
	var instStr string
	if len(inst.Args) > 0 {
		instStr = fmt.Sprintf("%s 0x%02X", inst.Name, inst.Args[0])
	} else {
		instStr = inst.Name
	}
	
	// Format raw bytecode
	var rawBytes strings.Builder
	rawBytes.WriteString("[")
	rawBytes.WriteString(fmt.Sprintf("%02X", inst.Opcode))
	for _, arg := range inst.Args {
		rawBytes.WriteString(fmt.Sprintf(" %02X", arg))
	}
	rawBytes.WriteString("]")
	
	// Apply styling based on state
	if isBreakpoint {
		instStr = breakpointStyle.Render("● " + instStr)
	} else if isCurrent {
		instStr = currentInstructionStyle.Render("► " + instStr)
	} else {
		instStr = instructionStyle.Render("  " + instStr)
	}
	
	// Build the complete line
	var parts []string
	parts = append(parts, addrStyle.Width(8).Render(pcStr))
	parts = append(parts, instStr)
	
	if b.showGasCosts {
		gasStr := fmt.Sprintf("⚡%d", inst.Gas)
		gasStyle := gasNormalStyle
		if inst.Gas > 100 {
			gasStyle = gasLowStyle
		}
		if inst.Gas > 1000 {
			gasStyle = gasCriticalStyle
		}
		parts = append(parts, gasStyle.Render(gasStr))
	}
	
	// Add raw bytecode in muted style
	parts = append(parts, stackIndexStyle.Render(rawBytes.String()))
	
	// Add stack effect info
	if inst.StackPops > 0 || inst.StackPushes > 0 {
		effectStr := fmt.Sprintf("📊 -%d +%d", inst.StackPops, inst.StackPushes)
		parts = append(parts, stackIndexStyle.Render(effectStr))
	}
	
	return strings.Join(parts, " ")
}

// StackPanel displays the EVM stack
type StackPanel struct {
	*ViewportComponent
	provider DataProvider
}

// NewStackPanel creates a new stack panel
func NewStackPanel(provider DataProvider, width, height int) *StackPanel {
	vp := NewViewportComponent("Stack", width, height)
	
	return &StackPanel{
		ViewportComponent: vp,
		provider:          provider,
	}
}

// Render generates the stack view content
func (s *StackPanel) Render() {
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

// MemoryPanel displays EVM memory as a hex dump with watch regions
type MemoryPanel struct {
	*ViewportComponent
	provider    DataProvider
	lastMemory  []byte
	changedByte int
	showASCII   bool
	showWatched bool
}

// NewMemoryPanel creates a new memory panel
func NewMemoryPanel(provider DataProvider, width, height int) *MemoryPanel {
	vp := NewViewportComponent("Memory", width, height)
	
	return &MemoryPanel{
		ViewportComponent: vp,
		provider:          provider,
		lastMemory:        nil,
		changedByte:       -1,
		showASCII:         true,
		showWatched:       true,
	}
}

// Render generates the memory view content
func (m *MemoryPanel) Render() {
	state := m.provider.GetState()
	var lines []string
	
	// Track memory changes for highlighting
	if m.lastMemory != nil && len(m.lastMemory) == len(state.Memory) {
		for i := 0; i < len(state.Memory); i++ {
			if m.lastMemory[i] != state.Memory[i] {
				m.changedByte = i
				break
			}
		}
	}
	
	// Update last memory snapshot
	m.lastMemory = make([]byte, len(state.Memory))
	copy(m.lastMemory, state.Memory)
	
	// Show watched addresses first if enabled
	if m.showWatched && len(state.WatchedAddresses) > 0 {
		lines = append(lines, m.renderWatchedAddresses(state)...)
		lines = append(lines, "") // Separator
	}
	
	// Show memory dump
	lines = append(lines, m.renderMemoryDump(state)...)
	
	content := strings.Join(lines, "\n")
	m.SetContent(content)
}

// renderWatchedAddresses renders the watched addresses section
func (m *MemoryPanel) renderWatchedAddresses(state *EVMState) []string {
	var lines []string
	
	watchHeader := stackIndexStyle.Copy().Bold(true).Render("📍 Watched Addresses")
	lines = append(lines, watchHeader)
	
	for _, watched := range state.WatchedAddresses {
		if int(watched.Address) >= len(state.Memory) {
			continue // Skip invalid addresses
		}
		
		value := state.Memory[watched.Address]
		
		// Check if this address changed recently
		isChanged := int(watched.Address) == m.changedByte
		
		var valueStyle lipgloss.Style
		if isChanged {
			valueStyle = memoryChangedStyle
		} else {
			valueStyle = memoryDataStyle
		}
		
		// Format the watch line
		addrStr := fmt.Sprintf("0x%04X:", watched.Address)
		valueStr := fmt.Sprintf("%02X", value)
		labelStr := watched.Label
		
		// Show last change info if available
		changeInfo := ""
		if len(watched.Changes) > 0 {
			lastChange := watched.Changes[len(watched.Changes)-1]
			changeInfo = fmt.Sprintf(" (step %d)", lastChange.StepNumber)
		}
		
		line := lipgloss.JoinHorizontal(lipgloss.Left,
			memoryAddressStyle.Width(8).Render(addrStr),
			" ",
			valueStyle.Width(2).Render(valueStr),
			" ",
			stackIndexStyle.Render(labelStr),
			stackIndexStyle.Render(changeInfo),
		)
		
		lines = append(lines, line)
	}
	
	// Show recent changes
	recentChanges := m.provider.GetRecentMemoryChanges(3)
	if len(recentChanges) > 0 {
		lines = append(lines, "")
		lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("🕐 Recent Changes"))
		for _, change := range recentChanges {
			changeStr := fmt.Sprintf("  Step %d: 0x%04X = 0x%02X (was 0x%02X)",
				change.StepNumber, change.Address, change.NewValue, change.OldValue)
			lines = append(lines, stackIndexStyle.Render(changeStr))
		}
	}
	
	return lines
}

// renderMemoryDump renders the hex dump section
func (m *MemoryPanel) renderMemoryDump(state *EVMState) []string {
	var lines []string
	
	// Available space calculation
	usedLines := 0
	if m.showWatched && len(state.WatchedAddresses) > 0 {
		usedLines = len(state.WatchedAddresses) + 4 // Header + recent changes + separators
		recentChanges := m.provider.GetRecentMemoryChanges(3)
		usedLines += len(recentChanges)
	}
	
	availableRows := m.viewport.Height - usedLines - 2 // Account for headers
	if availableRows < 4 {
		availableRows = 4 // Minimum rows
	}
	
	// Show memory in 16-byte rows
	const bytesPerRow = 16
	bytesToShow := availableRows * bytesPerRow
	if bytesToShow > len(state.Memory) {
		bytesToShow = len(state.Memory)
	}
	
	if bytesToShow == 0 {
		lines = append(lines, memoryDataStyle.Render("  [empty]"))
		return lines
	}
	
	// Memory dump header
	dumpHeader := stackIndexStyle.Copy().Bold(true).Render("🎯 Memory Dump")
	lines = append(lines, dumpHeader)
	
	for offset := 0; offset < bytesToShow; offset += bytesPerRow {
		line := m.formatMemoryRow(state, offset, bytesPerRow)
		lines = append(lines, line)
	}
	
	return lines
}

// formatMemoryRow formats a single row of memory dump
func (m *MemoryPanel) formatMemoryRow(state *EVMState, offset, bytesPerRow int) string {
	// Format address
	addrStr := fmt.Sprintf("0x%04X:", offset)
	addrRendered := FormatAddress(addrStr)
	
	// Format hex bytes
	var hexParts []string
	var asciiParts []string
	
	for i := 0; i < bytesPerRow && offset+i < len(state.Memory); i++ {
		byteVal := state.Memory[offset+i]
		hexStr := fmt.Sprintf("%02X", byteVal)
		
		// Highlight watched addresses
		isWatched := false
		for _, watched := range state.WatchedAddresses {
			if watched.Address == uint64(offset+i) {
				isWatched = true
				break
			}
		}
		
		// Highlight changed bytes
		if offset+i == m.changedByte {
			hexStr = memoryChangedStyle.Render(hexStr)
		} else if isWatched {
			hexStr = stackValueStyle.Render(hexStr) // Use green for watched
		} else {
			hexStr = memoryDataStyle.Render(hexStr)
		}
		
		hexParts = append(hexParts, hexStr)
		
		// ASCII representation
		if m.showASCII {
			if byteVal >= 32 && byteVal <= 126 { // Printable ASCII
				asciiParts = append(asciiParts, string(rune(byteVal)))
			} else {
				asciiParts = append(asciiParts, ".")
			}
		}
	}
	
	// Pad with spaces if needed
	for len(hexParts) < bytesPerRow {
		hexParts = append(hexParts, "  ")
		if m.showASCII {
			asciiParts = append(asciiParts, " ")
		}
	}
	
	hexStr := strings.Join(hexParts, " ")
	
	parts := []string{addrRendered, " ", hexStr}
	
	if m.showASCII {
		asciiStr := strings.Join(asciiParts, "")
		parts = append(parts, "  ", stackIndexStyle.Render(asciiStr))
	}
	
	return lipgloss.JoinHorizontal(lipgloss.Left, parts...)
}

// ToggleASCII toggles ASCII display
func (m *MemoryPanel) ToggleASCII() {
	m.showASCII = !m.showASCII
}

// ToggleWatched toggles watched addresses display
func (m *MemoryPanel) ToggleWatched() {
	m.showWatched = !m.showWatched
}

// StatusBar displays execution status, gas, and PC information
type StatusBar struct {
	provider DataProvider
	width    int
}

// NewStatusBar creates a new status bar
func NewStatusBar(provider DataProvider, width int) *StatusBar {
	return &StatusBar{
		provider: provider,
		width:    width,
	}
}

// Render generates the status bar content
func (s *StatusBar) Render() string {
	state := s.provider.GetState()
	
	// Status
	statusText := GetStatusStyle(state.Status).Render(state.Status.String())
	
	// PC
	pcText := fmt.Sprintf("PC: 0x%04X", state.PC)
	pcRendered := memoryAddressStyle.Render(pcText)
	
	// Gas
	gasText := fmt.Sprintf("Gas: %d / %d", state.Gas, state.MaxGas)
	gasRendered := GetGasStyle(state.Gas, state.MaxGas).Render(gasText)
	
	// Error (if any)
	var errorText string
	if state.Error != "" {
		errorText = errorStyle.Render(fmt.Sprintf("Error: %s", state.Error))
	}
	
	// Stack size
	stackText := fmt.Sprintf("Stack: %d", len(state.Stack))
	stackRendered := stackIndexStyle.Render(stackText)
	
	// Join all status items
	var parts []string
	parts = append(parts, statusText, pcRendered, gasRendered, stackRendered)
	if errorText != "" {
		parts = append(parts, errorText)
	}
	
	statusLine := lipgloss.JoinHorizontal(lipgloss.Left,
		strings.Join(parts, " │ "),
	)
	
	// Center the status in available width
	return titleStyle.Width(s.width).Align(lipgloss.Center).Render(statusLine)
}

// HelpBar displays keyboard shortcuts
type HelpBar struct {
	width int
}

// NewHelpBar creates a new help bar
func NewHelpBar(width int) *HelpBar {
	return &HelpBar{width: width}
}

// Render generates the help bar content
func (h *HelpBar) Render() string {
	shortcuts := []string{
		keyStyle.Render("Space") + helpStyle.Render(":Step"),
		keyStyle.Render("R") + helpStyle.Render(":Run"),
		keyStyle.Render("P") + helpStyle.Render(":Pause"),
		keyStyle.Render("X") + helpStyle.Render(":Reset"),
		keyStyle.Render("B") + helpStyle.Render(":Breakpoint"),
		keyStyle.Render("Tab") + helpStyle.Render(":Switch"),
		keyStyle.Render("Q") + helpStyle.Render(":Quit"),
	}
	
	helpText := strings.Join(shortcuts, " │ ")
	
	return helpStyle.Width(h.width).Align(lipgloss.Center).Render(helpText)
}