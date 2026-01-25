# Review: Add deployContract Action

## Priority: 🟠 IMPORTANT

## Summary

Add `deployContract` for deploying contracts with constructor arguments.

## Implementation

```typescript
// src/services/Signer/actions/deployContract.ts
export interface DeployContractParams<TAbi extends Abi> {
  abi: TAbi;
  bytecode: HexType;
  args?: readonly unknown[];
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: bigint;
}

export interface DeployContractResult {
  hash: HashType;
  address: Effect.Effect<AddressType, ProviderError, ProviderService>;
}

export const deployContract = <TAbi extends Abi>(
  params: DeployContractParams<TAbi>
): Effect.Effect<DeployContractResult, SignerError, SignerService | ProviderService> =>
  Effect.gen(function* () {
    const signer = yield* SignerService;
    
    // Find constructor in ABI
    const constructor = params.abi.find(
      (item) => item.type === 'constructor'
    );
    
    // Encode constructor args
    let data = params.bytecode;
    if (params.args && params.args.length > 0 && constructor) {
      const encodedArgs = BrandedAbi.encodeConstructorArgs(
        constructor,
        params.args
      );
      data = Hex.concat([params.bytecode, encodedArgs]);
    }
    
    // Send deployment transaction (no `to` address)
    const hash = yield* signer.sendTransaction({
      to: null,
      data,
      value: params.value,
      gas: params.gas,
      gasPrice: params.gasPrice,
      maxFeePerGas: params.maxFeePerGas,
      maxPriorityFeePerGas: params.maxPriorityFeePerGas,
      nonce: params.nonce
    });
    
    // Return hash and lazy address getter
    return {
      hash,
      address: Effect.gen(function* () {
        const provider = yield* ProviderService;
        const receipt = yield* provider.waitForTransactionReceipt(hash);
        if (!receipt.contractAddress) {
          return yield* Effect.fail(
            new ProviderError({ hash }, 'No contract address in receipt')
          );
        }
        return Address.fromHex(receipt.contractAddress);
      })
    };
  });
```

## Usage

```typescript
const { hash, address } = yield* deployContract({
  abi: myContractAbi,
  bytecode: '0x608060405234801...',
  args: [initialOwner, initialSupply]
});

// Wait for deployment and get address
const contractAddress = yield* address;
console.log('Deployed at:', Address.toHex(contractAddress));
```

## Testing

- Test deployment with no args
- Test deployment with constructor args
- Test with value (payable constructor)
- Test address extraction from receipt
