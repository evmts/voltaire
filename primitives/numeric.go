package primitives

import (
	"errors"
	"math/big"
	"strings"
)

// Ethereum unit constants (all in wei)
var (
	Wei    = big.NewInt(1)
	Kwei   = big.NewInt(1_000)
	Mwei   = big.NewInt(1_000_000)
	Gwei   = big.NewInt(1_000_000_000)
	Szabo  = new(big.Int).Exp(big.NewInt(10), big.NewInt(12), nil) // 10^12
	Finney = new(big.Int).Exp(big.NewInt(10), big.NewInt(15), nil) // 10^15
	Ether  = new(big.Int).Exp(big.NewInt(10), big.NewInt(18), nil) // 10^18
)

// Numeric errors
var (
	ErrInvalidNumericInput  = errors.New("invalid numeric input")
	ErrInvalidUnit          = errors.New("invalid unit")
	ErrNumericValueTooLarge = errors.New("value too large")
	ErrDivisionByZero       = errors.New("division by zero")
)

// Unit represents Ethereum units
type Unit int

const (
	UnitWei Unit = iota
	UnitKwei
	UnitMwei
	UnitGwei
	UnitSzabo
	UnitFinney
	UnitEther
)

// String returns the string representation of the unit
func (u Unit) String() string {
	switch u {
	case UnitWei:
		return "wei"
	case UnitKwei:
		return "kwei"
	case UnitMwei:
		return "mwei"
	case UnitGwei:
		return "gwei"
	case UnitSzabo:
		return "szabo"
	case UnitFinney:
		return "finney"
	case UnitEther:
		return "ether"
	default:
		return "unknown"
	}
}

// Multiplier returns the wei multiplier for the unit
func (u Unit) Multiplier() *big.Int {
	switch u {
	case UnitWei:
		return new(big.Int).Set(Wei)
	case UnitKwei:
		return new(big.Int).Set(Kwei)
	case UnitMwei:
		return new(big.Int).Set(Mwei)
	case UnitGwei:
		return new(big.Int).Set(Gwei)
	case UnitSzabo:
		return new(big.Int).Set(Szabo)
	case UnitFinney:
		return new(big.Int).Set(Finney)
	case UnitEther:
		return new(big.Int).Set(Ether)
	default:
		return big.NewInt(1)
	}
}

// UnitFromString converts a string to a Unit
func UnitFromString(s string) (Unit, error) {
	switch strings.ToLower(s) {
	case "wei":
		return UnitWei, nil
	case "kwei":
		return UnitKwei, nil
	case "mwei":
		return UnitMwei, nil
	case "gwei":
		return UnitGwei, nil
	case "szabo":
		return UnitSzabo, nil
	case "finney":
		return UnitFinney, nil
	case "ether":
		return UnitEther, nil
	default:
		return 0, ErrInvalidUnit
	}
}

// ParseEther parses an ether string to wei
func ParseEther(etherStr string) (*big.Int, error) {
	return ParseUnits(etherStr, UnitEther)
}

// ParseGwei parses a gwei string to wei
func ParseGwei(gweiStr string) (*big.Int, error) {
	return ParseUnits(gweiStr, UnitGwei)
}

// ParseUnits parses a value string in the given unit to wei
func ParseUnits(valueStr string, unit Unit) (*big.Int, error) {
	trimmed := strings.TrimSpace(valueStr)
	if trimmed == "" {
		return nil, ErrInvalidNumericInput
	}

	// Handle decimal point
	dotPos := strings.Index(trimmed, ".")
	if dotPos == -1 {
		// No decimal point, parse as integer
		intValue, ok := new(big.Int).SetString(trimmed, 10)
		if !ok {
			return nil, ErrInvalidNumericInput
		}
		multiplier := unit.Multiplier()
		result := new(big.Int).Mul(intValue, multiplier)
		return result, nil
	}

	// Has decimal point
	integerPart := trimmed[0:dotPos]
	decimalPart := trimmed[dotPos+1:]

	// Parse integer part
	var intValue *big.Int
	if integerPart == "" || integerPart == "." {
		intValue = big.NewInt(0)
	} else {
		var ok bool
		intValue, ok = new(big.Int).SetString(integerPart, 10)
		if !ok {
			return nil, ErrInvalidNumericInput
		}
	}

	// Parse decimal part
	decValue, err := parseDecimal(decimalPart, unit)
	if err != nil {
		return nil, err
	}

	// Combine integer and decimal parts
	multiplier := unit.Multiplier()
	intWei := new(big.Int).Mul(intValue, multiplier)
	result := new(big.Int).Add(intWei, decValue)

	return result, nil
}

// parseDecimal parses the decimal part of a number
func parseDecimal(decimalStr string, unit Unit) (*big.Int, error) {
	if decimalStr == "" {
		return big.NewInt(0), nil
	}

	// Validate decimal characters
	for _, c := range decimalStr {
		if c < '0' || c > '9' {
			return nil, ErrInvalidNumericInput
		}
	}

	multiplier := unit.Multiplier()
	result := big.NewInt(0)
	placeValue := new(big.Int).Div(multiplier, big.NewInt(10))

	for i := 0; i < len(decimalStr); i++ {
		if placeValue.Sign() == 0 {
			break // No more precision available
		}

		digit := int64(decimalStr[i] - '0')
		digitValue := new(big.Int).Mul(big.NewInt(digit), placeValue)
		result.Add(result, digitValue)
		placeValue.Div(placeValue, big.NewInt(10))
	}

	return result, nil
}

// FormatEther formats wei to ether string
func FormatEther(weiValue *big.Int) string {
	return FormatUnits(weiValue, UnitEther, 18)
}

// FormatGwei formats wei to gwei string
func FormatGwei(weiValue *big.Int) string {
	return FormatUnits(weiValue, UnitGwei, 9)
}

// FormatUnits formats wei to the specified unit with given decimal places
func FormatUnits(weiValue *big.Int, unit Unit, maxDecimals int) string {
	if weiValue.Sign() == 0 {
		return "0"
	}

	multiplier := unit.Multiplier()

	// Calculate integer and fractional parts
	integerPart := new(big.Int).Div(weiValue, multiplier)
	remainder := new(big.Int).Mod(weiValue, multiplier)

	if remainder.Sign() == 0 {
		return integerPart.String()
	}

	// Format decimal part
	decimalStr := formatDecimalPart(remainder, multiplier, maxDecimals)
	if decimalStr == "" || decimalStr == "0" {
		return integerPart.String()
	}

	return integerPart.String() + "." + decimalStr
}

// formatDecimalPart formats the decimal portion of a value
func formatDecimalPart(remainder, multiplier *big.Int, maxDecimals int) string {
	if remainder.Sign() == 0 {
		return ""
	}

	var result strings.Builder
	currentRemainder := new(big.Int).Set(remainder)
	currentMultiplier := new(big.Int).Set(multiplier)
	decimalsAdded := 0

	for currentRemainder.Sign() > 0 && decimalsAdded < maxDecimals {
		currentMultiplier.Div(currentMultiplier, big.NewInt(10))
		if currentMultiplier.Sign() == 0 {
			break
		}

		digit := new(big.Int).Div(currentRemainder, currentMultiplier)
		result.WriteString(digit.String())
		currentRemainder.Mod(currentRemainder, currentMultiplier)
		decimalsAdded++
	}

	// Remove trailing zeros
	str := result.String()
	str = strings.TrimRight(str, "0")
	return str
}

// ConvertUnits converts a value from one unit to another
func ConvertUnits(value *big.Int, fromUnit, toUnit Unit) *big.Int {
	fromMultiplier := fromUnit.Multiplier()
	toMultiplier := toUnit.Multiplier()

	// Convert to wei first
	weiValue := new(big.Int).Mul(value, fromMultiplier)

	// Then convert to target unit
	result := new(big.Int).Div(weiValue, toMultiplier)
	return result
}

// CalculateGasCost calculates the gas cost in wei
func CalculateGasCost(gasUsed uint64, gasPriceGwei *big.Int) *big.Int {
	gasPriceWei := new(big.Int).Mul(gasPriceGwei, Gwei)
	gasUsedBig := new(big.Int).SetUint64(gasUsed)
	return new(big.Int).Mul(gasUsedBig, gasPriceWei)
}

// Safe math operations

// SafeAdd performs safe addition with overflow check
func SafeAdd(a, b *big.Int) (*big.Int, error) {
	result := new(big.Int).Add(a, b)
	// Check if result is less than either operand (overflow)
	if result.Cmp(a) < 0 || result.Cmp(b) < 0 {
		return nil, ErrNumericValueTooLarge
	}
	return result, nil
}

// SafeSub performs safe subtraction with underflow check
func SafeSub(a, b *big.Int) (*big.Int, error) {
	if a.Cmp(b) < 0 {
		return nil, errors.New("subtraction underflow")
	}
	return new(big.Int).Sub(a, b), nil
}

// SafeMul performs safe multiplication with overflow check
func SafeMul(a, b *big.Int) (*big.Int, error) {
	if a.Sign() == 0 || b.Sign() == 0 {
		return big.NewInt(0), nil
	}

	result := new(big.Int).Mul(a, b)
	// Check overflow by dividing result by one operand
	check := new(big.Int).Div(result, a)
	if check.Cmp(b) != 0 {
		return nil, ErrNumericValueTooLarge
	}

	return result, nil
}

// SafeDiv performs safe division with zero check
func SafeDiv(a, b *big.Int) (*big.Int, error) {
	if b.Sign() == 0 {
		return nil, ErrDivisionByZero
	}
	return new(big.Int).Div(a, b), nil
}

// Min returns the minimum of two big.Int values
func Min(a, b *big.Int) *big.Int {
	if a.Cmp(b) < 0 {
		return new(big.Int).Set(a)
	}
	return new(big.Int).Set(b)
}

// Max returns the maximum of two big.Int values
func Max(a, b *big.Int) *big.Int {
	if a.Cmp(b) > 0 {
		return new(big.Int).Set(a)
	}
	return new(big.Int).Set(b)
}

// CalculatePercentage calculates a percentage of a value
func CalculatePercentage(value *big.Int, percentage int64) *big.Int {
	percent := new(big.Int).Mul(value, big.NewInt(percentage))
	return new(big.Int).Div(percent, big.NewInt(100))
}
