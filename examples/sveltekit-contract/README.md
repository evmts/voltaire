# SvelteKit + Voltaire Contract Example

A complete SvelteKit example demonstrating Ethereum contract interaction using Voltaire primitives.

## Features

- Connect to MetaMask/injected wallets
- Read from smart contracts
- Write transactions to contracts
- Listen to contract events
- Type-safe Ethereum primitives

## Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

## Configuration

1. Deploy a Counter contract (or use any existing contract)
2. Update `COUNTER_ADDRESS` in `src/routes/+page.svelte` with your contract address
3. If using a different contract, update the ABI in `src/lib/ethereum/contract.ts`

## Example Counter Contract (Solidity)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract Counter {
    uint256 public count;

    event CountChanged(uint256 oldValue, uint256 newValue, address indexed changedBy);

    function increment() external {
        uint256 oldValue = count;
        count += 1;
        emit CountChanged(oldValue, count, msg.sender);
    }

    function decrement() external {
        require(count > 0, "Counter: cannot decrement below zero");
        uint256 oldValue = count;
        count -= 1;
        emit CountChanged(oldValue, count, msg.sender);
    }

    function setCount(uint256 newCount) external {
        uint256 oldValue = count;
        count = newCount;
        emit CountChanged(oldValue, count, msg.sender);
    }
}
```

## Voltaire Imports

All Ethereum primitives come from `@tevm/voltaire`:

```typescript
import { Address, Hex, Abi, Keccak256 } from "@tevm/voltaire";
```

### Address

Type-safe 20-byte Ethereum addresses:

```typescript
// Create from hex string
const addr = Address("0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", {
  keccak256: Keccak256.hash,
});

// Convert to hex
const hex = Address.toHex(addr);

// Checksum format
const checksum = addr.toChecksummed();

// Short display (0x1234...5678)
const short = Address.toShortHex(addr, 6, 4);
```

### Hex

Hex string encoding/decoding:

```typescript
// From bytes to hex
const hex = Hex.fromBytes(bytes);

// From hex to bytes
const bytes = Hex.toBytes("0xabcd");
```

### Abi

ABI encoding for contract calls:

```typescript
const abi = Abi(contractAbi);

// Encode function call
const calldata = abi.encode("transfer", [recipient, amount]);

// Decode return value
const result = abi.decode("balanceOf", returnData);
```

### Keccak256

Hashing for signatures and event topics:

```typescript
const hash = Keccak256.hash(data);
```

## Project Structure

```
src/
  lib/
    ethereum/
      provider.ts   # BrowserProvider wrapper
      contract.ts   # Contract interaction helpers
    stores/
      wallet.ts     # Svelte store for wallet state
  routes/
    +page.svelte    # Main UI component
```

## Building

```bash
npm run build
npm run preview
```

## License

MIT
