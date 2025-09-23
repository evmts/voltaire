# EIP Override System

The Guillotine EVM allows granular control over Ethereum Improvement Proposals (EIPs) through an override system. This enables you to:

- Enable future EIPs on older hardforks for testing
- Disable specific EIPs for compatibility testing
- Create custom network configurations

## Usage

Configure EIP overrides in your `EvmConfig`:

```zig
const config = EvmConfig{
    .eips = Eips{
        .hardfork = Hardfork.LONDON,
        .overrides = &[_]EipOverride{
            // Enable a future EIP
            .{ .eip = 3855, .enabled = true }, // PUSH0 from Shanghai

            // Disable an existing EIP
            .{ .eip = 2929, .enabled = false }, // Berlin gas changes
        },
    },
    .eip_overrides = &[_]EipOverride{
        .{ .eip = 3855, .enabled = true },
        .{ .eip = 2929, .enabled = false },
    },
};
```

## Examples

### Enable Future Features for Testing

Test Shanghai features on a London network:

```zig
const london_with_shanghai = EvmConfig{
    .eips = Eips{
        .hardfork = Hardfork.LONDON,
        .overrides = &[_]EipOverride{
            .{ .eip = 3855, .enabled = true }, // PUSH0 opcode
            .{ .eip = 3651, .enabled = true }, // Warm COINBASE
            .{ .eip = 3860, .enabled = true }, // Initcode limit
        },
    },
};
```

### Disable Features for Compatibility

Create a Cancun network without blob transactions:

```zig
const cancun_no_blobs = EvmConfig{
    .eips = Eips{
        .hardfork = Hardfork.CANCUN,
        .overrides = &[_]EipOverride{
            .{ .eip = 4844, .enabled = false }, // No blob transactions
            .{ .eip = 7516, .enabled = false }, // No BLOBBASEFEE opcode
        },
    },
};
```

### Custom Network Configuration

Mix and match features from different hardforks:

```zig
const custom_network = EvmConfig{
    .eips = Eips{
        .hardfork = Hardfork.BERLIN, // Base: Berlin
        .overrides = &[_]EipOverride{
            // Add London features
            .{ .eip = 1559, .enabled = true }, // Fee market
            .{ .eip = 3198, .enabled = true }, // BASEFEE opcode

            // Skip some Berlin features
            .{ .eip = 2930, .enabled = false }, // No access lists

            // Add future features
            .{ .eip = 3855, .enabled = true }, // PUSH0 from Shanghai
        },
    },
};
```

## Important EIP Numbers

### Opcode Changes
- **3855**: PUSH0 instruction (Shanghai)
- **3198**: BASEFEE opcode (London)
- **5656**: MCOPY opcode (Cancun)
- **1153**: Transient storage (TLOAD/TSTORE) (Cancun)

### Gas Changes
- **2929**: Gas cost increases for state access (Berlin)
- **3529**: Reduction in refunds (London)
- **1559**: Fee market change (London)
- **2028**: Reduced calldata costs (Istanbul)

### Protocol Changes
- **4844**: Blob transactions (Cancun)
- **6780**: SELFDESTRUCT restrictions (Cancun)
- **7702**: EOA code execution (Prague)
- **2935**: Historical block hashes (Prague)

### Precompiles
- **2537**: BLS12-381 precompiles (Prague)

## Testing with Overrides

The override system is particularly useful for:

1. **Forward Compatibility Testing**: Enable upcoming EIPs to test your contracts against future network upgrades
2. **Backward Compatibility**: Disable recent EIPs to ensure your code works on older networks
3. **Custom Test Networks**: Create specific configurations for testing edge cases
4. **Performance Testing**: Enable/disable gas-related EIPs to measure impact

## Notes

- Overrides are applied at compile time for optimal performance
- The first matching override in the list takes precedence
- Overrides affect all EIP-dependent behavior including gas costs, opcode availability, and protocol rules
- Some EIPs have dependencies on others; ensure compatible combinations