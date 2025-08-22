package main

import (
	"flag"
	"fmt"
	"os"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// ActivePanel represents which panel currently has focus
type ActivePanel int

const (
	PanelBytecode ActivePanel = iota
	PanelStack
	PanelMemory
)

// Model represents the main application state
type Model struct {
	// Data provider
	provider DataProvider
	
	// UI components
	bytecodePanel *BytecodePanel
	stackPanel    *StackPanel
	memoryPanel   *MemoryPanel
	statusBar     *StatusBar
	helpBar       *HelpBar
	
	// Application state
	activePanel   ActivePanel
	autoRun       bool
	runSpeed      time.Duration
	lastUpdate    time.Time
	
	// Layout
	layout LayoutDims
}

// tickMsg is sent when auto-run mode should advance
type tickMsg time.Time

// Init initializes the application
func (m Model) Init() tea.Cmd {
	return tea.Batch(
		tea.EnterAltScreen,
		tickCmd(),
	)
}

// tickCmd returns a command that sends a tick message for auto-run
func tickCmd() tea.Cmd {
	return tea.Tick(time.Millisecond*200, func(t time.Time) tea.Msg {
		return tickMsg(t)
	})
}

// Update handles incoming messages and updates the model
func (m Model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		// Recalculate layout on window resize
		m.layout = CalculateLayout(msg.Width, msg.Height)
		m.updateComponentSizes()
		
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
			
		// Execution controls
		case " ", "enter": // Step
			m.stepExecution()
		case "r": // Run
			m.toggleAutoRun()
		case "p": // Pause
			m.pauseExecution()
		case "x": // Reset
			m.resetExecution()
			
		// Panel navigation
		case "tab":
			m.nextPanel()
		case "shift+tab":
			m.prevPanel()
			
		// Breakpoint toggle
		case "b":
			m.toggleBreakpoint()
			
		// Panel-specific navigation
		case "up", "k":
			m.handlePanelNavigation(-1)
		case "down", "j":
			m.handlePanelNavigation(1)
		case "page_up":
			m.handlePanelNavigation(-10)
		case "page_down":
			m.handlePanelNavigation(10)
		}
		
	case tickMsg:
		// Handle auto-run timing
		if m.autoRun && time.Since(m.lastUpdate) >= m.runSpeed {
			state := m.provider.GetState()
			if state.Status == StatusRunning {
				m.stepExecution()
			} else {
				m.autoRun = false
			}
		}
		cmds = append(cmds, tickCmd())
	}
	
	// Update all components
	m.updateAllComponents()
	
	return m, tea.Batch(cmds...)
}

// View renders the complete application UI
func (m Model) View() string {
	// Update component active states
	m.bytecodePanel.SetActive(m.activePanel == PanelBytecode)
	m.stackPanel.SetActive(m.activePanel == PanelStack)
	m.memoryPanel.SetActive(m.activePanel == PanelMemory)
	
	// Render status bar
	statusBar := m.statusBar.Render()
	
	// Render main content panels
	leftPanel := m.bytecodePanel.View()
	
	rightPanels := lipgloss.JoinVertical(lipgloss.Left,
		m.stackPanel.View(),
		m.memoryPanel.View(),
	)
	
	mainContent := lipgloss.JoinHorizontal(lipgloss.Top,
		leftPanel,
		rightPanels,
	)
	
	// Render help bar
	helpBar := m.helpBar.Render()
	
	// Combine all elements
	return lipgloss.JoinVertical(lipgloss.Left,
		statusBar,
		mainContent,
		helpBar,
	)
}

// Helper methods for application logic

func (m *Model) stepExecution() {
	if err := m.provider.Step(); err != nil {
		// Error occurred, execution will be paused
		m.autoRun = false
	}
	m.lastUpdate = time.Now()
}

func (m *Model) toggleAutoRun() {
	state := m.provider.GetState()
	if state.Status == StatusPaused || state.Status == StatusStopped {
		m.autoRun = !m.autoRun
		if m.autoRun {
			if err := m.provider.Run(); err != nil {
				m.autoRun = false
			}
		}
	} else if state.Status == StatusRunning {
		m.provider.Pause()
		m.autoRun = false
	}
}

func (m *Model) pauseExecution() {
	m.provider.Pause()
	m.autoRun = false
}

func (m *Model) resetExecution() {
	m.provider.Reset()
	m.autoRun = false
}

func (m *Model) nextPanel() {
	m.activePanel = (m.activePanel + 1) % 3
}

func (m *Model) prevPanel() {
	m.activePanel = (m.activePanel + 2) % 3 // +2 mod 3 = -1 mod 3
}

func (m *Model) toggleBreakpoint() {
	state := m.provider.GetState()
	if m.provider.IsBreakpoint(state.PC) {
		m.provider.ClearBreakpoint(state.PC)
	} else {
		m.provider.SetBreakpoint(state.PC)
	}
}

func (m *Model) handlePanelNavigation(delta int) {
	// Forward navigation to the active panel
	// This is where we'd implement scrolling within panels
	// For now, it's handled by the viewport components
}

func (m *Model) updateComponentSizes() {
	// Recreate components with new sizes
	m.bytecodePanel = NewBytecodePanel(m.provider, m.layout.LeftPanelWidth, m.layout.Height-6)
	m.stackPanel = NewStackPanel(m.provider, m.layout.RightPanelWidth, m.layout.StackHeight)
	m.memoryPanel = NewMemoryPanel(m.provider, m.layout.RightPanelWidth, m.layout.MemoryHeight)
	m.statusBar = NewStatusBar(m.provider, m.layout.Width)
	m.helpBar = NewHelpBar(m.layout.Width)
}

func (m *Model) updateAllComponents() {
	// Trigger re-render of all components
	m.bytecodePanel.Render()
	m.stackPanel.Render()
	m.memoryPanel.Render()
}

// NewModel creates a new application model
func NewModel(provider DataProvider) Model {
	// Initial layout (will be updated on first WindowSizeMsg)
	layout := CalculateLayout(80, 24)
	
	return Model{
		provider:      provider,
		bytecodePanel: NewBytecodePanel(provider, layout.LeftPanelWidth, layout.Height-6),
		stackPanel:    NewStackPanel(provider, layout.RightPanelWidth, layout.StackHeight),
		memoryPanel:   NewMemoryPanel(provider, layout.RightPanelWidth, layout.MemoryHeight),
		statusBar:     NewStatusBar(provider, layout.Width),
		helpBar:       NewHelpBar(layout.Width),
		activePanel:   PanelBytecode,
		autoRun:       false,
		runSpeed:      time.Millisecond * 500, // 2 steps per second
		lastUpdate:    time.Now(),
		layout:        layout,
	}
}

func main() {
	// Parse command line arguments
	var (
		useEVM2     = flag.Bool("use-evm2", false, "Use real EVM2 implementation instead of mock data")
		bytecodeHex = flag.String("bytecode", "", "Hex bytecode to execute (overrides default sample)")
		initialGas  = flag.Uint64("gas", 1000000, "Initial gas amount")
		showInfo    = flag.Bool("info", false, "Show build information and exit")
		showHelp    = flag.Bool("help", false, "Show help and exit")
		enhanced    = flag.Bool("enhanced", true, "Use enhanced V2 interface (default: true)")
	)
	flag.Parse()

	// Show help if requested
	if *showHelp {
		flag.Usage()
		fmt.Println("\nEVM Debugger V0.2 - Professional EVM execution visualizer")
		fmt.Println("Features: Multi-panel TUI, execution profiling, command interface, context help")
		fmt.Println("\nExamples:")
		fmt.Println("  evm-debugger                                    # Enhanced V2 with mock data")
		fmt.Println("  evm-debugger --use-evm2                         # Enhanced V2 with real EVM2")
		fmt.Println("  evm-debugger --use-evm2 --bytecode 6001600101   # Custom bytecode")
		fmt.Println("  evm-debugger --enhanced=false                   # Use V1 interface")
		fmt.Println("  evm-debugger --info                             # Show build information")
		fmt.Println("\nV2 Controls:")
		fmt.Println("  Space/Enter - Step execution")
		fmt.Println("  R - Run/Resume, P - Pause, X - Reset")
		fmt.Println("  B - Toggle breakpoint")
		fmt.Println("  : - Command mode (type 'help' for commands)")
		fmt.Println("  F1 - Opcode help, F2 - Commands, F3 - Keyboard shortcuts")
		fmt.Println("  Tab - Switch panels, V - Stack preview, A - ASCII toggle")
		fmt.Println("  Q/Ctrl+C - Quit")
		return
	}

	// Show build info if requested
	if *showInfo {
		if *useEVM2 {
			fmt.Print(BuildInfo())
		} else {
			fmt.Println("EVM Debugger V0.2 - Mock Mode")
			fmt.Println("Enhanced features: Command interface, profiling, help system")
			fmt.Println("Use --use-evm2 flag to see EVM2 build information")
		}
		return
	}

	// Create the appropriate data provider
	var provider DataProvider
	var err error

	if *useEVM2 {
		// Use real EVM2 implementation
		if *bytecodeHex != "" {
			provider, err = NewEVM2DataProvider(*bytecodeHex, *initialGas)
		} else {
			provider, err = NewEVM2DataProviderWithSample()
		}
		
		if err != nil {
			fmt.Printf("Error creating EVM2 provider: %v\n", err)
			fmt.Println("\nTry building the EVM2 C libraries first:")
			fmt.Println("  cd ../../ && zig build evm2-c")
			os.Exit(1)
		}

		// Print EVM2 info
		version, buildInfo := GetEVM2Version(), GetEVM2BuildInfo()
		fmt.Printf("Using EVM2: %s (%s)\n", version, buildInfo)
		
		// Setup cleanup
		defer func() {
			if evm2Provider, ok := provider.(*EVM2DataProvider); ok {
				evm2Provider.Cleanup()
			}
			CleanupEVM2()
		}()
	} else {
		// Use mock data provider - cast to DataProvider interface
		mockProvider := NewMockDataProvider()
		provider = DataProvider(mockProvider)
		fmt.Println("Using Enhanced Mock Data Provider V0.2")
		fmt.Println("Features: Gas profiling, basic blocks, execution history, memory watches")
	}

	// Use enhanced V2 interface by default
	if *enhanced {
		// Use the appropriate provider (mock or EVM2)
		m := NewModelV2WithProvider(provider)
		
		// Configure the tea program
		p := tea.NewProgram(
			m,
			tea.WithAltScreen(),       // Use alternate screen buffer
			tea.WithMouseCellMotion(), // Enable mouse support
		)
		
		// Start the program
		if _, err := p.Run(); err != nil {
			fmt.Printf("Error running enhanced EVM debugger: %v\n", err)
			os.Exit(1)
		}
	} else {
		// Use original V1 interface
		m := NewModel(provider)
		
		// Configure the tea program
		p := tea.NewProgram(
			m,
			tea.WithAltScreen(),       // Use alternate screen buffer
			tea.WithMouseCellMotion(), // Enable mouse support
		)
		
		// Start the program
		if _, err := p.Run(); err != nil {
			fmt.Printf("Error running EVM debugger: %v\n", err)
			os.Exit(1)
		}
	}
}