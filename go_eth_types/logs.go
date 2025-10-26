// Ethereum event log structures and utilities
//
// This module provides structures for Ethereum event logs and utilities
// for log matching, filtering, and bloom filter generation.

package primitives

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"strings"
)

// Log represents an Ethereum event log
type Log struct {
	Address     [20]byte   // Contract address that emitted the log
	Topics      [][32]byte // Indexed event parameters (up to 4 topics)
	Data        []byte     // Non-indexed event data
	BlockNumber *uint64    // Block number (nil if pending)
	TxHash      *[32]byte  // Transaction hash (nil if pending)
	TxIndex     *uint     // Transaction index in block (nil if pending)
	BlockHash   *[32]byte  // Block hash (nil if pending)
	LogIndex    *uint     // Log index in block (nil if pending)
	Removed     bool       // True if log was removed due to chain reorg
}

// NewLog creates a new log with required fields
func NewLog(address [20]byte, topics [][32]byte, data []byte) *Log {
	return &Log{
		Address: address,
		Topics:  topics,
		Data:    data,
		Removed: false,
	}
}

// String returns a human-readable representation of the log
func (l *Log) String() string {
	var sb strings.Builder
	sb.WriteString("Log{\n")
	sb.WriteString(fmt.Sprintf("  Address: 0x%x\n", l.Address))
	sb.WriteString(fmt.Sprintf("  Topics: [%d]\n", len(l.Topics)))
	for i, topic := range l.Topics {
		sb.WriteString(fmt.Sprintf("    [%d]: 0x%x\n", i, topic))
	}
	sb.WriteString(fmt.Sprintf("  Data: 0x%x\n", l.Data))
	if l.BlockNumber != nil {
		sb.WriteString(fmt.Sprintf("  BlockNumber: %d\n", *l.BlockNumber))
	}
	if l.TxHash != nil {
		sb.WriteString(fmt.Sprintf("  TxHash: 0x%x\n", *l.TxHash))
	}
	sb.WriteString("}")
	return sb.String()
}

// MatchesTopics checks if the log matches the given topic filter
// nil in the filter matches any topic at that position
func (l *Log) MatchesTopics(filter [][32]byte) bool {
	if len(filter) > len(l.Topics) {
		return false
	}

	for i, filterTopic := range filter {
		// Check if this is a wildcard (all zeros means wildcard)
		isWildcard := true
		for _, b := range filterTopic {
			if b != 0 {
				isWildcard = false
				break
			}
		}

		if !isWildcard && filterTopic != l.Topics[i] {
			return false
		}
	}

	return true
}

// MatchesAddress checks if the log was emitted by any of the given addresses
// Empty slice matches all addresses
func (l *Log) MatchesAddress(addresses [][20]byte) bool {
	if len(addresses) == 0 {
		return true
	}

	for _, addr := range addresses {
		if addr == l.Address {
			return true
		}
	}

	return false
}

// Bloom represents a 2048-bit bloom filter for logs
type Bloom [256]byte

// NewBloom creates a new empty bloom filter
func NewBloom() *Bloom {
	return &Bloom{}
}

// Add adds data to the bloom filter
func (b *Bloom) Add(data []byte) {
	hash := sha256.Sum256(data)

	// Use first 6 bytes for three 11-bit indices
	for i := 0; i < 3; i++ {
		// Extract 11-bit index
		idx := uint16(hash[i*2])<<8 | uint16(hash[i*2+1])
		idx = idx & 0x7ff // 11 bits

		// Set bit
		byteIdx := idx / 8
		bitIdx := idx % 8
		b[byteIdx] |= 1 << bitIdx
	}
}

// Test checks if data might be in the bloom filter
func (b *Bloom) Test(data []byte) bool {
	hash := sha256.Sum256(data)

	for i := 0; i < 3; i++ {
		idx := uint16(hash[i*2])<<8 | uint16(hash[i*2+1])
		idx = idx & 0x7ff

		byteIdx := idx / 8
		bitIdx := idx % 8
		if b[byteIdx]&(1<<bitIdx) == 0 {
			return false
		}
	}

	return true
}

// CreateLogBloom creates a bloom filter for a slice of logs
func CreateLogBloom(logs []*Log) *Bloom {
	bloom := NewBloom()

	for _, log := range logs {
		// Add address to bloom
		bloom.Add(log.Address[:])

		// Add all topics to bloom
		for _, topic := range log.Topics {
			bloom.Add(topic[:])
		}
	}

	return bloom
}

// String returns the hex representation of the bloom filter
func (b *Bloom) String() string {
	return "0x" + hex.EncodeToString(b[:])
}

// FilterLogs filters logs based on address and topic criteria
func FilterLogs(logs []*Log, addresses [][20]byte, topics [][32]byte) []*Log {
	filtered := make([]*Log, 0)

	for _, log := range logs {
		if !log.MatchesAddress(addresses) {
			continue
		}

		if len(topics) > 0 && !log.MatchesTopics(topics) {
			continue
		}

		filtered = append(filtered, log)
	}

	return filtered
}

// EventSignature represents the signature of an event
type EventSignature struct {
	Name   string
	Inputs []EventInput
}

// EventInput represents an event parameter
type EventInput struct {
	Name    string
	Type    string
	Indexed bool
}

// DecodedLog represents a decoded event log with parameter names
type DecodedLog struct {
	EventName string
	Args      map[string]interface{}
	Address   [20]byte
}

// ParseEventLog attempts to decode a log with a given event signature
// This is a simplified implementation - full implementation would require ABI decoding
func ParseEventLog(log *Log, signature EventSignature) (*DecodedLog, error) {
	decoded := &DecodedLog{
		EventName: signature.Name,
		Args:      make(map[string]interface{}),
		Address:   log.Address,
	}

	topicIndex := 1 // Skip topic[0] which is the event signature

	for _, input := range signature.Inputs {
		if input.Indexed {
			if topicIndex >= len(log.Topics) {
				return nil, fmt.Errorf("not enough topics for indexed parameter %s", input.Name)
			}
			// Store as hex string for simplicity
			decoded.Args[input.Name] = fmt.Sprintf("0x%x", log.Topics[topicIndex])
			topicIndex++
		}
	}

	// For non-indexed parameters, store data as hex
	// Full implementation would decode based on types
	hasNonIndexed := false
	for _, input := range signature.Inputs {
		if !input.Indexed {
			hasNonIndexed = true
			break
		}
	}

	if hasNonIndexed {
		decoded.Args["_data"] = fmt.Sprintf("0x%x", log.Data)
	}

	return decoded, nil
}

// CreateEventSignatureHash creates the keccak256 hash of an event signature
// This is a placeholder - real implementation would use keccak256
func CreateEventSignatureHash(signature string) ([32]byte, error) {
	// For now, use SHA256 as a placeholder
	// Real implementation would use keccak256
	hash := sha256.Sum256([]byte(signature))
	return hash, nil
}
