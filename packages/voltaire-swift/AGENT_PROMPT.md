# Swift Primitives Expansion Prompt

## Context

A Swift package exists at `swift/` that wraps the Zig Ethereum primitives library. The foundation is complete with:
- Address, Hash, Hex, Keccak256 types
- 25 passing tests
- Colocation pattern: Swift files live in `src/` alongside Zig/TS, symlinked to `swift/Sources/Voltaire/`

## Your Task

Add more Swift primitive wrappers following the established patterns.

## Patterns to Follow

### 1. Colocated Swift files
Create Swift file next to Zig implementation:
```
src/primitives/Signature/Signature.swift  ← create here
src/primitives/Signature/Signature.zig    ← existing
```

Then symlink:
```bash
ln -sf ../../../src/primitives/Signature/Signature.swift swift/Sources/Voltaire/Signature.swift
```

### 2. Swift wrapper pattern
See `src/primitives/Address/Address.swift` for reference:
```swift
import Foundation
import CVoltaire

public struct TypeName: Equatable, Hashable, Sendable {
    internal var raw: PrimitivesTypeName  // C struct from header

    public init(hex: String) throws {
        var cType = PrimitivesTypeName()
        let result = primitives_typename_from_hex(hex, &cType)
        try checkResult(result)
        self.raw = cType
    }
    // ... more methods
}
```

### 3. C header location
Check `swift/Sources/CVoltaire/include/primitives.h` for available C functions. If needed functions aren't there, add them to the header (it's a subset of the full `src/primitives.h`).

### 4. Test pattern
Create test file at `swift/Tests/VoltaireTests/TypeNameTests.swift`:
```swift
import XCTest
@testable import Voltaire

final class TypeNameTests: XCTestCase {
    func testBasic() throws {
        // test implementation
    }
}
```

## Priority Primitives to Add

Check C API availability in `src/c_api.zig` and `src/primitives.h`:

1. **Signature** - ECDSA signatures (r, s, v)
2. **U256** - 256-bit integers
3. **Bytes32** - Fixed 32-byte arrays
4. **PrivateKey** - Secp256k1 private keys (careful with security)
5. **PublicKey** - Secp256k1 public keys

## Build & Test Commands

```bash
# From repo root
zig build build-ts-native

# From swift/
swift build
swift test
```

## Files to Reference

- `src/primitives/Address/Address.swift` - Complete wrapper example
- `src/primitives/Hex/Hex.swift` - Utility enum example
- `swift/Sources/Voltaire/VoltaireError.swift` - Error handling
- `swift/Sources/CVoltaire/include/primitives.h` - Available C functions
- `src/c_api.zig` - Full C API (may need to add functions to header)

## Checklist for Each New Type

- [ ] Create `src/primitives/TypeName/TypeName.swift`
- [ ] Create symlink to `swift/Sources/Voltaire/`
- [ ] Add any needed C functions to `swift/Sources/CVoltaire/include/primitives.h`
- [ ] Create `swift/Tests/VoltaireTests/TypeNameTests.swift`
- [ ] Run `swift test` - all tests pass
- [ ] Verify colocation: Swift file sits next to Zig/TS files
