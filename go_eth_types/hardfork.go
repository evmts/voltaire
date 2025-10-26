// Ethereum Hardfork Management
//
// This module provides hardfork identifiers and version comparison utilities
// for Ethereum protocol upgrades. Each hardfork represents a protocol upgrade
// that changes EVM behavior, gas costs, or adds new features.
//
// Hardfork Timeline:
// - FRONTIER (July 2015): Original Ethereum launch
// - HOMESTEAD (March 2016): Added DELEGATECALL
// - DAO (July 2016): Emergency fork for DAO hack
// - TANGERINE_WHISTLE (October 2016): Gas repricing (EIP-150)
// - SPURIOUS_DRAGON (November 2016): State cleaning (EIP-161)
// - BYZANTIUM (October 2017): Added REVERT, STATICCALL
// - CONSTANTINOPLE (February 2019): Added CREATE2, shift opcodes
// - PETERSBURG (February 2019): Quick fix fork
// - ISTANBUL (December 2019): Added CHAINID, SELFBALANCE
// - MUIR_GLACIER (January 2020): Difficulty bomb delay
// - BERLIN (April 2021): Access list fork (EIP-2929)
// - LONDON (August 2021): Fee market reform (EIP-1559)
// - ARROW_GLACIER (December 2021): Difficulty bomb delay
// - GRAY_GLACIER (June 2022): Difficulty bomb delay
// - MERGE (September 2022): Proof of Stake transition
// - SHANGHAI (April 2023): Added PUSH0 opcode
// - CANCUN (March 2024): Proto-danksharding with blobs
// - PRAGUE (May 2025): BLS12-381 precompiles, EIP-7702
// - OSAKA (TBD): ModExp improvements

package primitives

import (
	"fmt"
	"strings"
)

// Hardfork represents Ethereum protocol upgrades
type Hardfork int

const (
	FRONTIER Hardfork = iota
	HOMESTEAD
	DAO
	TANGERINE_WHISTLE
	SPURIOUS_DRAGON
	BYZANTIUM
	CONSTANTINOPLE
	PETERSBURG
	ISTANBUL
	MUIR_GLACIER
	BERLIN
	LONDON
	ARROW_GLACIER
	GRAY_GLACIER
	MERGE
	SHANGHAI
	CANCUN
	PRAGUE
	OSAKA
)

// DEFAULT is the default hardfork for new chains
const DEFAULT = PRAGUE

// String returns the name of the hardfork
func (h Hardfork) String() string {
	switch h {
	case FRONTIER:
		return "FRONTIER"
	case HOMESTEAD:
		return "HOMESTEAD"
	case DAO:
		return "DAO"
	case TANGERINE_WHISTLE:
		return "TANGERINE_WHISTLE"
	case SPURIOUS_DRAGON:
		return "SPURIOUS_DRAGON"
	case BYZANTIUM:
		return "BYZANTIUM"
	case CONSTANTINOPLE:
		return "CONSTANTINOPLE"
	case PETERSBURG:
		return "PETERSBURG"
	case ISTANBUL:
		return "ISTANBUL"
	case MUIR_GLACIER:
		return "MUIR_GLACIER"
	case BERLIN:
		return "BERLIN"
	case LONDON:
		return "LONDON"
	case ARROW_GLACIER:
		return "ARROW_GLACIER"
	case GRAY_GLACIER:
		return "GRAY_GLACIER"
	case MERGE:
		return "MERGE"
	case SHANGHAI:
		return "SHANGHAI"
	case CANCUN:
		return "CANCUN"
	case PRAGUE:
		return "PRAGUE"
	case OSAKA:
		return "OSAKA"
	default:
		return fmt.Sprintf("UNKNOWN(%d)", h)
	}
}

// ToInt returns the numeric representation for version comparisons
func (h Hardfork) ToInt() int {
	return int(h)
}

// IsAtLeast checks if this hardfork is at least the specified version
func (h Hardfork) IsAtLeast(target Hardfork) bool {
	return h.ToInt() >= target.ToInt()
}

// IsBefore checks if this hardfork is before the specified version
func (h Hardfork) IsBefore(target Hardfork) bool {
	return h.ToInt() < target.ToInt()
}

// FromString parses hardfork from string name (case-insensitive)
// Supports both standard names and common variations
func FromString(name string) (Hardfork, error) {
	// Handle comparisons like ">=Cancun" or ">Berlin"
	cleanName := name
	if len(name) > 0 && (name[0] == '>' || name[0] == '<') {
		start := 1
		if len(name) > 1 && name[1] == '=' {
			start = 2
		}
		cleanName = name[start:]
	}

	// Case-insensitive comparison
	upper := strings.ToUpper(cleanName)

	switch upper {
	case "FRONTIER":
		return FRONTIER, nil
	case "HOMESTEAD":
		return HOMESTEAD, nil
	case "DAO":
		return DAO, nil
	case "TANGERINEWHISTLE", "TANGERINE_WHISTLE":
		return TANGERINE_WHISTLE, nil
	case "SPURIOUSDRAGON", "SPURIOUS_DRAGON":
		return SPURIOUS_DRAGON, nil
	case "BYZANTIUM":
		return BYZANTIUM, nil
	case "CONSTANTINOPLE":
		return CONSTANTINOPLE, nil
	case "PETERSBURG", "CONSTANTINOPLEFIX":
		return PETERSBURG, nil
	case "ISTANBUL":
		return ISTANBUL, nil
	case "MUIRGLACIER", "MUIR_GLACIER":
		return MUIR_GLACIER, nil
	case "BERLIN":
		return BERLIN, nil
	case "LONDON":
		return LONDON, nil
	case "ARROWGLACIER", "ARROW_GLACIER":
		return ARROW_GLACIER, nil
	case "GRAYGLACIER", "GRAY_GLACIER":
		return GRAY_GLACIER, nil
	case "MERGE", "PARIS":
		return MERGE, nil
	case "SHANGHAI":
		return SHANGHAI, nil
	case "CANCUN":
		return CANCUN, nil
	case "PRAGUE":
		return PRAGUE, nil
	case "OSAKA":
		return OSAKA, nil
	default:
		return 0, fmt.Errorf("unknown hardfork: %s", name)
	}
}

// ForkTransition represents a fork transition (e.g., ShanghaiToCancunAtTime15k)
type ForkTransition struct {
	FromFork    Hardfork
	ToFork      Hardfork
	AtBlock     *uint64
	AtTimestamp *uint64
}

// GetActiveFork returns the active fork at the given block number and timestamp
func (ft *ForkTransition) GetActiveFork(blockNumber uint64, timestamp uint64) Hardfork {
	if ft.AtBlock != nil {
		if blockNumber >= *ft.AtBlock {
			return ft.ToFork
		}
		return ft.FromFork
	}

	if ft.AtTimestamp != nil {
		if timestamp >= *ft.AtTimestamp {
			return ft.ToFork
		}
		return ft.FromFork
	}

	return ft.ToFork
}

// ParseForkTransition parses a transition fork name like "ShanghaiToCancunAtTime15k"
func ParseForkTransition(name string) (*ForkTransition, error) {
	// Find "To" pattern
	toIndex := strings.Index(name, "To")
	if toIndex == -1 {
		return nil, fmt.Errorf("invalid fork transition format: missing 'To'")
	}

	// Extract "from" fork
	fromStr := name[:toIndex]
	fromFork, err := FromString(fromStr)
	if err != nil {
		return nil, fmt.Errorf("invalid from fork: %w", err)
	}

	// Find "At" pattern
	remaining := name[toIndex:]
	atIndex := strings.Index(remaining, "At")
	if atIndex == -1 {
		return nil, fmt.Errorf("invalid fork transition format: missing 'At'")
	}

	// Extract "to" fork
	toStr := remaining[2:atIndex]
	toFork, err := FromString(toStr)
	if err != nil {
		return nil, fmt.Errorf("invalid to fork: %w", err)
	}

	// Parse the transition point
	transitionStr := remaining[atIndex+2:]

	// Check if it's a timestamp (contains "Time") or block number
	if strings.Contains(transitionStr, "Time") {
		timeIndex := strings.Index(transitionStr, "Time")
		numStr := transitionStr[timeIndex+4:]
		timestamp, err := parseNumber(numStr)
		if err != nil {
			return nil, fmt.Errorf("invalid timestamp: %w", err)
		}
		return &ForkTransition{
			FromFork:    fromFork,
			ToFork:      toFork,
			AtTimestamp: &timestamp,
		}, nil
	}

	// It's a block number
	block, err := parseNumber(transitionStr)
	if err != nil {
		return nil, fmt.Errorf("invalid block number: %w", err)
	}
	return &ForkTransition{
		FromFork: fromFork,
		ToFork:   toFork,
		AtBlock:  &block,
	}, nil
}

// parseNumber parses a number from a string like "15k" or "5"
func parseNumber(str string) (uint64, error) {
	if len(str) == 0 {
		return 0, fmt.Errorf("empty string")
	}

	// Check for 'k' suffix (multiply by 1000)
	if str[len(str)-1] == 'k' {
		numStr := str[:len(str)-1]
		var base uint64
		_, err := fmt.Sscanf(numStr, "%d", &base)
		if err != nil {
			return 0, fmt.Errorf("invalid format: %w", err)
		}
		return base * 1000, nil
	}

	var num uint64
	_, err := fmt.Sscanf(str, "%d", &num)
	if err != nil {
		return 0, fmt.Errorf("invalid format: %w", err)
	}
	return num, nil
}
