# Unit Conversion Examples

This document demonstrates the usage of all unit conversion utilities.

## Quick Start

```typescript
import {
  formatEther,
  parseEther,
  formatGwei,
  parseGwei,
  formatUnits,
  parseUnits,
} from './units';
```

## formatEther

Convert wei (bigint) to human-readable ether string (18 decimals).

```typescript
// Basic conversions
formatEther(1000000000000000000n); // "1"
formatEther(1500000000000000000n); // "1.5"
formatEther(1n);                    // "0.000000000000000001"

// Large values
formatEther(1000000000000000000000n); // "1000"

// Negative values
formatEther(-1000000000000000000n);   // "-1"

// Zero
formatEther(0n);                      // "0"

// Automatically removes trailing zeros
formatEther(1100000000000000000n);    // "1.1"
formatEther(1230000000000000000n);    // "1.23"
```

## parseEther

Convert human-readable ether string to wei (bigint) with 18 decimals.

```typescript
// Basic conversions
parseEther("1");                           // 1000000000000000000n
parseEther("1.5");                         // 1500000000000000000n
parseEther("0.000000000000000001");        // 1n

// Handles trailing zeros
parseEther("1.0");                         // 1000000000000000000n
parseEther("1.500000");                    // 1500000000000000000n

// Negative values
parseEther("-1");                          // -1000000000000000000n

// Zero
parseEther("0");                           // 0n
parseEther("0.0");                         // 0n
```

## formatGwei

Convert wei (bigint) to human-readable gwei string (9 decimals).

```typescript
// Basic conversions
formatGwei(1000000000n);    // "1"
formatGwei(1500000000n);    // "1.5"
formatGwei(1n);             // "0.000000001"

// Large values
formatGwei(1000000000000n); // "1000"

// Negative values
formatGwei(-1000000000n);   // "-1"

// Automatically removes trailing zeros
formatGwei(1100000000n);    // "1.1"
```

## parseGwei

Convert human-readable gwei string to wei (bigint) with 9 decimals.

```typescript
// Basic conversions
parseGwei("1");             // 1000000000n
parseGwei("1.5");           // 1500000000n
parseGwei("0.000000001");   // 1n

// Handles trailing zeros
parseGwei("1.0");           // 1000000000n
parseGwei("1.500000");      // 1500000000n

// Negative values
parseGwei("-1");            // -1000000000n
```

## formatUnits (Generic)

Convert wei (bigint) to human-readable string with custom decimal precision (0-77).

```typescript
// With 6 decimals (USDC/USDT)
formatUnits(1000000n, 6);           // "1"
formatUnits(1500000n, 6);           // "1.5"

// With 8 decimals (WBTC)
formatUnits(100000000n, 8);         // "1"
formatUnits(150000000n, 8);         // "1.5"

// With 0 decimals
formatUnits(123n, 0);               // "123"

// Automatically removes trailing zeros
formatUnits(1100000n, 6);           // "1.1"
formatUnits(1230000n, 6);           // "1.23"

// Negative values work with any decimals
formatUnits(-1000000n, 6);          // "-1"
```

## parseUnits (Generic)

Convert human-readable string to wei (bigint) with custom decimal precision (0-77).

```typescript
// With 6 decimals (USDC/USDT)
parseUnits("1", 6);                 // 1000000n
parseUnits("1.5", 6);               // 1500000n
parseUnits("0.000001", 6);          // 1n

// With 8 decimals (WBTC)
parseUnits("1", 8);                 // 100000000n
parseUnits("1.5", 8);               // 150000000n

// With 0 decimals
parseUnits("123", 0);               // 123n

// Handles trailing zeros
parseUnits("1.0", 6);               // 1000000n
parseUnits("1.500000", 6);          // 1500000n

// Negative values work with any decimals
parseUnits("-1", 6);                // -1000000n
```

## Round-Trip Conversions

Parse and format operations are inverses:

```typescript
// Ether round-trip
const wei = parseEther("1.5");
formatEther(wei);                   // "1.5"

// Gwei round-trip
const weiFromGwei = parseGwei("1.5");
formatGwei(weiFromGwei);            // "1.5"

// Custom decimals round-trip
const tokens = parseUnits("1.5", 6);
formatUnits(tokens, 6);             // "1.5"
```

## Error Handling

```typescript
// Too many decimal places
parseEther("1.0000000000000000001"); // Error: Too many decimal places: 19 (max 18)
parseGwei("1.0000000001");           // Error: Too many decimal places: 10 (max 9)

// Invalid decimal parameter
formatUnits(1n, -1);                 // Error: Invalid decimals: -1 (must be 0-77)
formatUnits(1n, 78);                 // Error: Invalid decimals: 78 (must be 0-77)
formatUnits(1n, 1.5);                // Error: Decimals must be an integer: 1.5

// Invalid input strings
parseEther("not a number");          // Error: Invalid whole part
parseEther("1.2.3");                 // Error: Invalid value: multiple decimal points
parseEther("");                      // Error: Invalid value: must be a non-empty string
```

## Common Use Cases

### Gas Price Calculations

```typescript
// Format gas price from wei to gwei
const gasPriceWei = 50000000000n;
const gasPriceGwei = formatGwei(gasPriceWei); // "50"

// Parse user input
const userInput = "100";
const gasPriceInWei = parseGwei(userInput);   // 100000000000n
```

### Transaction Value Display

```typescript
// Display transaction value
const txValueWei = 1500000000000000000n;
const displayValue = formatEther(txValueWei); // "1.5"

// Parse user input for transaction
const userValue = "0.1";
const txValue = parseEther(userValue);        // 100000000000000000n
```

### Token Conversions (USDC, USDT - 6 decimals)

```typescript
// Display token balance
const balanceRaw = 1500000n;
const balance = formatUnits(balanceRaw, 6);   // "1.5"

// Parse user input for token transfer
const amount = "100.50";
const amountRaw = parseUnits(amount, 6);      // 100500000n
```

### WBTC Conversions (8 decimals)

```typescript
// Display WBTC balance
const wbtcBalanceRaw = 150000000n;
const wbtcBalance = formatUnits(wbtcBalanceRaw, 8); // "1.5"

// Parse user input for WBTC transfer
const wbtcAmount = "0.01";
const wbtcAmountRaw = parseUnits(wbtcAmount, 8);    // 1000000n
```

## Max Value Support

All functions support the full range of bigint values, including max uint256:

```typescript
const maxUint256 = 115792089237316195423570985008687907853269984665640564039457584007913129639935n;
const formatted = formatEther(maxUint256);
// "115792089237316195423570985008687907853269984665640564039457.584007913129639935"

// Round-trip works
parseEther(formatted) === maxUint256; // true
```
