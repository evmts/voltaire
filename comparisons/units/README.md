# Unit Conversion Benchmarks

This directory contains comprehensive benchmarks comparing unit conversion implementations across guil, ethers, and viem.

## Overview

Unit conversion is a fundamental operation in Ethereum development, used to convert between:
- **Wei**: The smallest unit (1 ETH = 10^18 wei)
- **Gwei**: Gas price unit (1 Gwei = 10^9 wei)
- **Ether**: Human-readable ETH amounts
- **Custom Units**: Arbitrary decimal precision for tokens (USDC=6, BTC=8, etc.)

## Functions Benchmarked

### formatEther

Converts wei (smallest ETH unit) to human-readable ether strings with 18 decimal precision.

**Test Coverage:**
- Standard values (1 ETH, 1.5 ETH, 50 Gwei)
- Edge cases (smallest unit, very large values)
- Various decimal precision (6, 8, 18 decimals)
- Complex decimal values with many places

**Implementation Files:**
- guil: `./comparisons/units/formatEther-guil.ts`
- ethers: `./comparisons/units/formatEther-ethers.ts`
- viem: `./comparisons/units/formatEther-viem.ts`

### parseEther

Converts human-readable ether strings to wei (bigint) with 18 decimal precision.

**Test Coverage:**
- Standard values (1 ETH, 1.5 ETH, 50 Gwei)
- Edge cases (smallest unit, very large values)
- Various decimal precision (6, 8, 18 decimals)
- Complex decimal values with many places

**Implementation Files:**
- guil: `./comparisons/units/parseEther-guil.ts`
- ethers: `./comparisons/units/parseEther-ethers.ts`
- viem: `./comparisons/units/parseEther-viem.ts`

### formatGwei

Converts wei to gwei strings (9 decimal precision). Commonly used for gas prices.

**Test Coverage:**
- Standard values (1 ETH, 1.5 ETH, 50 Gwei)
- Edge cases (smallest unit, very large values)
- Various decimal precision (6, 8, 18 decimals)
- Complex decimal values with many places

**Implementation Files:**
- guil: `./comparisons/units/formatGwei-guil.ts`
- ethers: `./comparisons/units/formatGwei-ethers.ts`
- viem: `./comparisons/units/formatGwei-viem.ts`

### parseGwei

Converts gwei strings to wei (bigint) with 9 decimal precision. Commonly used for gas prices.

**Test Coverage:**
- Standard values (1 ETH, 1.5 ETH, 50 Gwei)
- Edge cases (smallest unit, very large values)
- Various decimal precision (6, 8, 18 decimals)
- Complex decimal values with many places

**Implementation Files:**
- guil: `./comparisons/units/parseGwei-guil.ts`
- ethers: `./comparisons/units/parseGwei-ethers.ts`
- viem: `./comparisons/units/parseGwei-viem.ts`

### formatUnits

Generic unit converter from wei to human-readable string with arbitrary decimal precision. Supports various token standards (USDC=6, BTC=8, ETH=18).

**Test Coverage:**
- Standard values (1 ETH, 1.5 ETH, 50 Gwei)
- Edge cases (smallest unit, very large values)
- Various decimal precision (6, 8, 18 decimals)
- Complex decimal values with many places

**Implementation Files:**
- guil: `./comparisons/units/formatUnits-guil.ts`
- ethers: `./comparisons/units/formatUnits-ethers.ts`
- viem: `./comparisons/units/formatUnits-viem.ts`

### parseUnits

Generic unit converter from human-readable string to wei (bigint) with arbitrary decimal precision. Supports various token standards (USDC=6, BTC=8, ETH=18).

**Test Coverage:**
- Standard values (1 ETH, 1.5 ETH, 50 Gwei)
- Edge cases (smallest unit, very large values)
- Various decimal precision (6, 8, 18 decimals)
- Complex decimal values with many places

**Implementation Files:**
- guil: `./comparisons/units/parseUnits-guil.ts`
- ethers: `./comparisons/units/parseUnits-ethers.ts`
- viem: `./comparisons/units/parseUnits-viem.ts`

## Examples

### formatEther
```typescript
// Convert wei to ether
formatEther(1000000000000000000n)  // "1"
formatEther(1500000000000000000n)  // "1.5"
formatEther(1n)                     // "0.000000000000000001"
```

### parseEther
```typescript
// Convert ether to wei
parseEther("1")    // 1000000000000000000n
parseEther("1.5")  // 1500000000000000000n
parseEther("0.000000000000000001")  // 1n
```

### formatGwei
```typescript
// Convert wei to gwei (useful for gas prices)
formatGwei(1000000000n)   // "1"
formatGwei(50000000000n)  // "50"
formatGwei(1n)            // "0.000000001"
```

### parseGwei
```typescript
// Convert gwei to wei
parseGwei("1")   // 1000000000n
parseGwei("50")  // 50000000000n
parseGwei("0.000000001")  // 1n
```

### formatUnits
```typescript
// Generic conversion with custom decimals
formatUnits(1000000n, 6)     // "1" (USDC - 6 decimals)
formatUnits(100000000n, 8)   // "1" (BTC - 8 decimals)
formatUnits(1000000000000000000n, 18)  // "1" (ETH - 18 decimals)
```

### parseUnits
```typescript
// Generic conversion with custom decimals
parseUnits("1", 6)   // 1000000n (USDC)
parseUnits("1", 8)   // 100000000n (BTC)
parseUnits("1", 18)  // 1000000000000000000n (ETH)
```

## Performance Considerations

Unit conversion performance matters because:
1. **Frequency**: Called on every transaction display, gas calculation, and balance query
2. **UX Impact**: Directly affects UI responsiveness when displaying balances
3. **Scale**: Applications may convert thousands of values when displaying transaction lists or token balances
4. **Precision**: Must handle edge cases without losing accuracy

### Test Data Characteristics

Each benchmark tests with:
- **Standard values**: Common amounts (1 ETH, 50 Gwei)
- **Edge cases**: Smallest possible values (1 wei), very large amounts
- **Decimal precision**: Various decimal places to test string parsing efficiency
- **Multiple decimal standards**: 6 (USDC), 8 (BTC), 9 (Gwei), 18 (ETH)

## Implementation Notes

### guil
- Direct imports from `src/primitives/units/`
- Optimized TypeScript implementation
- formatGwei and parseGwei are dedicated functions

### ethers
- Uses `formatEther`, `parseEther`, `formatUnits`, `parseUnits`
- formatGwei/parseGwei implemented via formatUnits/parseUnits with 9 decimals
- Mature, battle-tested implementation

### viem
- Modern implementation with full suite of unit functions
- Dedicated formatGwei and parseGwei functions
- Optimized for tree-shaking and bundle size

## Running Benchmarks

```bash
# Run all unit benchmarks
npm run bench:units

# Generate documentation
npm run docs:units
```

## Related Documentation

- [Ethereum Units Overview](https://ethereum.org/en/developers/docs/intro-to-ether/)
- [EIP-20 Token Standard](https://eips.ethereum.org/EIPS/eip-20) (decimals specification)
