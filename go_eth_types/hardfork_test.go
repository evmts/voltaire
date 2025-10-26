package primitives

import (
	"testing"
)

func TestHardforkVersionComparison(t *testing.T) {
	frontier := FRONTIER
	homestead := HOMESTEAD
	cancun := CANCUN

	if !frontier.IsBefore(homestead) {
		t.Error("FRONTIER should be before HOMESTEAD")
	}

	if !homestead.IsAtLeast(frontier) {
		t.Error("HOMESTEAD should be at least FRONTIER")
	}

	if !cancun.IsAtLeast(homestead) {
		t.Error("CANCUN should be at least HOMESTEAD")
	}

	if cancun.IsBefore(homestead) {
		t.Error("CANCUN should not be before HOMESTEAD")
	}
}

func TestHardforkFromString(t *testing.T) {
	tests := []struct {
		input    string
		expected Hardfork
		wantErr  bool
	}{
		{"Frontier", FRONTIER, false},
		{"cancun", CANCUN, false},
		{"Shanghai", SHANGHAI, false},
		{"Paris", MERGE, false},                      // Alias
		{"ConstantinopleFix", PETERSBURG, false},     // Alias
		{">=Cancun", CANCUN, false},                  // With comparison operator
		{">Berlin", BERLIN, false},                   // With comparison operator
		{"InvalidFork", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := FromString(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error for input %s, got nil", tt.input)
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error for input %s: %v", tt.input, err)
				return
			}
			if result != tt.expected {
				t.Errorf("FromString(%s) = %v, want %v", tt.input, result, tt.expected)
			}
		})
	}
}

func TestHardforkString(t *testing.T) {
	tests := []struct {
		fork     Hardfork
		expected string
	}{
		{FRONTIER, "FRONTIER"},
		{HOMESTEAD, "HOMESTEAD"},
		{CANCUN, "CANCUN"},
		{PRAGUE, "PRAGUE"},
		{OSAKA, "OSAKA"},
	}

	for _, tt := range tests {
		t.Run(tt.expected, func(t *testing.T) {
			result := tt.fork.String()
			if result != tt.expected {
				t.Errorf("%v.String() = %s, want %s", tt.fork, result, tt.expected)
			}
		})
	}
}

func TestForkTransitionFromStringWithBlock(t *testing.T) {
	transition, err := ParseForkTransition("BerlinToLondonAt12965000")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if transition.FromFork != BERLIN {
		t.Errorf("FromFork = %v, want BERLIN", transition.FromFork)
	}

	if transition.ToFork != LONDON {
		t.Errorf("ToFork = %v, want LONDON", transition.ToFork)
	}

	if transition.AtBlock == nil {
		t.Fatal("AtBlock should not be nil")
	}

	if *transition.AtBlock != 12965000 {
		t.Errorf("AtBlock = %d, want 12965000", *transition.AtBlock)
	}

	if transition.AtTimestamp != nil {
		t.Error("AtTimestamp should be nil")
	}
}

func TestForkTransitionFromStringWithTimestamp(t *testing.T) {
	transition, err := ParseForkTransition("ShanghaiToCancunAtTime15k")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if transition.FromFork != SHANGHAI {
		t.Errorf("FromFork = %v, want SHANGHAI", transition.FromFork)
	}

	if transition.ToFork != CANCUN {
		t.Errorf("ToFork = %v, want CANCUN", transition.ToFork)
	}

	if transition.AtTimestamp == nil {
		t.Fatal("AtTimestamp should not be nil")
	}

	if *transition.AtTimestamp != 15000 {
		t.Errorf("AtTimestamp = %d, want 15000", *transition.AtTimestamp)
	}

	if transition.AtBlock != nil {
		t.Error("AtBlock should be nil")
	}
}

func TestForkTransitionGetActiveForkByBlock(t *testing.T) {
	block := uint64(12965000)
	transition := &ForkTransition{
		FromFork: BERLIN,
		ToFork:   LONDON,
		AtBlock:  &block,
	}

	tests := []struct {
		blockNum uint64
		expected Hardfork
	}{
		{12964999, BERLIN},
		{12965000, LONDON},
		{12965001, LONDON},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := transition.GetActiveFork(tt.blockNum, 0)
			if result != tt.expected {
				t.Errorf("GetActiveFork(%d, 0) = %v, want %v", tt.blockNum, result, tt.expected)
			}
		})
	}
}

func TestForkTransitionGetActiveForkByTimestamp(t *testing.T) {
	timestamp := uint64(15000)
	transition := &ForkTransition{
		FromFork:    SHANGHAI,
		ToFork:      CANCUN,
		AtTimestamp: &timestamp,
	}

	tests := []struct {
		ts       uint64
		expected Hardfork
	}{
		{14999, SHANGHAI},
		{15000, CANCUN},
		{15001, CANCUN},
	}

	for _, tt := range tests {
		t.Run("", func(t *testing.T) {
			result := transition.GetActiveFork(0, tt.ts)
			if result != tt.expected {
				t.Errorf("GetActiveFork(0, %d) = %v, want %v", tt.ts, result, tt.expected)
			}
		})
	}
}

func TestParseNumber(t *testing.T) {
	tests := []struct {
		input    string
		expected uint64
		wantErr  bool
	}{
		{"42", 42, false},
		{"15k", 15000, false},
		{"1k", 1000, false},
		{"", 0, true},
		{"invalid", 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.input, func(t *testing.T) {
			result, err := parseNumber(tt.input)
			if tt.wantErr {
				if err == nil {
					t.Errorf("expected error for input %s, got nil", tt.input)
				}
				return
			}
			if err != nil {
				t.Errorf("unexpected error for input %s: %v", tt.input, err)
				return
			}
			if result != tt.expected {
				t.Errorf("parseNumber(%s) = %d, want %d", tt.input, result, tt.expected)
			}
		})
	}
}

func TestHardforkDefault(t *testing.T) {
	if DEFAULT != PRAGUE {
		t.Errorf("DEFAULT = %v, want PRAGUE", DEFAULT)
	}
}

func TestAllHardforksExist(t *testing.T) {
	forks := []Hardfork{
		FRONTIER, HOMESTEAD, DAO, TANGERINE_WHISTLE, SPURIOUS_DRAGON,
		BYZANTIUM, CONSTANTINOPLE, PETERSBURG, ISTANBUL, MUIR_GLACIER,
		BERLIN, LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE,
		SHANGHAI, CANCUN, PRAGUE, OSAKA,
	}

	expectedOrder := []int{0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18}

	for i, fork := range forks {
		if fork.ToInt() != expectedOrder[i] {
			t.Errorf("fork %v has ToInt() = %d, want %d", fork, fork.ToInt(), expectedOrder[i])
		}
	}
}

func TestHardforkOrdering(t *testing.T) {
	orderedForks := []Hardfork{
		FRONTIER, HOMESTEAD, DAO, TANGERINE_WHISTLE, SPURIOUS_DRAGON,
		BYZANTIUM, CONSTANTINOPLE, PETERSBURG, ISTANBUL, MUIR_GLACIER,
		BERLIN, LONDON, ARROW_GLACIER, GRAY_GLACIER, MERGE,
		SHANGHAI, CANCUN, PRAGUE, OSAKA,
	}

	for i := 0; i < len(orderedForks)-1; i++ {
		current := orderedForks[i]
		next := orderedForks[i+1]

		if !current.IsBefore(next) {
			t.Errorf("%v should be before %v", current, next)
		}

		if !next.IsAtLeast(current) {
			t.Errorf("%v should be at least %v", next, current)
		}
	}
}

func TestIsAtLeastSameHardfork(t *testing.T) {
	forks := []Hardfork{FRONTIER, HOMESTEAD, CANCUN, PRAGUE, OSAKA}

	for _, fork := range forks {
		if !fork.IsAtLeast(fork) {
			t.Errorf("%v should be at least itself", fork)
		}
	}
}

func TestIsBeforeSameHardfork(t *testing.T) {
	forks := []Hardfork{FRONTIER, HOMESTEAD, CANCUN, PRAGUE, OSAKA}

	for _, fork := range forks {
		if fork.IsBefore(fork) {
			t.Errorf("%v should not be before itself", fork)
		}
	}
}

func TestFromStringCaseInsensitivity(t *testing.T) {
	tests := []struct {
		inputs   []string
		expected Hardfork
	}{
		{[]string{"frontier", "FRONTIER", "FrOnTiEr"}, FRONTIER},
		{[]string{"cancun", "CANCUN", "CaNcUn"}, CANCUN},
		{[]string{"prague", "PRAGUE", "PrAgUe"}, PRAGUE},
	}

	for _, tt := range tests {
		for _, input := range tt.inputs {
			t.Run(input, func(t *testing.T) {
				result, err := FromString(input)
				if err != nil {
					t.Errorf("unexpected error for input %s: %v", input, err)
					return
				}
				if result != tt.expected {
					t.Errorf("FromString(%s) = %v, want %v", input, result, tt.expected)
				}
			})
		}
	}
}

func TestFromStringAllHardforks(t *testing.T) {
	tests := []struct {
		name     string
		expected Hardfork
	}{
		{"Frontier", FRONTIER},
		{"Homestead", HOMESTEAD},
		{"DAO", DAO},
		{"TangerineWhistle", TANGERINE_WHISTLE},
		{"SpuriousDragon", SPURIOUS_DRAGON},
		{"Byzantium", BYZANTIUM},
		{"Constantinople", CONSTANTINOPLE},
		{"Petersburg", PETERSBURG},
		{"Istanbul", ISTANBUL},
		{"MuirGlacier", MUIR_GLACIER},
		{"Berlin", BERLIN},
		{"London", LONDON},
		{"ArrowGlacier", ARROW_GLACIER},
		{"GrayGlacier", GRAY_GLACIER},
		{"Merge", MERGE},
		{"Shanghai", SHANGHAI},
		{"Cancun", CANCUN},
		{"Prague", PRAGUE},
		{"Osaka", OSAKA},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := FromString(tt.name)
			if err != nil {
				t.Errorf("unexpected error for %s: %v", tt.name, err)
				return
			}
			if result != tt.expected {
				t.Errorf("FromString(%s) = %v, want %v", tt.name, result, tt.expected)
			}
		})
	}
}
