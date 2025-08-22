package main

import (
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

// AppMode is an alias for CommandMode
type AppMode = CommandMode

// ActivePanelV2 represents which panel currently has focus
type ActivePanelV2 int

const (
	PanelBytecodeV2 ActivePanelV2 = iota
	PanelStackV2
	PanelMemoryV2
	PanelSolidityV2
	PanelProfilingV2
	PanelHelpV2
)

// ModelV2 represents the enhanced application state
type ModelV2 struct {
	// Data provider
	provider DataProvider
	
	// Command system
	commandHandler *CommandHandler
	commandInput   string
	commandResult  CommandResult
	
	// UI components
	bytecodePanel *BytecodePanel
	stackPanel    *StackDiffPanel
	memoryPanel   *MemoryPanel
	solidityPanel *SolidityPanel
	profilingPanel *ProfilingPanel
	helpPanel     *HelpPanel
	statusBar     *StatusBar
	helpBar       *HelpBar
	
	// Application state
	mode          AppMode
	activePanel   ActivePanelV2
	autoRun       bool
	runSpeed      time.Duration
	lastUpdate    time.Time
	showPreview   bool
	
	// Layout
	layout LayoutDims
}

// tickMsgV2 is sent when auto-run mode should advance
type tickMsgV2 time.Time

// commandMsgV2 is sent when a command is executed
type commandMsgV2 struct {
	result CommandResult
}

// Init initializes the enhanced application
func (m ModelV2) Init() tea.Cmd {
	return tea.Batch(
		tea.EnterAltScreen,
		tickCmdV2(),
	)
}

// tickCmdV2 returns a command that sends a tick message for auto-run
func tickCmdV2() tea.Cmd {
	return tea.Tick(time.Millisecond*200, func(t time.Time) tea.Msg {
		return tickMsgV2(t)
	})
}

// Update handles incoming messages and updates the enhanced model
func (m ModelV2) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd
	
	switch msg := msg.(type) {
	case tea.WindowSizeMsg:
		// Recalculate layout on window resize
		m.layout = CalculateLayout(msg.Width, msg.Height)
		m.updateComponentSizes()
		
	case tea.KeyMsg:
		if m.mode == ModeCommand {
			return m.handleCommandMode(msg)
		} else if m.mode == ModeHelp {
			return m.handleHelpMode(msg)
		}
		
		// TUI mode key handling
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
			
		// Mode switching
		case ":":
			m.mode = ModeCommand
			m.commandInput = ""
			m.commandResult = CommandResult{}
		case "f1":
			m.helpPanel.ShowCurrentOpcodeHelp()
			m.mode = ModeHelp
			m.activePanel = PanelHelpV2
		case "f2":
			m.helpPanel.SetMode(HelpCommands)
			m.mode = ModeHelp
			m.activePanel = PanelHelpV2
		case "f3":
			m.helpPanel.SetMode(HelpKeyboard)
			m.mode = ModeHelp
			m.activePanel = PanelHelpV2
		case "escape", "esc":
			if m.mode == ModeHelp {
				m.helpPanel.SetMode(HelpOverview)
			}
			m.mode = ModeTUI
			
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
			
		// Panel-specific controls
		case "up", "k":
			m.handlePanelNavigation(-1)
		case "down", "j":
			m.handlePanelNavigation(1)
		case "page_up":
			m.handlePanelNavigation(-10)
		case "page_down":
			m.handlePanelNavigation(10)
			
		// Toggle features
		case "v": // Toggle stack preview
			m.stackPanel.ToggleMode()
			m.showPreview = !m.showPreview
		case "a": // Toggle ASCII in memory
			m.memoryPanel.ToggleASCII()
		case "w": // Toggle watched addresses
			m.memoryPanel.ToggleWatched()
		case "m": // Cycle profiling modes
			m.profilingPanel.NextMode()
		}
		
	case tickMsgV2:
		// Handle auto-run timing
		if m.autoRun && time.Since(m.lastUpdate) >= m.runSpeed {
			state := m.provider.GetState()
			if state.Status == StatusRunning {
				m.stepExecution()
			} else {
				m.autoRun = false
			}
		}
		cmds = append(cmds, tickCmdV2())
		
	case commandMsgV2:
		// Handle command results
		m.commandResult = msg.result
		if msg.result.Data == "quit" {
			return m, tea.Quit
		}
		m.mode = ModeTUI
	}
	
	// Update all components
	m.updateAllComponents()
	
	return m, tea.Batch(cmds...)
}

// handleCommandMode handles input in command mode
func (m ModelV2) handleCommandMode(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "escape", "esc":
		m.mode = ModeTUI
		m.commandInput = ""
		m.commandResult = CommandResult{}
	case "enter":
		// Execute command
		cmd := ParseCommand(m.commandInput)
		result := m.commandHandler.Execute(cmd)
		return m, func() tea.Msg {
			return commandMsgV2{result: result}
		}
	case "backspace":
		if len(m.commandInput) > 0 {
			m.commandInput = m.commandInput[:len(m.commandInput)-1]
		}
	default:
		if len(msg.String()) == 1 {
			m.commandInput += msg.String()
		}
	}
	return m, nil
}

// handleHelpMode handles input in help mode
func (m ModelV2) handleHelpMode(msg tea.KeyMsg) (tea.Model, tea.Cmd) {
	switch msg.String() {
	case "escape", "esc":
		m.mode = ModeTUI
	case "f1":
		m.helpPanel.ShowCurrentOpcodeHelp()
	case "f2":
		m.helpPanel.SetMode(HelpCommands)
	case "f3":
		m.helpPanel.SetMode(HelpKeyboard)
	}
	return m, nil
}

// View renders the complete enhanced application UI
func (m ModelV2) View() string {
	switch m.mode {
	case ModeCommand:
		return m.viewCommandMode()
	case ModeHelp:
		return m.viewHelpMode()
	default:
		return m.viewTUIMode()
	}
}

// viewTUIMode renders the main TUI interface
func (m ModelV2) viewTUIMode() string {
	// Update component active states
	m.bytecodePanel.SetActive(m.activePanel == PanelBytecodeV2)
	m.stackPanel.SetActive(m.activePanel == PanelStackV2)
	m.memoryPanel.SetActive(m.activePanel == PanelMemoryV2)
	m.solidityPanel.SetActive(m.activePanel == PanelSolidityV2)
	m.profilingPanel.SetActive(m.activePanel == PanelProfilingV2)
	
	// Render status bar
	statusBar := m.statusBar.Render()
	
	// Render main content panels based on layout
	leftPanel := m.bytecodePanel.View()
	
	// Determine which panels to show in right side
	var topRightPanel, bottomRightPanel string
	
	switch m.activePanel {
	case PanelStackV2:
		topRightPanel = m.stackPanel.View()
		bottomRightPanel = m.memoryPanel.View()
	case PanelMemoryV2:
		topRightPanel = m.stackPanel.View()
		bottomRightPanel = m.memoryPanel.View()
	case PanelSolidityV2:
		topRightPanel = m.solidityPanel.View()
		bottomRightPanel = m.memoryPanel.View()
	case PanelProfilingV2:
		topRightPanel = m.profilingPanel.View()
		bottomRightPanel = m.memoryPanel.View()
	default: // PanelBytecodeV2 or others
		topRightPanel = m.stackPanel.View()
		bottomRightPanel = m.solidityPanel.View()
	}
	
	rightPanels := lipgloss.JoinVertical(lipgloss.Left,
		topRightPanel,
		bottomRightPanel,
	)
	
	mainContent := lipgloss.JoinHorizontal(lipgloss.Top,
		leftPanel,
		rightPanels,
	)
	
	// Enhanced help bar with mode indicators
	helpBar := m.renderEnhancedHelpBar()
	
	// Combine all elements
	return lipgloss.JoinVertical(lipgloss.Left,
		statusBar,
		mainContent,
		helpBar,
	)
}

// viewCommandMode renders the command input interface
func (m ModelV2) viewCommandMode() string {
	// Command input area
	commandStyle := panelStyle.Copy().
		Foreground(ColorPrimary).
		Border(lipgloss.RoundedBorder()).
		BorderForeground(ColorPrimary)
	
	prompt := "Command: " + m.commandInput + "█"
	commandPanel := commandStyle.Render(prompt)
	
	// Command result area
	var resultPanel string
	if m.commandResult.Message != "" {
		var resultStyle lipgloss.Style
		if m.commandResult.Success {
			resultStyle = panelStyle.Copy().Foreground(ColorSuccess)
		} else {
			resultStyle = errorStyle
		}
		resultPanel = resultStyle.Render(m.commandResult.Message)
	}
	
	// Help text
	helpText := helpStyle.Render("Enter command (Esc to cancel, Enter to execute)")
	
	content := lipgloss.JoinVertical(lipgloss.Left,
		commandPanel,
		resultPanel,
		helpText,
	)
	
	return lipgloss.NewStyle().
		Width(m.layout.Width).
		Height(m.layout.Height).
		Align(lipgloss.Center, lipgloss.Center).
		Render(content)
}

// viewHelpMode renders the help interface
func (m ModelV2) viewHelpMode() string {
	// Full-screen help panel
	helpPanel := m.helpPanel.View()
	
	// Help navigation bar
	navBar := m.renderHelpNavBar()
	
	return lipgloss.JoinVertical(lipgloss.Left,
		navBar,
		helpPanel,
	)
}

// renderEnhancedHelpBar renders an enhanced help bar with context info
func (m ModelV2) renderEnhancedHelpBar() string {
	var shortcuts []string
	
	// Context-sensitive shortcuts
	switch m.activePanel {
	case PanelBytecodeV2:
		shortcuts = append(shortcuts, 
			keyStyle.Render("B")+helpStyle.Render(":Breakpoint"),
			keyStyle.Render("F1")+helpStyle.Render(":Opcode Help"),
		)
	case PanelStackV2:
		shortcuts = append(shortcuts,
			keyStyle.Render("V")+helpStyle.Render(":Preview"),
		)
	case PanelMemoryV2:
		shortcuts = append(shortcuts,
			keyStyle.Render("A")+helpStyle.Render(":ASCII"),
			keyStyle.Render("W")+helpStyle.Render(":Watches"),
		)
	case PanelSolidityV2:
		shortcuts = append(shortcuts,
			keyStyle.Render("L")+helpStyle.Render(":Line Jump"),
			keyStyle.Render("F")+helpStyle.Render(":Function"),
		)
	case PanelProfilingV2:
		shortcuts = append(shortcuts,
			keyStyle.Render("M")+helpStyle.Render(":Mode"),
		)
	}
	
	// Common shortcuts
	commonShortcuts := []string{
		keyStyle.Render("Space")+helpStyle.Render(":Step"),
		keyStyle.Render("R")+helpStyle.Render(":Run"),
		keyStyle.Render("X")+helpStyle.Render(":Reset"),
		keyStyle.Render(":")+helpStyle.Render(":Command"),
		keyStyle.Render("Tab")+helpStyle.Render(":Switch"),
		keyStyle.Render("Q")+helpStyle.Render(":Quit"),
	}
	
	allShortcuts := append(shortcuts, commonShortcuts...)
	helpText := strings.Join(allShortcuts, " │ ")
	
	// Add mode indicator
	var modeIndicator string
	switch m.mode {
	case ModeTUI:
		modeIndicator = statusRunningStyle.Render("TUI")
	case ModeCommand:
		modeIndicator = statusPausedStyle.Render("CMD")
	case ModeHelp:
		modeIndicator = statusStoppedStyle.Render("HELP")
	}
	
	fullText := modeIndicator + " │ " + helpText
	
	return helpStyle.Width(m.layout.Width).Align(lipgloss.Center).Render(fullText)
}

// renderHelpNavBar renders the help navigation bar
func (m ModelV2) renderHelpNavBar() string {
	navItems := []string{
		keyStyle.Render("F1")+helpStyle.Render(":Opcode"),
		keyStyle.Render("F2")+helpStyle.Render(":Commands"),
		keyStyle.Render("F3")+helpStyle.Render(":Keyboard"),
		keyStyle.Render("Esc")+helpStyle.Render(":Exit Help"),
	}
	
	navText := strings.Join(navItems, " │ ")
	
	return titleStyle.Width(m.layout.Width).Align(lipgloss.Center).Render("📚 Help System │ " + navText)
}

// Helper methods for application logic (same as before, but enhanced)

func (m *ModelV2) stepExecution() {
	if err := m.provider.Step(); err != nil {
		// Error occurred, execution will be paused
		m.autoRun = false
	}
	m.lastUpdate = time.Now()
}

func (m *ModelV2) toggleAutoRun() {
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

func (m *ModelV2) pauseExecution() {
	m.provider.Pause()
	m.autoRun = false
}

func (m *ModelV2) resetExecution() {
	m.provider.Reset()
	m.autoRun = false
}

func (m *ModelV2) nextPanel() {
	m.activePanel = (m.activePanel + 1) % 6
}

func (m *ModelV2) prevPanel() {
	m.activePanel = (m.activePanel + 5) % 6 // +5 mod 6 = -1 mod 6
}

func (m *ModelV2) toggleBreakpoint() {
	state := m.provider.GetState()
	if m.provider.IsBreakpoint(state.PC) {
		m.provider.ClearBreakpoint(state.PC)
	} else {
		m.provider.SetBreakpoint(state.PC)
	}
}

func (m *ModelV2) handlePanelNavigation(delta int) {
	// Forward navigation to the active panel
	// This is handled by the viewport components
}

func (m *ModelV2) updateComponentSizes() {
	// Recreate components with new sizes
	stackHeight := m.layout.Height / 2
	memoryHeight := m.layout.Height - stackHeight - 6
	
	m.bytecodePanel = NewBytecodePanel(m.provider, m.layout.LeftPanelWidth, m.layout.Height-6)
	m.stackPanel = NewStackDiffPanel(m.provider, m.layout.RightPanelWidth, stackHeight)
	m.memoryPanel = NewMemoryPanel(m.provider, m.layout.RightPanelWidth, memoryHeight)
	m.solidityPanel = NewSolidityPanel(m.provider, m.layout.RightPanelWidth, stackHeight)
	m.profilingPanel = NewProfilingPanel(m.provider, m.layout.RightPanelWidth, stackHeight)
	m.helpPanel = NewHelpPanel(m.provider, m.layout.Width-4, m.layout.Height-6)
	m.statusBar = NewStatusBar(m.provider, m.layout.Width)
	m.helpBar = NewHelpBar(m.layout.Width)
}

func (m *ModelV2) updateAllComponents() {
	// Trigger re-render of all components
	m.bytecodePanel.Render()
	m.stackPanel.Render()
	m.memoryPanel.Render()
	m.solidityPanel.Render()
	m.profilingPanel.Render()
	m.helpPanel.Render()
}


// NewModelV2WithProvider creates the enhanced application model with a specific provider
func NewModelV2WithProvider(provider DataProvider) ModelV2 {
	commandHandler := NewCommandHandler(provider)
	
	// Initial layout (will be updated on first WindowSizeMsg)
	layout := CalculateLayout(120, 30) // Larger default for all features
	
	stackHeight := layout.Height / 2
	memoryHeight := layout.Height - stackHeight - 6
	
	return ModelV2{
		provider:       provider,
		commandHandler: commandHandler,
		bytecodePanel:  NewBytecodePanel(provider, layout.LeftPanelWidth, layout.Height-6),
		stackPanel:     NewStackDiffPanel(provider, layout.RightPanelWidth, stackHeight),
		memoryPanel:    NewMemoryPanel(provider, layout.RightPanelWidth, memoryHeight),
		solidityPanel:  NewSolidityPanel(provider, layout.RightPanelWidth, stackHeight),
		profilingPanel: NewProfilingPanel(provider, layout.RightPanelWidth, stackHeight),
		helpPanel:      NewHelpPanel(provider, layout.Width-4, layout.Height-6),
		statusBar:      NewStatusBar(provider, layout.Width),
		helpBar:        NewHelpBar(layout.Width),
		mode:           ModeTUI,
		activePanel:    PanelBytecodeV2,
		autoRun:        false,
		runSpeed:       time.Millisecond * 500,
		lastUpdate:     time.Now(),
		showPreview:    true,
		layout:         layout,
	}
}

