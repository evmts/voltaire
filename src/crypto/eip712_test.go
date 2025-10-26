package crypto

import (
	"encoding/hex"
	"testing"
)

// TestHashDomainSimple tests hashing a simple domain separator
func TestHashDomainSimple(t *testing.T) {
	domain := TypedDataDomain{
		Name:              "Ether Mail",
		Version:           "1",
		ChainID:           1,
		VerifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
	}

	hash, err := HashDomain(domain)
	if err != nil {
		t.Fatalf("HashDomain failed: %v", err)
	}

	// Should produce a valid 32-byte hash
	if len(hash) != 32 {
		t.Errorf("Expected 32-byte hash, got %d bytes", len(hash))
	}

	// Should not be all zeros
	allZeros := true
	for _, b := range hash {
		if b != 0 {
			allZeros = false
			break
		}
	}
	if allZeros {
		t.Errorf("Hash should not be all zeros")
	}
}

// TestHashDomainConsistency tests that domain hashing is deterministic
func TestHashDomainConsistency(t *testing.T) {
	domain := TypedDataDomain{
		Name:    "Test App",
		Version: "1",
		ChainID: 1,
	}

	hash1, err := HashDomain(domain)
	if err != nil {
		t.Fatalf("HashDomain failed: %v", err)
	}

	hash2, err := HashDomain(domain)
	if err != nil {
		t.Fatalf("HashDomain failed: %v", err)
	}

	if hash1 != hash2 {
		t.Errorf("Domain hashes should be consistent")
	}
}

// TestHashDomainMinimal tests hashing a minimal domain
func TestHashDomainMinimal(t *testing.T) {
	domain := TypedDataDomain{
		Name: "MinimalDomain",
	}

	hash, err := HashDomain(domain)
	if err != nil {
		t.Fatalf("HashDomain failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataSimple tests hashing simple typed data
func TestHashTypedDataSimple(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Person": {
				{Name: "name", Type: "string"},
				{Name: "wallet", Type: "address"},
			},
		},
		PrimaryType: "Person",
		Domain: TypedDataDomain{
			Name:    "Ether Mail",
			Version: "1",
			ChainID: 1,
		},
		Message: map[string]interface{}{
			"name":   "Bob",
			"wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	// Should produce a valid 32-byte hash
	if len(hash) != 32 {
		t.Errorf("Expected 32-byte hash, got %d bytes", len(hash))
	}

	// Should not be all zeros
	allZeros := true
	for _, b := range hash {
		if b != 0 {
			allZeros = false
			break
		}
	}
	if allZeros {
		t.Errorf("Hash should not be all zeros")
	}
}

// TestHashTypedDataConsistency tests deterministic hashing
func TestHashTypedDataConsistency(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Message": {
				{Name: "content", Type: "string"},
			},
		},
		PrimaryType: "Message",
		Domain: TypedDataDomain{
			Name:    "Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"content": "Hello, EIP-712!",
		},
	}

	hash1, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	hash2, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	if hash1 != hash2 {
		t.Errorf("Typed data hashes should be consistent")
	}
}

// TestHashTypedDataNested tests hashing nested structures
func TestHashTypedDataNested(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Person": {
				{Name: "name", Type: "string"},
				{Name: "wallet", Type: "address"},
			},
			"Mail": {
				{Name: "from", Type: "Person"},
				{Name: "to", Type: "Person"},
				{Name: "contents", Type: "string"},
			},
		},
		PrimaryType: "Mail",
		Domain: TypedDataDomain{
			Name:    "Ether Mail",
			Version: "1",
			ChainID: 1,
		},
		Message: map[string]interface{}{
			"from": map[string]interface{}{
				"name":   "Alice",
				"wallet": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			},
			"to": map[string]interface{}{
				"name":   "Bob",
				"wallet": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			},
			"contents": "Hello, Bob!",
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataDifferentTypes tests various data types
func TestHashTypedDataDifferentTypes(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Transaction": {
				{Name: "to", Type: "address"},
				{Name: "value", Type: "uint256"},
				{Name: "gas", Type: "uint256"},
				{Name: "nonce", Type: "uint256"},
				{Name: "data", Type: "bytes"},
			},
		},
		PrimaryType: "Transaction",
		Domain: TypedDataDomain{
			Name:    "MyDApp",
			Version: "1",
			ChainID: 1,
		},
		Message: map[string]interface{}{
			"to":    "0x1111111111111111111111111111111111111111",
			"value": "1000000000000000000",
			"gas":   "21000",
			"nonce": "0",
			"data":  "0x",
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataBoolAndNumber tests boolean and number types
func TestHashTypedDataBoolAndNumber(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Settings": {
				{Name: "enabled", Type: "bool"},
				{Name: "count", Type: "uint256"},
			},
		},
		PrimaryType: "Settings",
		Domain: TypedDataDomain{
			Name:    "Settings",
			Version: "1",
		},
		Message: map[string]interface{}{
			"enabled": true,
			"count":   42,
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataArrays tests array handling
func TestHashTypedDataArrays(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Numbers": {
				{Name: "values", Type: "uint256[]"},
			},
		},
		PrimaryType: "Numbers",
		Domain: TypedDataDomain{
			Name:    "Arrays",
			Version: "1",
		},
		Message: map[string]interface{}{
			"values": []interface{}{1, 2, 3, 4, 5},
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataEIP712Example tests the EIP-712 specification example
func TestHashTypedDataEIP712Example(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Person": {
				{Name: "name", Type: "string"},
				{Name: "wallet", Type: "address"},
			},
			"Mail": {
				{Name: "from", Type: "Person"},
				{Name: "to", Type: "Person"},
				{Name: "contents", Type: "string"},
			},
		},
		PrimaryType: "Mail",
		Domain: TypedDataDomain{
			Name:              "Ether Mail",
			Version:           "1",
			ChainID:           1,
			VerifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
		},
		Message: map[string]interface{}{
			"from": map[string]interface{}{
				"name":   "Cow",
				"wallet": "0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
			},
			"to": map[string]interface{}{
				"name":   "Bob",
				"wallet": "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
			},
			"contents": "Hello, Bob!",
		},
	}

	hash1, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	hash2, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	if hash1 != hash2 {
		t.Errorf("EIP-712 example should produce consistent hashes")
	}
}

// TestHashTypedDataDeepNesting tests multiple levels of nesting
func TestHashTypedDataDeepNesting(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Address": {
				{Name: "street", Type: "string"},
				{Name: "city", Type: "string"},
			},
			"Person": {
				{Name: "name", Type: "string"},
				{Name: "home", Type: "Address"},
			},
			"Mail": {
				{Name: "sender", Type: "Person"},
				{Name: "message", Type: "string"},
			},
		},
		PrimaryType: "Mail",
		Domain: TypedDataDomain{
			Name:    "Nested Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"sender": map[string]interface{}{
				"name": "Alice",
				"home": map[string]interface{}{
					"street": "123 Main St",
					"city":   "New York",
				},
			},
			"message": "Deep nesting test",
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataDifferentMessages tests that different messages produce different hashes
func TestHashTypedDataDifferentMessages(t *testing.T) {
	domain := TypedDataDomain{
		Name:    "Test",
		Version: "1",
	}

	typedData1 := TypedData{
		Types: map[string][]TypedDataField{
			"Message": {
				{Name: "text", Type: "string"},
			},
		},
		PrimaryType: "Message",
		Domain:      domain,
		Message: map[string]interface{}{
			"text": "Message 1",
		},
	}

	typedData2 := TypedData{
		Types: map[string][]TypedDataField{
			"Message": {
				{Name: "text", Type: "string"},
			},
		},
		PrimaryType: "Message",
		Domain:      domain,
		Message: map[string]interface{}{
			"text": "Message 2",
		},
	}

	hash1, err := HashTypedData(typedData1)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	hash2, err := HashTypedData(typedData2)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	if hash1 == hash2 {
		t.Errorf("Different messages should produce different hashes")
	}
}

// TestHashTypedDataBytes32 tests bytes32 type
func TestHashTypedDataBytes32(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Data": {
				{Name: "hash", Type: "bytes32"},
			},
		},
		PrimaryType: "Data",
		Domain: TypedDataDomain{
			Name:    "Bytes Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"hash": "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataEmptyString tests handling empty strings
func TestHashTypedDataEmptyString(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Message": {
				{Name: "text", Type: "string"},
			},
		},
		PrimaryType: "Message",
		Domain: TypedDataDomain{
			Name:    "Empty Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"text": "",
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataZeroValue tests handling zero values
func TestHashTypedDataZeroValue(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Numbers": {
				{Name: "value", Type: "uint256"},
			},
		},
		PrimaryType: "Numbers",
		Domain: TypedDataDomain{
			Name:    "Zero Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"value": 0,
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// TestHashTypedDataFalseBool tests handling false boolean
func TestHashTypedDataFalseBool(t *testing.T) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Flag": {
				{Name: "enabled", Type: "bool"},
			},
		},
		PrimaryType: "Flag",
		Domain: TypedDataDomain{
			Name:    "Bool Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"enabled": false,
		},
	}

	hash, err := HashTypedData(typedData)
	if err != nil {
		t.Fatalf("HashTypedData failed: %v", err)
	}

	resultHex := hex.EncodeToString(hash[:])
	if len(resultHex) != 64 {
		t.Errorf("Expected 64 hex characters, got %d", len(resultHex))
	}
}

// BenchmarkHashTypedDataSimple benchmarks simple typed data hashing
func BenchmarkHashTypedDataSimple(b *testing.B) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Message": {
				{Name: "content", Type: "string"},
			},
		},
		PrimaryType: "Message",
		Domain: TypedDataDomain{
			Name:    "Test",
			Version: "1",
		},
		Message: map[string]interface{}{
			"content": "Hello, EIP-712!",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = HashTypedData(typedData)
	}
}

// BenchmarkHashTypedDataNested benchmarks nested structure hashing
func BenchmarkHashTypedDataNested(b *testing.B) {
	typedData := TypedData{
		Types: map[string][]TypedDataField{
			"Person": {
				{Name: "name", Type: "string"},
				{Name: "wallet", Type: "address"},
			},
			"Mail": {
				{Name: "from", Type: "Person"},
				{Name: "to", Type: "Person"},
				{Name: "contents", Type: "string"},
			},
		},
		PrimaryType: "Mail",
		Domain: TypedDataDomain{
			Name:    "Ether Mail",
			Version: "1",
			ChainID: 1,
		},
		Message: map[string]interface{}{
			"from": map[string]interface{}{
				"name":   "Alice",
				"wallet": "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
			},
			"to": map[string]interface{}{
				"name":   "Bob",
				"wallet": "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
			},
			"contents": "Hello, Bob!",
		},
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = HashTypedData(typedData)
	}
}
