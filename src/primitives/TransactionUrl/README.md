# TransactionUrl - ERC-681 Transaction URL Format

ERC-681 compliant transaction URL parsing and formatting for Ethereum.

## Overview

ERC-681 defines a standard URL format for representing Ethereum transactions:
```
ethereum:<address>[@<chainId>][/<function>][?<params>]
```

This enables:
- QR codes for payment requests
- Deep links for wallet apps
- Universal transaction representation

## Usage

### Parse URL

```typescript
import * as TransactionUrl from './primitives/TransactionUrl/index.js';

// Simple payment
const parsed = TransactionUrl.parse('ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1?value=1000000000000000000');
// {
//   target: AddressType,
//   chainId: 1n,
//   value: 1000000000000000000n
// }

// ERC-20 transfer
const erc20 = TransactionUrl.parse(
  'ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1/transfer?address=0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed&uint256=100'
);
// {
//   target: AddressType,
//   chainId: 1n,
//   functionName: 'transfer',
//   functionParams: {
//     address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
//     uint256: '100'
//   }
// }

// With calldata
const withData = TransactionUrl.parse('ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3?data=0xa9059cbb');
// {
//   target: AddressType,
//   data: BytesType
// }
```

### Format URL

```typescript
import * as TransactionUrl from './primitives/TransactionUrl/index.js';
import * as Address from '../Address/internal-index.js';

const address = Address.from('0x742d35Cc6634c0532925a3b844bc9e7595F251E3');

// Simple payment
const url = TransactionUrl.format({
  target: address,
  chainId: 1n,
  value: 1000000000000000000n,
});
// 'ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1?value=1000000000000000000'

// ERC-20 transfer
const erc20Url = TransactionUrl.format({
  target: address,
  chainId: 1n,
  functionName: 'transfer',
  functionParams: {
    address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
    uint256: '1000000000000000000',
  },
});
// 'ethereum:0x742d35Cc6634c0532925a3b844bc9e7595F251E3@1/transfer?address=0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed&uint256=1000000000000000000'
```

## Supported Parameters

### Standard Parameters
- `value` - Wei amount for native token transfers (BigInt)
- `gas` - Gas limit (BigInt)
- `gasPrice` - Gas price in wei (BigInt)
- `data` - Hex-encoded calldata (BytesType)

### Function Calls
- `functionName` - Contract function to call
- `functionParams` - Typed parameters for the function

## URL Encoding

- Function names with special characters are URL-encoded
- Parameter values are URL-encoded when necessary
- Addresses are checksummed (EIP-55)
- Numeric values support both decimal and hex (0x prefix)

## Round-Trip Safety

Format and parse are designed for round-trip safety:

```typescript
const original = { target: address, chainId: 1n, value: 1000n };
const url = TransactionUrl.format(original);
const parsed = TransactionUrl.parse(url);
// parsed matches original
```

## Error Handling

```typescript
try {
  TransactionUrl.parse('invalid:url');
} catch (error) {
  if (error instanceof InvalidTransactionUrlError) {
    console.log(error.message);
    console.log(error.details); // Additional error context
  }
}
```

## References

- [ERC-681 Specification](https://eips.ethereum.org/EIPS/eip-681)
- [EIP-55 Checksummed Addresses](https://eips.ethereum.org/EIPS/eip-55)

## Examples

### Payment Request (QR Code)
```typescript
// Generate payment request for 2.5 ETH on mainnet
const paymentUrl = TransactionUrl.format({
  target: merchantAddress,
  chainId: 1n,
  value: 2500000000000000000n, // 2.5 ETH
});
// Generate QR code from paymentUrl
```

### Token Transfer
```typescript
// USDC transfer request
const usdcTransfer = TransactionUrl.format({
  target: usdcContractAddress,
  chainId: 1n,
  functionName: 'transfer',
  functionParams: {
    recipient: recipientAddress,
    amount: '1000000', // 1 USDC (6 decimals)
  },
});
```

### NFT Purchase
```typescript
// Purchase NFT with specific token ID
const nftPurchase = TransactionUrl.format({
  target: nftContractAddress,
  chainId: 1n,
  functionName: 'mint',
  value: 50000000000000000n, // 0.05 ETH mint price
  functionParams: {
    tokenId: '42',
  },
});
```
