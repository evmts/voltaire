package primitives

import (
	"testing"
)

func TestLogCreation(t *testing.T) {
	address := [20]byte{0x01, 0x02, 0x03}
	topic1 := [32]byte{0x04, 0x05, 0x06}
	topic2 := [32]byte{0x07, 0x08, 0x09}
	topics := [][32]byte{topic1, topic2}
	data := []byte{0x0a, 0x0b, 0x0c}

	log := NewLog(address, topics, data)

	if log.Address != address {
		t.Errorf("Address mismatch")
	}

	if len(log.Topics) != 2 {
		t.Errorf("Expected 2 topics, got %d", len(log.Topics))
	}

	if log.Topics[0] != topic1 {
		t.Errorf("Topic 0 mismatch")
	}

	if log.Topics[1] != topic2 {
		t.Errorf("Topic 1 mismatch")
	}

	if len(log.Data) != 3 {
		t.Errorf("Expected data length 3, got %d", len(log.Data))
	}

	if log.Removed {
		t.Error("Removed should be false by default")
	}
}

func TestLogMatchesTopics(t *testing.T) {
	topic1 := [32]byte{0x01}
	topic2 := [32]byte{0x02}
	topic3 := [32]byte{0x03}

	log := NewLog([20]byte{}, [][32]byte{topic1, topic2, topic3}, []byte{})

	tests := []struct {
		name     string
		filter   [][32]byte
		expected bool
	}{
		{"exact match", [][32]byte{topic1, topic2, topic3}, true},
		{"prefix match", [][32]byte{topic1, topic2}, true},
		{"single match", [][32]byte{topic1}, true},
		{"wildcard", [][32]byte{[32]byte{}}, true},
		{"mismatch", [][32]byte{topic2}, false},
		{"too long", [][32]byte{topic1, topic2, topic3, [32]byte{0x04}}, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := log.MatchesTopics(tt.filter)
			if result != tt.expected {
				t.Errorf("MatchesTopics() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestLogMatchesAddress(t *testing.T) {
	addr1 := [20]byte{0x01}
	addr2 := [20]byte{0x02}
	addr3 := [20]byte{0x03}

	log := NewLog(addr1, [][32]byte{}, []byte{})

	tests := []struct {
		name      string
		addresses [][20]byte
		expected  bool
	}{
		{"exact match", [][20]byte{addr1}, true},
		{"multiple with match", [][20]byte{addr2, addr1, addr3}, true},
		{"no match", [][20]byte{addr2, addr3}, false},
		{"empty matches all", [][20]byte{}, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := log.MatchesAddress(tt.addresses)
			if result != tt.expected {
				t.Errorf("MatchesAddress() = %v, want %v", result, tt.expected)
			}
		})
	}
}

func TestBloomFilter(t *testing.T) {
	bloom := NewBloom()

	data1 := []byte("test data 1")
	data2 := []byte("test data 2")
	data3 := []byte("not added")

	bloom.Add(data1)
	bloom.Add(data2)

	if !bloom.Test(data1) {
		t.Error("Bloom filter should contain data1")
	}

	if !bloom.Test(data2) {
		t.Error("Bloom filter should contain data2")
	}

	// This might be a false positive due to bloom filter nature
	// but we test it anyway
	if bloom.Test(data3) {
		// Note: This is a probabilistic test - it might rarely pass
		t.Log("Warning: Bloom filter has false positive (expected occasionally)")
	}
}

func TestCreateLogBloom(t *testing.T) {
	addr1 := [20]byte{0x01}
	topic1 := [32]byte{0x02}
	topic2 := [32]byte{0x03}

	log1 := NewLog(addr1, [][32]byte{topic1}, []byte{})
	log2 := NewLog(addr1, [][32]byte{topic2}, []byte{})

	logs := []*Log{log1, log2}
	bloom := CreateLogBloom(logs)

	// Test that address is in bloom
	if !bloom.Test(addr1[:]) {
		t.Error("Bloom should contain address")
	}

	// Test that topics are in bloom
	if !bloom.Test(topic1[:]) {
		t.Error("Bloom should contain topic1")
	}

	if !bloom.Test(topic2[:]) {
		t.Error("Bloom should contain topic2")
	}
}

func TestFilterLogs(t *testing.T) {
	addr1 := [20]byte{0x01}
	addr2 := [20]byte{0x02}
	topic1 := [32]byte{0x03}
	topic2 := [32]byte{0x04}

	log1 := NewLog(addr1, [][32]byte{topic1}, []byte{})
	log2 := NewLog(addr2, [][32]byte{topic2}, []byte{})
	log3 := NewLog(addr1, [][32]byte{topic2}, []byte{})

	logs := []*Log{log1, log2, log3}

	tests := []struct {
		name      string
		addresses [][20]byte
		topics    [][32]byte
		expected  int
	}{
		{"all logs", [][20]byte{}, [][32]byte{}, 3},
		{"filter by address", [][20]byte{addr1}, [][32]byte{}, 2},
		{"filter by topic", [][20]byte{}, [][32]byte{topic1}, 1},
		{"filter by both", [][20]byte{addr1}, [][32]byte{topic2}, 1},
		{"no match", [][20]byte{[20]byte{0xff}}, [][32]byte{}, 0},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			filtered := FilterLogs(logs, tt.addresses, tt.topics)
			if len(filtered) != tt.expected {
				t.Errorf("FilterLogs() returned %d logs, want %d", len(filtered), tt.expected)
			}
		})
	}
}

func TestParseEventLog(t *testing.T) {
	topic0 := [32]byte{0x00} // Event signature
	topic1 := [32]byte{0x01} // Indexed parameter
	topic2 := [32]byte{0x02} // Indexed parameter

	log := NewLog(
		[20]byte{0x03},
		[][32]byte{topic0, topic1, topic2},
		[]byte{0x04, 0x05},
	)

	signature := EventSignature{
		Name: "Transfer",
		Inputs: []EventInput{
			{Name: "from", Type: "address", Indexed: true},
			{Name: "to", Type: "address", Indexed: true},
			{Name: "value", Type: "uint256", Indexed: false},
		},
	}

	decoded, err := ParseEventLog(log, signature)
	if err != nil {
		t.Fatalf("ParseEventLog() error: %v", err)
	}

	if decoded.EventName != "Transfer" {
		t.Errorf("EventName = %s, want Transfer", decoded.EventName)
	}

	if _, ok := decoded.Args["from"]; !ok {
		t.Error("Args should contain 'from'")
	}

	if _, ok := decoded.Args["to"]; !ok {
		t.Error("Args should contain 'to'")
	}

	if _, ok := decoded.Args["_data"]; !ok {
		t.Error("Args should contain '_data' for non-indexed parameters")
	}
}

func TestLogString(t *testing.T) {
	log := NewLog(
		[20]byte{0x01, 0x02},
		[][32]byte{{0x03, 0x04}},
		[]byte{0x05, 0x06},
	)

	str := log.String()
	if len(str) == 0 {
		t.Error("String() should return non-empty string")
	}

	// Check that it contains expected fields
	if !contains(str, "Address") {
		t.Error("String() should contain 'Address'")
	}

	if !contains(str, "Topics") {
		t.Error("String() should contain 'Topics'")
	}

	if !contains(str, "Data") {
		t.Error("String() should contain 'Data'")
	}
}

func TestBloomString(t *testing.T) {
	bloom := NewBloom()
	bloom.Add([]byte("test"))

	str := bloom.String()
	if len(str) != 2+256*2 { // "0x" + 256 bytes * 2 hex chars
		t.Errorf("Bloom.String() length = %d, want %d", len(str), 2+256*2)
	}

	if str[:2] != "0x" {
		t.Error("Bloom.String() should start with '0x'")
	}
}

func TestCreateEventSignatureHash(t *testing.T) {
	signature := "Transfer(address,address,uint256)"
	hash, err := CreateEventSignatureHash(signature)
	if err != nil {
		t.Fatalf("CreateEventSignatureHash() error: %v", err)
	}

	if hash == [32]byte{} {
		t.Error("CreateEventSignatureHash() should return non-zero hash")
	}

	// Test determinism
	hash2, err := CreateEventSignatureHash(signature)
	if err != nil {
		t.Fatalf("CreateEventSignatureHash() error: %v", err)
	}

	if hash != hash2 {
		t.Error("CreateEventSignatureHash() should be deterministic")
	}
}

func TestLogWithOptionalFields(t *testing.T) {
	log := NewLog([20]byte{}, [][32]byte{}, []byte{})

	blockNum := uint64(12345)
	log.BlockNumber = &blockNum

	txHash := [32]byte{0x01}
	log.TxHash = &txHash

	txIndex := uint(5)
	log.TxIndex = &txIndex

	if *log.BlockNumber != 12345 {
		t.Errorf("BlockNumber = %d, want 12345", *log.BlockNumber)
	}

	if *log.TxHash != txHash {
		t.Error("TxHash mismatch")
	}

	if *log.TxIndex != 5 {
		t.Errorf("TxIndex = %d, want 5", *log.TxIndex)
	}
}

func TestLogWithMaxTopics(t *testing.T) {
	// Ethereum allows up to 4 topics (topic[0] is event signature, topics[1-3] are indexed params)
	topics := [][32]byte{
		{0x01},
		{0x02},
		{0x03},
		{0x04},
	}

	log := NewLog([20]byte{}, topics, []byte{})

	if len(log.Topics) != 4 {
		t.Errorf("Expected 4 topics, got %d", len(log.Topics))
	}
}

func TestEmptyBloom(t *testing.T) {
	bloom := NewBloom()

	// Empty bloom should not contain any data
	testData := []byte("anything")
	if bloom.Test(testData) {
		t.Error("Empty bloom should not contain any data")
	}
}

// Helper function
func contains(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr || len(s) > len(substr) && containsHelper(s, substr))
}

func containsHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
