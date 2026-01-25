# Review: Fix Contract Write Method Types

## Priority: 🟠 IMPORTANT

## Summary

Contract write methods don't accept `value`, `gas`, or other transaction options.

## Current Problem

**File**: [Contract.ts#L243-L271](../src/services/Contract/Contract.ts#L243-L271)

Write methods only accept function arguments, not transaction options:
```typescript
// Current - can't send ETH with call
contract.write.deposit() // No way to send value!

// Viem allows
contract.write.deposit({ value: parseEther('1') })
```

## Fix Required

### 1. Update write method signature

```typescript
// Add options parameter
type WriteMethod<TArgs extends readonly unknown[]> = (
  ...argsAndOptions: TArgs extends readonly []
    ? [options?: WriteOptions]
    : [...args: TArgs, options?: WriteOptions]
) => Effect.Effect<HashType, ContractWriteError, SignerService>;

interface WriteOptions {
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: bigint;
}
```

### 2. Update implementation

```typescript
const write = {} as ContractInstance<TAbi>["write"];
for (const fn of writeFunctions) {
  (write as Record<string, Function>)[fn.name] = (
    ...argsAndOptions: unknown[]
  ) =>
    Effect.gen(function* () {
      const signer = yield* SignerService;
      
      // Separate args from options (last arg if it's an object with known keys)
      const lastArg = argsAndOptions[argsAndOptions.length - 1];
      const hasOptions = lastArg && typeof lastArg === 'object' &&
        ('value' in lastArg || 'gas' in lastArg || 'nonce' in lastArg);
      
      const args = hasOptions
        ? argsAndOptions.slice(0, -1)
        : argsAndOptions;
      const options = hasOptions ? lastArg as WriteOptions : {};
      
      const data = encodeArgs(abiItems, fn.name, args);
      
      const txHash = yield* signer.sendTransaction({
        to: brandedAddress,
        data,
        value: options.value,
        gas: options.gas,
        gasPrice: options.gasPrice,
        maxFeePerGas: options.maxFeePerGas,
        maxPriorityFeePerGas: options.maxPriorityFeePerGas,
        nonce: options.nonce
      });
      
      return txHash;
    });
}
```

## Usage After Fix

```typescript
const contract = yield* Contract(wethAddress, wethAbi);

// Deposit ETH to WETH
const hash = yield* contract.write.deposit({
  value: parseEther('1')
});

// Transfer with custom gas
const hash2 = yield* contract.write.transfer(recipient, amount, {
  gas: 100000n
});
```

## Testing

- Test payable function with value
- Test custom gas limit
- Test EIP-1559 fee params
- Test custom nonce
