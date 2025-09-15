package commands

import (
	"fmt"

	"guillotine-cli/internal/app"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/urfave/cli/v2"
)

// RunTUI launches the interactive TUI
func RunTUI(c *cli.Context) error {
	p := tea.NewProgram(app.InitialModel())
	if _, err := p.Run(); err != nil {
		return fmt.Errorf("error running Guillotine CLI: %w", err)
	}
	return nil
}