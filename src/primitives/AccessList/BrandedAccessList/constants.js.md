# constants.js

Gas cost constants for EIP-2930 Access Lists.

## Constants

### ADDRESS_COST

```typescript
export const ADDRESS_COST = 2400n;
```

Gas cost per address in access list (EIP-2930).

### STORAGE_KEY_COST

```typescript
export const STORAGE_KEY_COST = 1900n;
```

Gas cost per storage key in access list (EIP-2930).

### COLD_ACCOUNT_ACCESS_COST

```typescript
export const COLD_ACCOUNT_ACCESS_COST = 2600n;
```

Gas cost for cold account access (without access list).

### COLD_STORAGE_ACCESS_COST

```typescript
export const COLD_STORAGE_ACCESS_COST = 2100n;
```

Gas cost for cold storage access (without access list).

### WARM_STORAGE_ACCESS_COST

```typescript
export const WARM_STORAGE_ACCESS_COST = 100n;
```

Gas cost for warm storage access (after warmed by access list).

## Usage

```typescript
import {
  ADDRESS_COST,
  STORAGE_KEY_COST,
  COLD_ACCOUNT_ACCESS_COST,
  COLD_STORAGE_ACCESS_COST,
  WARM_STORAGE_ACCESS_COST
} from './BrandedAccessList/constants.js';

// Calculate cost
const cost = (addresses * ADDRESS_COST) + (keys * STORAGE_KEY_COST);

// Calculate savings
const savings = (addresses * (COLD_ACCOUNT_ACCESS_COST - ADDRESS_COST)) +
                (keys * (COLD_STORAGE_ACCESS_COST - STORAGE_KEY_COST));
```

## See Also

- [gasCost](./gasCost.js.md) - Calculate total cost
- [gasSavings](./gasSavings.js.md) - Calculate savings
- [EIP-2930](https://eips.ethereum.org/EIPS/eip-2930) - Access List specification
