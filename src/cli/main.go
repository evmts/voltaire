package main

import (
	"fmt"
	"os"

	tea "github.com/charmbracelet/bubbletea"
)

// Model represents the state of our application
type model struct {
	message string
	cursor  int
	choices []string
}

// Init is called when the program starts
func (m model) Init() tea.Cmd {
	return nil
}

// Update handles incoming messages and updates the model
func (m model) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "q":
			return m, tea.Quit
		case "up", "k":
			if m.cursor > 0 {
				m.cursor--
			}
		case "down", "j":
			if m.cursor < len(m.choices)-1 {
				m.cursor++
			}
		case "enter", " ":
			m.message = fmt.Sprintf("You selected: %s", m.choices[m.cursor])
		}
	}
	return m, nil
}

// View renders the UI
func (m model) View() string {
	s := "🔍 EVM Debugger - Hello World\n\n"
	s += m.message + "\n\n"

	// Render menu choices
	for i, choice := range m.choices {
		cursor := " " // no cursor
		if m.cursor == i {
			cursor = ">" // cursor!
		}
		s += fmt.Sprintf("%s %s\n", cursor, choice)
	}

	s += "\nPress q to quit.\n"
	s += "Use ↑/↓ or j/k to navigate, Enter/Space to select.\n"

	return s
}

func main() {
	// Initialize the model
	m := model{
		message: "Welcome to the EVM Debugger! Select an option:",
		choices: []string{
			"Load Bytecode",
			"Start Debugging Session",
			"View Stack",
			"View Memory",
			"Step Forward",
			"Run to Breakpoint",
		},
	}

	// Start the Bubble Tea program
	p := tea.NewProgram(m)
	if _, err := p.Run(); err != nil {
		fmt.Printf("Error: %v", err)
		os.Exit(1)
	}
}