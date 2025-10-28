# Numeric Utilities

Unit conversion and safe arithmetic operations for Ethereum values.

## Overview

The numeric module provides utilities for working with Ethereum denominations (wei, gwei, ether) and safe arithmetic operations. All operations work with `bigint` to handle the full uint256 range without precision loss.

## Units

Ethereum uses wei as the base unit (10^-18 ether):

| Unit | Wei | Common Use |
|------|-----|------------|
| wei | 1 | Smallest unit, precise amounts |
| kwei (babbage) | 10^3 | Rarely used |
| mwei (lovelace) | 10^6 | Rarely used |
| gwei (shannon) | 10^9 | Gas prices |
| szabo | 10^12 | Historical, rarely used |
| finney | 10^15 | Historical, rarely used |
| ether | 10^18 | User-facing amounts |

## API

### Parsing (String → Wei)

```typescript
import { parseEther, parseGwei, parseUnits } from '@tevm/primitives';

// Parse ether to wei
const oneEth = parseEther('1.0');  // 1000000000000000000n
const halfEth = parseEther('0.5');  // 500000000000000000n

// Parse gwei to wei (for gas prices)
const gasPrice = parseGwei('20');  // 20000000000n
const highGas = parseGwei('100.5');  // 100500000000n

// Parse custom units
const usdcAmount = parseUnits('100.50', 6);  // 100500000n (USDC has 6 decimals)
const daiAmount = parseUnits('1000', 18);  // 1000000000000000000000n (DAI has 18)
```

### Formatting (Wei → String)

```typescript
import { formatEther, formatGwei, formatUnits } from '@tevm/primitives';

// Format wei to ether string
const ethStr = formatEther(1500000000000000000n);  // "1.5"
const small = formatEther(1n);  // "0.000000000000000001"

// Format wei to gwei (for gas prices)
const gasPriceStr = formatGwei(20000000000n);  // "20.0"
const gasStr = formatGwei(100500000000n);  // "100.5"

// Format custom units
const usdcStr = formatUnits(100500000n, 6);  // "100.5" (USDC)
const tokenStr = formatUnits(5000000n, 6);  // "5.0"

// Control decimal places
const precise = formatEther(1500000000000000000n, 8);  // "1.50000000"
const rounded = formatEther(1500000000000000000n, 2);  // "1.50"
```

### Direct Conversion

```typescript
import { gweiToWei, weiToGwei, etherToWei, weiToEther } from '@tevm/primitives';

// Gwei conversions
const wei1 = gweiToWei(20n);  // 20000000000n
const gwei1 = weiToGwei(20000000000n);  // 20n

// Ether conversions
const wei2 = etherToWei(1n);  // 1000000000000000000n
const eth1 = weiToEther(1000000000000000000n);  // 1n

// Chain conversions
const gasInWei = gweiToWei(parseGwei('50'));  // Parse string, then convert
```

### Unit Conversion

```typescript
import { convertUnits } from '@tevm/primitives';

// Convert between any units
const gweiAmount = 100n;

// Gwei to ether
const inEther = convertUnits(gweiAmount, 'gwei', 'ether');
// Returns: 100000000n (0.0000001 ether in wei)

// Wei to gwei
const value = 50000000000n;  // wei
const inGwei = convertUnits(value, 'wei', 'gwei');
// Returns: 50n gwei
```

### Safe Arithmetic

Safe math operations that check for overflow/underflow:

```typescript
import { safeAdd, safeSub, safeMul, safeDiv } from '@tevm/primitives';

// Safe addition (checks overflow)
const sum = safeAdd(2n ** 255n, 2n ** 255n);  // Throws if > 2^256-1

// Safe subtraction (checks underflow)
const diff = safeSub(100n, 50n);  // 50n
const neg = safeSub(50n, 100n);  // Throws - would be negative

// Safe multiplication (checks overflow)
const product = safeMul(2n ** 128n, 2n);  // OK
const overflow = safeMul(2n ** 255n, 3n);  // Throws

// Safe division (checks division by zero)
const quotient = safeDiv(100n, 5n);  // 20n
const error = safeDiv(100n, 0n);  // Throws
```

### Gas Cost Calculation

```typescript
import { calculateGasCost, formatGasCost } from '@tevm/primitives';

// Calculate total gas cost
const gasUsed = 21000n;  // Basic transfer
const gasPrice = parseGwei('50');  // 50 gwei

const costInWei = calculateGasCost(gasUsed, gasPrice);
// Returns: 1050000000000000n (0.00105 ETH)

// Format gas cost for display
const formatted = formatGasCost(gasUsed, gasPrice);
// Returns: { ether: "0.00105", gwei: "1050000", wei: "1050000000000000" }

// Example: Complex transaction
const complexGas = 500000n;
const urgentGasPrice = parseGwei('100');
const cost = formatGasCost(complexGas, urgentGasPrice);
// { ether: "0.05", gwei: "50000000", wei: "50000000000000000" }
```

### Min/Max Operations

```typescript
import { min, max } from '@tevm/primitives';

// Find minimum
const minimum = min(100n, 50n, 75n);  // 50n
const singleMin = min(42n);  // 42n

// Find maximum
const maximum = max(100n, 50n, 75n);  // 100n
const singleMax = max(42n);  // 42n

// Use with gas prices
const gasOptions = [parseGwei('20'), parseGwei('50'), parseGwei('100')];
const minGas = min(...gasOptions);  // Choose cheapest
const maxGas = max(...gasOptions);  // Choose fastest
```

### Percentage Calculations

```typescript
import { calculatePercentage, calculatePercentageOf } from '@tevm/primitives';

// Calculate percentage of value
const total = parseEther('100');  // 100 ETH
const fee = calculatePercentage(total, 250);  // 2.5% fee
// Returns: 2500000000000000000n (2.5 ETH)

// Calculate what percentage one value is of another
const part = parseEther('25');  // 25 ETH
const whole = parseEther('100');  // 100 ETH
const percent = calculatePercentageOf(part, whole);
// Returns: 2500 (represents 25.00%, uses basis points)

// Basis points: 10000 = 100%
// So 2500 = 25%, 100 = 1%, 1 = 0.01%
```

## Examples

### Gas Price Estimation

```typescript
import { parseGwei, formatEther, calculateGasCost } from '@tevm/primitives';

function estimateTransactionCost(
    gasEstimate: bigint,
    gasPriceOptions: { slow: string; average: string; fast: string }
): { slow: string; average: string; fast: string } {
    const estimate = (priceInGwei: string) => {
        const gasPrice = parseGwei(priceInGwei);
        const cost = calculateGasCost(gasEstimate, gasPrice);
        return formatEther(cost);
    };

    return {
        slow: estimate(gasPriceOptions.slow),
        average: estimate(gasPriceOptions.average),
        fast: estimate(gasPriceOptions.fast),
    };
}

// Usage
const costs = estimateTransactionCost(21000n, {
    slow: '10',    // 10 gwei
    average: '25', // 25 gwei
    fast: '50',    // 50 gwei
});
// { slow: "0.00021", average: "0.000525", fast: "0.00105" }
```

### ERC-20 Token Amounts

```typescript
import { parseUnits, formatUnits } from '@tevm/primitives';

// Handle different token decimals
const tokens = {
    USDC: { decimals: 6, balance: '1000.50' },
    DAI: { decimals: 18, balance: '500.123456789' },
    WBTC: { decimals: 8, balance: '0.5' },
};

// Parse for smart contract calls
const usdcAmount = parseUnits(tokens.USDC.balance, tokens.USDC.decimals);
const daiAmount = parseUnits(tokens.DAI.balance, tokens.DAI.decimals);
const wbtcAmount = parseUnits(tokens.WBTC.balance, tokens.WBTC.decimals);

// Format for display
function formatTokenBalance(rawAmount: bigint, decimals: number): string {
    return formatUnits(rawAmount, decimals);
}

const displayBalance = formatTokenBalance(1000500000n, 6);  // "1000.5" USDC
```

### Fee Calculation with Percentage

```typescript
import { parseEther, calculatePercentage, formatEther } from '@tevm/primitives';

function calculateWithFee(amount: bigint, feeBasisPoints: number): {
    original: string;
    fee: string;
    total: string;
} {
    const fee = calculatePercentage(amount, feeBasisPoints);
    const total = amount + fee;

    return {
        original: formatEther(amount),
        fee: formatEther(fee),
        total: formatEther(total),
    };
}

// 2.5% protocol fee
const transfer = calculateWithFee(parseEther('100'), 250);
// {
//     original: "100.0",
//     fee: "2.5",
//     total: "102.5"
// }
```

## Zig API

```zig
const primitives = @import("primitives");
const numeric = primitives.numeric;

// Parsing
const one_eth = try numeric.parseEther("1.0");
const gas_price = try numeric.parseGwei("50");
const custom = try numeric.parseUnits("100.5", 6);

// Formatting
const eth_str = try numeric.formatEther(allocator, 1_000_000_000_000_000_000);
defer allocator.free(eth_str);

const gwei_str = try numeric.formatGwei(allocator, 50_000_000_000);
defer allocator.free(gwei_str);

// Conversion
const wei_val = numeric.gweiToWei(20);
const gwei_val = numeric.weiToGwei(20_000_000_000);

// Safe arithmetic
const sum = try numeric.safeAdd(100, 200);
const diff = try numeric.safeSub(200, 100);
const product = try numeric.safeMul(50, 2);
const quotient = try numeric.safeDiv(100, 5);

// Gas calculation
const cost = numeric.calculateGasCost(21000, gas_price);

// Min/max
const minimum = numeric.min(100, 50, 75);
const maximum = numeric.max(100, 50, 75);

// Percentage
const fee = numeric.calculatePercentage(1_000_000, 250); // 2.5%
const pct = numeric.calculatePercentageOf(250_000, 1_000_000); // 25%
```

## Error Handling

```typescript
// Parsing errors
try {
    parseEther('not-a-number');  // Throws
} catch (e) {
    console.error('Invalid ether amount:', e);
}

// Arithmetic errors
try {
    safeSub(50n, 100n);  // Would be negative - throws
} catch (e) {
    console.error('Underflow:', e);
}

try {
    safeDiv(100n, 0n);  // Division by zero - throws
} catch (e) {
    console.error('Division by zero:', e);
}
```

## Implementation Notes

### Precision

All operations use `bigint` to maintain full precision:
- No floating-point rounding errors
- Handles full uint256 range (0 to 2^256-1)
- String parsing preserves all decimal places

### Performance

- Parsing: O(n) where n is string length
- Formatting: O(1) arithmetic + O(n) string building
- Arithmetic: Native bigint operations (very fast)

### Unit Basis Points

Percentages use basis points (1/10000):
- 10000 = 100%
- 100 = 1%
- 1 = 0.01%

This avoids floating-point math and allows precise fee calculations.

## Testing

Comprehensive test coverage in:
- `numeric.test.ts` - TypeScript unit tests
- `numeric.zig` - Zig unit tests (62 test blocks)

Test vectors include:
- All unit conversions
- Edge cases (0, MAX_UINT256)
- Overflow/underflow scenarios
- Percentage calculations
- Gas cost estimation
- Rounding behavior

## References

- [Ethereum Units](https://ethereum.org/en/developers/docs/intro-to-ether/#denominations)
- [EIP-1559: Fee Market](https://eips.ethereum.org/EIPS/eip-1559) (Gas price calculations)
- [Solidity Units](https://docs.soliditylang.org/en/latest/units-and-global-variables.html#ether-units)
