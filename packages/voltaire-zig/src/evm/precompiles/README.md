# Zig precompile execution

`precompiles.execute` dispatches using the supplied hardfork. Successful results
own their output: call `result.deinit(allocator)`. An EVM caller must translate
an exceptional precompile error into call failure with no remaining forwarded gas.

ModExp at address `0x05` right-pads missing input bytes and returns exactly the
declared modulus length, including an all-zero result for a zero modulus.
From Osaka, EIP-7823 rejects any declared base, exponent or modulus length above
1,024 bytes before empty-output shortcuts. EIP-7883 raises minimum gas to 500,
uses a minimum multiplication complexity of 16, doubles squared-word complexity
above 32 bytes, and charges 16 iterations per exponent byte beyond its head.
Even an empty result pays the calculated cost. Earlier forks retain EIP-198
or EIP-2565 pricing.

```zig
const std = @import("std");
const precompiles = @import("precompiles");

pub fn main() !void {
    const allocator = std.heap.page_allocator;
    const result = try precompiles.modexp.execute(allocator, &.{}, 500, .OSAKA);
    defer result.deinit(allocator);
    std.debug.assert(result.output.len == 0);
    std.debug.assert(result.gas_used == 500);
}
```

Gas calculations use the executable execution-specs definition: a zero exponent
head contributes zero extra bit iterations, including when its declared length
exceeds 32 bytes. Tests cover that distinction, exact gas boundaries, historical
acceptance, and each operand limit. `zig build test` explicitly includes ModExp's
crypto and precompile tests.

The TypeScript precompile and both public gas helpers implement the same fork
selection. TypeScript defaults to Berlin when its optional hardfork is omitted.
Guillotine maintains an older vendored copy; its synchronization and validation
are tracked separately in the stack upgrade ledger.
