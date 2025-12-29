# Kotlin Voltaire Implementation Guide

## Architecture

Kotlin bindings use **JNA** (Java Native Access) to call the C API exported by `libprimitives_ts_native`.

```
┌─────────────────────────────────────────┐
│ Kotlin Application                       │
└────────────────┬────────────────────────┘
                 │
                 ↓
┌─────────────────────────────────────────┐
│ Voltaire Kotlin Library                  │
│  - Address.kt, Hash.kt, etc.            │
│  - Type-safe wrappers around JNA        │
└────────────────┬────────────────────────┘
                 │ VoltaireLib (JNA interface)
                 ↓
┌─────────────────────────────────────────┐
│ libprimitives_ts_native (.so/.dylib)    │
│  - C API from c_api.zig                 │
└─────────────────────────────────────────┘
```

## File Organization

Kotlin files are **colocated** with Zig/TypeScript/Swift:

```
src/primitives/Address/
├── Address.zig       # Zig implementation
├── Address.ts        # TypeScript wrapper
├── Address.swift     # Swift wrapper
└── Address.kt        # Kotlin wrapper (symlinked to kotlin/src/)
```

## Adding New Primitives

1. **Create Kotlin file** next to Zig implementation:
   ```
   src/primitives/TypeName/TypeName.kt
   ```

2. **Add JNA function** to `kotlin/src/main/kotlin/com/voltaire/VoltaireLib.kt`

3. **Add symlink**:
   ```bash
   cd kotlin/src/main/kotlin/com/voltaire
   ln -sf ../../../../../src/primitives/TypeName/TypeName.kt TypeName.kt
   ```

4. **Create test** at `kotlin/src/test/kotlin/com/voltaire/TypeNameTest.kt`

## Build & Test

```bash
# Build native library first
zig build build-ts-native

# Build Kotlin
cd kotlin && ./gradlew build

# Run tests
cd kotlin && ./gradlew test
```

## Pattern Reference

### Struct-based types (Address, Hash, U256)

```kotlin
class Address private constructor(private val raw: PrimitivesAddress) {
    companion object {
        @JvmStatic
        fun fromHex(hex: String): Address {
            val addr = PrimitivesAddress()
            checkResult(VoltaireLib.INSTANCE.primitives_address_from_hex(hex, addr))
            return Address(addr)
        }
    }

    val hex: String
        get() {
            val buf = ByteArray(43)
            VoltaireLib.INSTANCE.primitives_address_to_hex(raw, buf)
            return String(buf, 0, 42)
        }
}
```

### Utility objects (Hex, Keccak256)

```kotlin
object Keccak256 {
    @JvmStatic
    fun hash(data: ByteArray): Hash {
        val out = PrimitivesHash()
        VoltaireLib.INSTANCE.primitives_keccak256(data, data.size.toLong(), out)
        return Hash(out)
    }
}
```

### Error handling

```kotlin
@Throws(VoltaireError::class)
internal fun checkResult(code: Int) {
    if (code != 0) throw VoltaireError.fromCode(code)
}
```

## React Native Integration

For React Native, use a **C++ Turbo Module** that calls the C API directly via JSI. This is separate from the Kotlin JNA bindings.

```
react-native-voltaire/
├── android/           # Android build config
├── ios/              # iOS build config
├── cpp/              # C++ Turbo Module (JSI bindings)
└── src/              # JS/TS interface
```
