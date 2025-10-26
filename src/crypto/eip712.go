package crypto

import (
	"encoding/hex"
	"fmt"
	"math/big"
	"sort"
	"strings"
)

// TypedDataDomain represents the EIP-712 domain separator parameters
type TypedDataDomain struct {
	Name              string `json:"name,omitempty"`
	Version           string `json:"version,omitempty"`
	ChainID           uint64 `json:"chainId,omitempty"`
	VerifyingContract string `json:"verifyingContract,omitempty"`
	Salt              string `json:"salt,omitempty"`
}

// TypedDataField represents a field in a struct type
type TypedDataField struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

// TypedData represents the complete EIP-712 typed data structure
type TypedData struct {
	Types       map[string][]TypedDataField `json:"types"`
	PrimaryType string                      `json:"primaryType"`
	Domain      TypedDataDomain             `json:"domain"`
	Message     map[string]interface{}      `json:"message"`
}

// encodeType generates the type encoding string for EIP-712
// Example: "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
func encodeType(primaryType string, types map[string][]TypedDataField) string {
	// Find all referenced types (dependencies)
	deps := make(map[string]bool)
	var findDeps func(string)
	findDeps = func(typeName string) {
		if deps[typeName] || types[typeName] == nil {
			return
		}
		deps[typeName] = true
		for _, field := range types[typeName] {
			// Remove array suffix to get base type
			baseType := strings.TrimSuffix(field.Type, "[]")
			if types[baseType] != nil {
				findDeps(baseType)
			}
		}
	}

	findDeps(primaryType)
	delete(deps, primaryType)

	// Sort dependencies alphabetically
	depList := []string{primaryType}
	for dep := range deps {
		depList = append(depList, dep)
	}
	sort.Strings(depList[1:]) // Keep primary type first, sort rest

	// Build type string
	var result strings.Builder
	for _, typeName := range depList {
		result.WriteString(typeName)
		result.WriteString("(")
		fields := types[typeName]
		for i, field := range fields {
			if i > 0 {
				result.WriteString(",")
			}
			result.WriteString(field.Type)
			result.WriteString(" ")
			result.WriteString(field.Name)
		}
		result.WriteString(")")
	}

	return result.String()
}

// hashType computes the Keccak-256 hash of the type encoding
func hashType(primaryType string, types map[string][]TypedDataField) [32]byte {
	typeStr := encodeType(primaryType, types)
	return Keccak256([]byte(typeStr))
}

// encodeValue encodes a single value according to EIP-712 rules
func encodeValue(fieldType string, value interface{}, types map[string][]TypedDataField) ([]byte, error) {
	// Handle arrays
	if strings.HasSuffix(fieldType, "[]") {
		baseType := strings.TrimSuffix(fieldType, "[]")
		arr, ok := value.([]interface{})
		if !ok {
			return nil, fmt.Errorf("expected array for type %s", fieldType)
		}

		var encoded []byte
		for _, item := range arr {
			itemEncoded, err := encodeValue(baseType, item, types)
			if err != nil {
				return nil, err
			}
			encoded = append(encoded, itemEncoded...)
		}
		hash := Keccak256(encoded)
		return hash[:], nil
	}

	// Handle basic types
	switch fieldType {
	case "string":
		str, ok := value.(string)
		if !ok {
			return nil, fmt.Errorf("expected string for type string")
		}
		hash := Keccak256([]byte(str))
		return hash[:], nil

	case "bytes":
		// Value should be hex string
		str, ok := value.(string)
		if !ok {
			return nil, fmt.Errorf("expected hex string for type bytes")
		}
		bytes, err := hexToBytes(str)
		if err != nil {
			return nil, err
		}
		hash := Keccak256(bytes)
		return hash[:], nil

	case "bytes32":
		str, ok := value.(string)
		if !ok {
			return nil, fmt.Errorf("expected hex string for type bytes32")
		}
		bytes, err := hexToBytes(str)
		if err != nil {
			return nil, err
		}
		if len(bytes) != 32 {
			return nil, fmt.Errorf("bytes32 must be exactly 32 bytes")
		}
		return bytes, nil

	case "address":
		str, ok := value.(string)
		if !ok {
			return nil, fmt.Errorf("expected hex string for type address")
		}
		bytes, err := hexToBytes(str)
		if err != nil {
			return nil, err
		}
		if len(bytes) != 20 {
			return nil, fmt.Errorf("address must be exactly 20 bytes")
		}
		// Pad to 32 bytes
		padded := make([]byte, 32)
		copy(padded[12:], bytes)
		return padded, nil

	case "bool":
		b, ok := value.(bool)
		if !ok {
			return nil, fmt.Errorf("expected bool for type bool")
		}
		result := make([]byte, 32)
		if b {
			result[31] = 1
		}
		return result, nil
	}

	// Handle uintN and intN
	if strings.HasPrefix(fieldType, "uint") || strings.HasPrefix(fieldType, "int") {
		// Convert to big.Int
		var num *big.Int
		switch v := value.(type) {
		case int:
			num = big.NewInt(int64(v))
		case int64:
			num = big.NewInt(v)
		case uint64:
			num = new(big.Int).SetUint64(v)
		case float64:
			num = big.NewInt(int64(v))
		case string:
			num = new(big.Int)
			num.SetString(v, 10)
		default:
			return nil, fmt.Errorf("unsupported number type for %s", fieldType)
		}

		// Encode as 32-byte big-endian
		bytes := num.Bytes()
		result := make([]byte, 32)
		copy(result[32-len(bytes):], bytes)
		return result, nil
	}

	// Handle custom types (structs)
	if types[fieldType] != nil {
		structData, ok := value.(map[string]interface{})
		if !ok {
			return nil, fmt.Errorf("expected object for type %s", fieldType)
		}
		hash, err := hashStruct(fieldType, structData, types)
		if err != nil {
			return nil, err
		}
		return hash[:], nil
	}

	return nil, fmt.Errorf("unsupported type: %s", fieldType)
}

// hashStruct computes the hash of a struct according to EIP-712
func hashStruct(primaryType string, data map[string]interface{}, types map[string][]TypedDataField) ([32]byte, error) {
	// Get type hash
	typeHash := hashType(primaryType, types)

	// Encode each field value
	var encoded []byte
	encoded = append(encoded, typeHash[:]...)

	for _, field := range types[primaryType] {
		value, ok := data[field.Name]
		if !ok {
			return [32]byte{}, fmt.Errorf("missing field %s in data", field.Name)
		}

		encodedValue, err := encodeValue(field.Type, value, types)
		if err != nil {
			return [32]byte{}, err
		}
		encoded = append(encoded, encodedValue...)
	}

	return Keccak256(encoded), nil
}

// HashDomain calculates the domain separator hash according to EIP-712
func HashDomain(domain TypedDataDomain) ([32]byte, error) {
	types := make(map[string][]TypedDataField)
	types["EIP712Domain"] = []TypedDataField{}

	domainData := make(map[string]interface{})

	if domain.Name != "" {
		types["EIP712Domain"] = append(types["EIP712Domain"], TypedDataField{Name: "name", Type: "string"})
		domainData["name"] = domain.Name
	}
	if domain.Version != "" {
		types["EIP712Domain"] = append(types["EIP712Domain"], TypedDataField{Name: "version", Type: "string"})
		domainData["version"] = domain.Version
	}
	if domain.ChainID != 0 {
		types["EIP712Domain"] = append(types["EIP712Domain"], TypedDataField{Name: "chainId", Type: "uint256"})
		domainData["chainId"] = domain.ChainID
	}
	if domain.VerifyingContract != "" {
		types["EIP712Domain"] = append(types["EIP712Domain"], TypedDataField{Name: "verifyingContract", Type: "address"})
		domainData["verifyingContract"] = domain.VerifyingContract
	}
	if domain.Salt != "" {
		types["EIP712Domain"] = append(types["EIP712Domain"], TypedDataField{Name: "salt", Type: "bytes32"})
		domainData["salt"] = domain.Salt
	}

	return hashStruct("EIP712Domain", domainData, types)
}

// HashTypedData hashes typed data according to EIP-712
// Format: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
func HashTypedData(typedData TypedData) ([32]byte, error) {
	domainSeparator, err := HashDomain(typedData.Domain)
	if err != nil {
		return [32]byte{}, err
	}

	structHash, err := hashStruct(typedData.PrimaryType, typedData.Message, typedData.Types)
	if err != nil {
		return [32]byte{}, err
	}

	// Concatenate: "\x19\x01" || domainSeparator || structHash
	var encoded []byte
	encoded = append(encoded, 0x19, 0x01)
	encoded = append(encoded, domainSeparator[:]...)
	encoded = append(encoded, structHash[:]...)

	return Keccak256(encoded), nil
}

// HashTypedDataHex is a convenience function that returns the hex-encoded hash
func HashTypedDataHex(typedData TypedData) (string, error) {
	hash, err := HashTypedData(typedData)
	if err != nil {
		return "", err
	}
	return HashToHex(hash), nil
}

// hexToBytes converts a hex string to bytes, handling 0x prefix
func hexToBytes(hexStr string) ([]byte, error) {
	hexStr = strings.TrimPrefix(hexStr, "0x")
	return hex.DecodeString(hexStr)
}
