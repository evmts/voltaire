package main

import (
	"fmt"
	"sort"
	"strings"

	"github.com/charmbracelet/lipgloss"
)

// ProfilingPanel displays execution analytics and profiling data
type ProfilingPanel struct {
	*ViewportComponent
	provider DataProvider
	mode     ProfilingMode
}

// ProfilingMode represents different profiling views
type ProfilingMode int

const (
	ProfileInstructions ProfilingMode = iota
	ProfileGas
	ProfileBlocks
	ProfileHistory
)

// NewProfilingPanel creates a new profiling panel
func NewProfilingPanel(provider DataProvider, width, height int) *ProfilingPanel {
	vp := NewViewportComponent("Execution Profile", width, height)
	
	return &ProfilingPanel{
		ViewportComponent: vp,
		provider:          provider,
		mode:              ProfileInstructions,
	}
}

// SetMode changes the profiling view mode
func (p *ProfilingPanel) SetMode(mode ProfilingMode) {
	p.mode = mode
	
	switch mode {
	case ProfileInstructions:
		p.title = "📊 Instruction Profile"
	case ProfileGas:
		p.title = "⚡ Gas Profile"
	case ProfileBlocks:
		p.title = "🔗 Basic Block Profile"
	case ProfileHistory:
		p.title = "📜 Execution History"
	}
}

// NextMode cycles to the next profiling mode
func (p *ProfilingPanel) NextMode() {
	p.mode = (p.mode + 1) % 4
	p.SetMode(p.mode)
}

// Render generates the profiling content based on current mode
func (p *ProfilingPanel) Render() {
	state := p.provider.GetState()
	
	var lines []string
	
	switch p.mode {
	case ProfileInstructions:
		lines = p.renderInstructionProfile(state)
	case ProfileGas:
		lines = p.renderGasProfile(state)
	case ProfileBlocks:
		lines = p.renderBlockProfile(state)
	case ProfileHistory:
		lines = p.renderExecutionHistory(state)
	}
	
	content := strings.Join(lines, "\n")
	p.SetContent(content)
}

// renderInstructionProfile shows instruction frequency analysis
func (p *ProfilingPanel) renderInstructionProfile(state *EVMState) []string {
	var lines []string
	profile := state.Profile
	
	if profile.TotalSteps == 0 {
		lines = append(lines, stackIndexStyle.Render("No execution data available"))
		return lines
	}
	
	// Overview
	lines = append(lines, titleStyle.Render("📊 Instruction Frequency Analysis"))
	lines = append(lines, "")
	
	overviewStyle := baseStyle.Copy().Foreground(ColorInfo)
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Total Steps: %d", profile.TotalSteps)))
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Unique Instructions: %d", len(profile.InstructionCounts))))
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Max Stack Size: %d", profile.MaxStackSize)))
	lines = append(lines, "")
	
	// Sort instructions by frequency
	type instCount struct {
		name  string
		count int
		gas   uint64
	}
	
	var instructions []instCount
	for name, count := range profile.InstructionCounts {
		gas := profile.GasUsage[name]
		instructions = append(instructions, instCount{name, count, gas})
	}
	
	sort.Slice(instructions, func(i, j int) bool {
		return instructions[i].count > instructions[j].count
	})
	
	// Instruction frequency table
	lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("Instruction Frequency:"))
	lines = append(lines, "")
	
	headerStyle := stackIndexStyle.Copy().Bold(true)
	header := lipgloss.JoinHorizontal(lipgloss.Left,
		headerStyle.Width(10).Render("Opcode"),
		headerStyle.Width(8).Render("Count"),
		headerStyle.Width(8).Render("Percent"),
		headerStyle.Width(12).Render("Total Gas"),
		headerStyle.Render("Avg Gas"),
	)
	lines = append(lines, header)
	
	for _, inst := range instructions {
		percentage := float64(inst.count) / float64(profile.TotalSteps) * 100
		avgGas := float64(inst.gas) / float64(inst.count)
		
		// Color coding based on frequency
		var nameStyle lipgloss.Style
		if percentage > 30 {
			nameStyle = gasCriticalStyle // High frequency - red
		} else if percentage > 15 {
			nameStyle = gasLowStyle // Medium frequency - yellow
		} else {
			nameStyle = gasNormalStyle // Low frequency - green
		}
		
		row := lipgloss.JoinHorizontal(lipgloss.Left,
			nameStyle.Width(10).Render(inst.name),
			stackIndexStyle.Width(8).Render(fmt.Sprintf("%d", inst.count)),
			stackIndexStyle.Width(8).Render(fmt.Sprintf("%.1f%%", percentage)),
			stackValueStyle.Width(12).Render(fmt.Sprintf("%d", inst.gas)),
			stackIndexStyle.Render(fmt.Sprintf("%.1f", avgGas)),
		)
		lines = append(lines, row)
	}
	
	return lines
}

// renderGasProfile shows gas usage analysis
func (p *ProfilingPanel) renderGasProfile(state *EVMState) []string {
	var lines []string
	profile := state.Profile
	
	if profile.TotalGasUsed == 0 {
		lines = append(lines, stackIndexStyle.Render("No gas usage data available"))
		return lines
	}
	
	// Overview
	lines = append(lines, titleStyle.Render("⚡ Gas Usage Analysis"))
	lines = append(lines, "")
	
	overviewStyle := baseStyle.Copy().Foreground(ColorInfo)
	gasRemaining := state.Gas
	gasUsed := state.MaxGas - gasRemaining
	gasPercent := float64(gasUsed) / float64(state.MaxGas) * 100
	
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Total Gas Used: %d", gasUsed)))
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Gas Remaining: %d", gasRemaining)))
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Usage: %.2f%%", gasPercent)))
	
	if profile.TotalSteps > 0 {
		avgGasPerStep := float64(gasUsed) / float64(profile.TotalSteps)
		lines = append(lines, overviewStyle.Render(fmt.Sprintf("Avg per Step: %.2f", avgGasPerStep)))
	}
	lines = append(lines, "")
	
	// Sort by gas usage
	type gasUsage struct {
		name string
		gas  uint64
	}
	
	var gasData []gasUsage
	for name, gas := range profile.GasUsage {
		gasData = append(gasData, gasUsage{name, gas})
	}
	
	sort.Slice(gasData, func(i, j int) bool {
		return gasData[i].gas > gasData[j].gas
	})
	
	// Gas usage table
	lines = append(lines, stackIndexStyle.Copy().Bold(true).Render("Gas Usage by Instruction:"))
	lines = append(lines, "")
	
	headerStyle := stackIndexStyle.Copy().Bold(true)
	header := lipgloss.JoinHorizontal(lipgloss.Left,
		headerStyle.Width(12).Render("Opcode"),
		headerStyle.Width(12).Render("Total Gas"),
		headerStyle.Width(10).Render("Percent"),
		headerStyle.Render("Visual"),
	)
	lines = append(lines, header)
	
	for _, data := range gasData {
		percentage := float64(data.gas) / float64(gasUsed) * 100
		
		// Create visual bar
		barWidth := int(percentage / 5) // Scale down for display
		if barWidth > 20 {
			barWidth = 20
		}
		bar := strings.Repeat("█", barWidth)
		
		// Color coding
		var gasStyle lipgloss.Style
		if percentage > 40 {
			gasStyle = gasCriticalStyle
		} else if percentage > 20 {
			gasStyle = gasLowStyle
		} else {
			gasStyle = gasNormalStyle
		}
		
		row := lipgloss.JoinHorizontal(lipgloss.Left,
			gasStyle.Width(12).Render(data.name),
			stackValueStyle.Width(12).Render(fmt.Sprintf("%d", data.gas)),
			stackIndexStyle.Width(10).Render(fmt.Sprintf("%.1f%%", percentage)),
			gasStyle.Render(bar),
		)
		lines = append(lines, row)
	}
	
	return lines
}

// renderBlockProfile shows basic block execution statistics
func (p *ProfilingPanel) renderBlockProfile(state *EVMState) []string {
	var lines []string
	
	lines = append(lines, titleStyle.Render("🔗 Basic Block Analysis"))
	lines = append(lines, "")
	
	if len(state.BasicBlocks) == 0 {
		lines = append(lines, stackIndexStyle.Render("No basic block data available"))
		return lines
	}
	
	// Calculate total hits
	totalHits := 0
	for _, hits := range state.Profile.BasicBlockHits {
		totalHits += hits
	}
	
	if totalHits == 0 {
		lines = append(lines, stackIndexStyle.Render("No execution data available"))
		return lines
	}
	
	overviewStyle := baseStyle.Copy().Foreground(ColorInfo)
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Total Blocks: %d", len(state.BasicBlocks))))
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Total Block Hits: %d", totalHits)))
	lines = append(lines, "")
	
	// Basic blocks table
	headerStyle := stackIndexStyle.Copy().Bold(true)
	header := lipgloss.JoinHorizontal(lipgloss.Left,
		headerStyle.Width(8).Render("Block"),
		headerStyle.Width(12).Render("PC Range"),
		headerStyle.Width(8).Render("Gas"),
		headerStyle.Width(8).Render("Hits"),
		headerStyle.Width(10).Render("Percent"),
		headerStyle.Render("Hotness"),
	)
	lines = append(lines, header)
	
	for _, block := range state.BasicBlocks {
		hits := state.Profile.BasicBlockHits[block.ID]
		percentage := float64(hits) / float64(totalHits) * 100
		
		// Create hotness indicator
		var hotnessStyle lipgloss.Style
		var hotness string
		if percentage > 50 {
			hotnessStyle = gasCriticalStyle
			hotness = "🔥🔥🔥"
		} else if percentage > 25 {
			hotnessStyle = gasLowStyle
			hotness = "🔥🔥"
		} else if percentage > 10 {
			hotnessStyle = gasNormalStyle
			hotness = "🔥"
		} else {
			hotnessStyle = stackIndexStyle
			hotness = "❄️"
		}
		
		pcRange := fmt.Sprintf("0x%04X-0x%04X", block.StartPC, block.EndPC)
		
		row := lipgloss.JoinHorizontal(lipgloss.Left,
			stackIndexStyle.Width(8).Render(fmt.Sprintf("Block %d", block.ID)),
			memoryAddressStyle.Width(12).Render(pcRange),
			stackValueStyle.Width(8).Render(fmt.Sprintf("%d", block.TotalGas)),
			stackValueStyle.Width(8).Render(fmt.Sprintf("%d", hits)),
			stackIndexStyle.Width(10).Render(fmt.Sprintf("%.1f%%", percentage)),
			hotnessStyle.Render(hotness),
		)
		lines = append(lines, row)
	}
	
	return lines
}

// renderExecutionHistory shows recent execution steps
func (p *ProfilingPanel) renderExecutionHistory(state *EVMState) []string {
	var lines []string
	
	lines = append(lines, titleStyle.Render("📜 Execution History"))
	lines = append(lines, "")
	
	if len(state.ExecutionHistory) == 0 {
		lines = append(lines, stackIndexStyle.Render("No execution history available"))
		return lines
	}
	
	// Show overview
	overviewStyle := baseStyle.Copy().Foreground(ColorInfo)
	lines = append(lines, overviewStyle.Render(fmt.Sprintf("Total Steps: %d", len(state.ExecutionHistory))))
	lines = append(lines, "")
	
	// Show recent steps (last 20 or viewport height limit)
	maxSteps := p.viewport.Height - 6 // Account for headers
	if maxSteps > 20 {
		maxSteps = 20
	}
	
	start := 0
	if len(state.ExecutionHistory) > maxSteps {
		start = len(state.ExecutionHistory) - maxSteps
	}
	
	// History table header
	headerStyle := stackIndexStyle.Copy().Bold(true)
	header := lipgloss.JoinHorizontal(lipgloss.Left,
		headerStyle.Width(6).Render("Step"),
		headerStyle.Width(8).Render("PC"),
		headerStyle.Width(12).Render("Opcode"),
		headerStyle.Width(8).Render("Gas"),
		headerStyle.Render("Stack Change"),
	)
	lines = append(lines, header)
	
	for i := start; i < len(state.ExecutionHistory); i++ {
		step := state.ExecutionHistory[i]
		gasUsed := step.GasBefore - step.GasAfter
		
		// Calculate stack change
		stackChange := len(step.StackAfter) - len(step.StackBefore)
		var stackChangeStr string
		var stackChangeStyle lipgloss.Style
		
		if stackChange > 0 {
			stackChangeStr = fmt.Sprintf("+%d", stackChange)
			stackChangeStyle = gasNormalStyle
		} else if stackChange < 0 {
			stackChangeStr = fmt.Sprintf("%d", stackChange)
			stackChangeStyle = gasLowStyle
		} else {
			stackChangeStr = "0"
			stackChangeStyle = stackIndexStyle
		}
		
		// Highlight current step
		var stepStyle lipgloss.Style
		if i == len(state.ExecutionHistory)-1 {
			stepStyle = currentInstructionStyle
		} else {
			stepStyle = stackIndexStyle
		}
		
		row := lipgloss.JoinHorizontal(lipgloss.Left,
			stepStyle.Width(6).Render(fmt.Sprintf("%d", step.StepNumber)),
			memoryAddressStyle.Width(8).Render(fmt.Sprintf("0x%04X", step.PC)),
			stackValueStyle.Width(12).Render(step.OpcodeName),
			gasNormalStyle.Width(8).Render(fmt.Sprintf("-%d", gasUsed)),
			stackChangeStyle.Render(stackChangeStr),
		)
		lines = append(lines, row)
	}
	
	if start > 0 {
		lines = append(lines, "")
		lines = append(lines, stackIndexStyle.Render(fmt.Sprintf("... (%d earlier steps)", start)))
	}
	
	return lines
}