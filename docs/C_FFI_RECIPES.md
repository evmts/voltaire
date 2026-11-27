# Voltaire C FFI Recipes

Voltaire publishes **`@tevm/voltaire`** (TypeScript / WASM / synchronous Bun Native FFI), prebuilt npm platform binaries (**`@tevm/voltaire-{darwin-arm64,darwin-x64,linux-x64,linux-arm64,win32-x64}`**), **`@tevm/zig`** (Zig 0.17.1 core), and standalone **C99 ABI release tarballs** exported directly from Zig ([`packages/voltaire-zig/src/c_api.zig`](../packages/voltaire-zig/src/c_api.zig)).

If you are using **C, C++, Rust, Go, Python, Swift**, or any other language with a C FFI, install a prebuilt GitHub Release tarball with `pkg-config` or build the shared library from source against the auto-generated C header ([`packages/voltaire-zig/src/primitives.h`](../packages/voltaire-zig/src/primitives.h)).

---

## 1. Installing Prebuilt C99 ABI Tarballs (`pkg-config`)

Every Voltaire GitHub Release publishes standalone, self-contained C99 ABI tarballs for all 5 supported platforms alongside a `SHA256SUMS.txt` checksum manifest:

| Platform | Target Triple | Tarball |
| --- | --- | --- |
| macOS Apple Silicon | `aarch64-macos` | `voltaire-c-abi-<version>-darwin-arm64.tar.gz` |
| macOS Intel | `x86_64-macos` | `voltaire-c-abi-<version>-darwin-x64.tar.gz` |
| Linux x86_64 | `x86_64-linux-gnu` | `voltaire-c-abi-<version>-linux-x64.tar.gz` |
| Linux ARM64 | `aarch64-linux-gnu` | `voltaire-c-abi-<version>-linux-arm64.tar.gz` |
| Windows x86_64 | `x86_64-windows` | `voltaire-c-abi-<version>-win32-x64.tar.gz` |

Each tarball bundles:

- `lib/libprimitives_c.{dylib,so}` (or `lib/primitives_c.dll` on Windows) — self-contained shared library with `blst`, `c-kzg-4844`, and `libwally-core` linked in
- `include/primitives.h` — auto-generated C99 ABI header
- `lib/pkgconfig/voltaire.pc` — relocatable `pkg-config` manifest (`prefix=${pcfiledir}/../..`)

### Download, Verify, and Configure `pkg-config`

```bash
VERSION="0.6.1"
PLATFORM="darwin-arm64" # or darwin-x64, linux-x64, linux-arm64, win32-x64
BASE_URL="https://github.com/evmts/voltaire/releases/download/@tevm/voltaire@${VERSION}"
TARBALL="voltaire-c-abi-${VERSION}-${PLATFORM}.tar.gz"

curl -fsSLO "${BASE_URL}/${TARBALL}"
curl -fsSLO "${BASE_URL}/SHA256SUMS.txt"

# Verify SHA-256 integrity (macOS: shasum -a 256 -c; Linux: sha256sum -c)
grep "${TARBALL}" SHA256SUMS.txt | shasum -a 256 -c -

# Extract to a local prefix (or /usr/local)
tar -xzf "${TARBALL}"
export VOLTAIRE_PREFIX="$PWD/voltaire-c-abi-${VERSION}-${PLATFORM}"
export PKG_CONFIG_PATH="${VOLTAIRE_PREFIX}/lib/pkgconfig:${PKG_CONFIG_PATH:-}"

# Verify pkg-config resolution
pkg-config --modversion voltaire
pkg-config --cflags --libs voltaire
```

Compile any C/C++ consumer with `pkg-config`:

```bash
cc example.c \
  $(pkg-config --cflags --libs voltaire) \
  -Wl,-rpath,"$(pkg-config --variable=libdir voltaire)" \
  -o example && ./example
```

---

## 2. Building from Source

### Prerequisites

- **Zig 0.17.1+**
- **C compiler toolchain** (for vendored `blst`, `c-kzg-4844`, and `libwally-core`)
- **Rust / Cargo** (optional — only needed when enabling `-Dwith-rust=true` for arkworks/keccak-asm)
- **Submodules initialized:**

```bash
git submodule update --init --recursive packages/voltaire-zig/lib/libwally-core
```

### Build Commands

```bash
# Build static & shared C API libraries + auto-generated header:
#   zig-out/include/primitives.h
#   zig-out/lib/libprimitives_c.{a,so,dylib}
#   zig-out/lib/libvoltaire_state_manager.{so,dylib}
#   zig-out/lib/libvoltaire_blockchain.{so,dylib}
zig build -Dwith-c-api=true -Doptimize=ReleaseFast

# Build Bun/Node FFI shared library (zig-out/native/libprimitives_ts_native.{dylib,so}):
zig build build-ts-native -Dwith-c-api=true

# Regenerate packages/voltaire-zig/src/primitives.h standalone:
zig build generate-header

# Cross-compile platform shared libraries (outputs under zig-out/native/<platform>/):
zig build build-native-darwin-arm64 -Dwith-c-api=true
zig build build-native-darwin-x64   -Dwith-c-api=true
zig build build-native-linux-arm64  -Dwith-c-api=true
zig build build-native-linux-x64    -Dwith-c-api=true
zig build build-native-win32-x64    -Dwith-c-api=true

# Package npm platform packages + C99 ABI tarballs locally:
node scripts/package-native-platforms.mjs --input-dir zig-out/native --out-dir dist-native --allow-partial --verify
```

> **Static vs. shared linking:** Link the **shared library** (`libprimitives_c.so` / `libprimitives_c.dylib` / `primitives_c.dll`). It already bundles `blst`, `c-kzg-4844`, and `libwally-core`. The static archive `libprimitives_c.a` does not bundle those archives.

---

## 3. ABI Conventions & Memory Ownership

1. **Error codes:** `0` (`PRIMITIVES_SUCCESS`) indicates success; negative integers indicate errors:
   - `-1`: `PRIMITIVES_ERROR_INVALID_HEX`
   - `-2`: `PRIMITIVES_ERROR_INVALID_LENGTH`
   - `-3`: `PRIMITIVES_ERROR_INVALID_CHECKSUM`
   - `-4`: `PRIMITIVES_ERROR_OUT_OF_MEMORY`
   - `-5`: `PRIMITIVES_ERROR_INVALID_INPUT`
   - `-6`: `PRIMITIVES_ERROR_INVALID_SIGNATURE`
   - `-7`: `PRIMITIVES_ERROR_INVALID_SELECTOR`
   - `-20`: `PRIMITIVES_ERROR_KZG_NOT_LOADED`
   - `-21`: `PRIMITIVES_ERROR_KZG_INVALID_BLOB`
   - `-22`: `PRIMITIVES_ERROR_KZG_INVALID_PROOF`
2. **Caller-owned buffers:** Primitive and crypto functions never heap-allocate for the caller — pass fixed-size structs (`PrimitivesAddress`, `PrimitivesHash`, `PrimitivesU256`) or pre-sized output buffers.
3. **Hex writers omit the NUL terminator:** `primitives_address_to_hex` and `primitives_address_to_checksum_hex` write exactly **42 bytes** (`0x` + 40 hex chars); `primitives_hash_to_hex` writes exactly **66 bytes** (`0x` + 64 hex chars). Allocate one extra byte and write `'\0'` if passing to C string APIs.
4. **Opaque handles must be destroyed:** Pair `state_manager_create*` / `state_manager_destroy`, `blockchain_create*` / `blockchain_destroy`, `hdwallet_from_seed` / `hdwallet_free`, and `kzg_load_trusted_setup` / `kzg_free_trusted_setup`.

See the full auto-generated declarations in [`packages/voltaire-zig/src/primitives.h`](../packages/voltaire-zig/src/primitives.h) and the runnable C example in [`packages/voltaire-zig/examples/c/basic_usage.c`](../packages/voltaire-zig/examples/c/basic_usage.c).

---

## 4. Language Recipes

### C / C++

Save as `example.c`:

```c
#include "primitives.h"
#include <assert.h>
#include <stdio.h>

int main(void) {
    PrimitivesAddress addr;
    assert(primitives_address_from_hex(
        "0x742d35cc6634c0532925a3b844bc9e7595f0beb0", &addr) == PRIMITIVES_SUCCESS);

    uint8_t checksum[43] = {0};
    assert(primitives_address_to_checksum_hex(&addr, checksum) == PRIMITIVES_SUCCESS);
    printf("Checksum: %s\n", (char *)checksum);

    static const uint8_t msg[] = "transfer(address,uint256)";
    PrimitivesHash digest;
    assert(primitives_keccak256(msg, sizeof(msg) - 1, &digest) == PRIMITIVES_SUCCESS);

    uint8_t hash_hex[67] = {0};
    assert(primitives_hash_to_hex(&digest, hash_hex) == PRIMITIVES_SUCCESS);
    printf("Keccak256: %s\n", (char *)hash_hex);
    return 0;
}
```

Compile and run with `pkg-config` (prebuilt tarball):

```bash
cc example.c \
  $(pkg-config --cflags --libs voltaire) \
  -Wl,-rpath,"$(pkg-config --variable=libdir voltaire)" \
  -o example && ./example
```

Or directly against a source build (`zig-out/`):

```bash
cc example.c \
  -I./zig-out/include \
  -L./zig-out/lib -Wl,-rpath,./zig-out/lib \
  -lprimitives_c \
  -o example && ./example
```

---

### Rust

Add a `build.rs` that prefers `pkg-config` (when a prebuilt tarball is on `PKG_CONFIG_PATH`) or falls back to `VOLTAIRE_LIB_DIR` / `zig-out/lib`:

```rust
// build.rs
fn main() {
    println!("cargo:rerun-if-env-changed=PKG_CONFIG_PATH");
    println!("cargo:rerun-if-env-changed=VOLTAIRE_LIB_DIR");

    // Option A: Prebuilt tarball via pkg-config (`pkg-config` build-dependency)
    // if let Ok(lib) = pkg_config::Config::new().probe("voltaire") {
    //     for path in &lib.link_paths {
    //         println!("cargo:rustc-link-arg=-Wl,-rpath,{}", path.display());
    //     }
    //     return;
    // }

    // Option B: Explicit VOLTAIRE_LIB_DIR or local zig-out/lib
    let lib_dir = std::env::var("VOLTAIRE_LIB_DIR")
        .unwrap_or_else(|_| "../voltaire/zig-out/lib".to_string());

    println!("cargo:rustc-link-search=native={lib_dir}");
    println!("cargo:rustc-link-lib=dylib=primitives_c");

    let target_os = std::env::var("CARGO_CFG_TARGET_OS").unwrap_or_default();
    if target_os == "linux" || target_os == "macos" {
        println!("cargo:rustc-link-arg=-Wl,-rpath,{lib_dir}");
    }
}
```

Declare the `extern "C"` symbols you need in `src/lib.rs`:

```rust
use std::ffi::{c_char, c_int, CString};

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct PrimitivesAddress {
    pub bytes: [u8; 20],
}

#[repr(C)]
#[derive(Clone, Copy, Default)]
pub struct PrimitivesHash {
    pub bytes: [u8; 32],
}

unsafe extern "C" {
    fn primitives_address_from_hex(hex: *const c_char, out: *mut PrimitivesAddress) -> c_int;
    fn primitives_address_to_checksum_hex(addr: *const PrimitivesAddress, buf: *mut u8) -> c_int;
    fn primitives_keccak256(data: *const u8, len: usize, out: *mut PrimitivesHash) -> c_int;
}

pub fn keccak256(data: &[u8]) -> Result<[u8; 32], c_int> {
    let mut out = PrimitivesHash::default();
    let rc = unsafe { primitives_keccak256(data.as_ptr(), data.len(), &mut out) };
    if rc == 0 { Ok(out.bytes) } else { Err(rc) }
}

pub fn checksum_address(hex: &str) -> Result<String, c_int> {
    let c_hex = CString::new(hex).map_err(|_| -5)?;
    let mut addr = PrimitivesAddress::default();
    let rc = unsafe { primitives_address_from_hex(c_hex.as_ptr(), &mut addr) };
    if rc != 0 { return Err(rc); }

    let mut buf = [0u8; 42];
    let rc = unsafe { primitives_address_to_checksum_hex(&addr, buf.as_mut_ptr()) };
    if rc != 0 { return Err(rc); }
    Ok(String::from_utf8_lossy(&buf).into_owned())
}
```

---

### Go (CGO)

With `PKG_CONFIG_PATH` pointing at the extracted tarball's `lib/pkgconfig`, CGO resolves headers and library flags via `#cgo pkg-config: voltaire`:

```go
package voltaire

/*
#cgo pkg-config: voltaire
#include "primitives.h"
#include <stdlib.h>
*/
import "C"
import (
	"fmt"
	"unsafe"
)

func ChecksumAddress(hexStr string) (string, error) {
	cHex := C.CString(hexStr)
	defer C.free(unsafe.Pointer(cHex))

	var addr C.PrimitivesAddress
	if rc := C.primitives_address_from_hex(cHex, &addr); rc != 0 {
		return "", fmt.Errorf("primitives_address_from_hex failed: %d", int(rc))
	}

	var buf [42]C.uint8_t
	if rc := C.primitives_address_to_checksum_hex(&addr, &buf[0]); rc != 0 {
		return "", fmt.Errorf("primitives_address_to_checksum_hex failed: %d", int(rc))
	}
	return C.GoStringN((*C.char)(unsafe.Pointer(&buf[0])), 42), nil
}

func Keccak256(data []byte) ([32]byte, error) {
	var out C.PrimitivesHash
	var ptr *C.uint8_t
	if len(data) > 0 {
		ptr = (*C.uint8_t)(unsafe.Pointer(&data[0]))
	}
	if rc := C.primitives_keccak256(ptr, C.size_t(len(data)), &out); rc != 0 {
		return [32]byte{}, fmt.Errorf("primitives_keccak256 failed: %d", int(rc))
	}
	var result [32]byte
	for i := 0; i < 32; i++ {
		result[i] = byte(out.bytes[i])
	}
	return result, nil
}
```

(When building from source without `pkg-config`, replace `#cgo pkg-config: voltaire` with `#cgo CFLAGS: -I${SRCDIR}/../voltaire/zig-out/include` and `#cgo LDFLAGS: -L${SRCDIR}/../voltaire/zig-out/lib -Wl,-rpath,${SRCDIR}/../voltaire/zig-out/lib -lprimitives_c`.)

---

### Python (`ctypes`)

Zero third-party dependencies — uses the Python standard library (point `VOLTAIRE_LIB_PATH` at your extracted tarball's `lib/libprimitives_c.{dylib,so}` or `./zig-out/lib`):

```python
import ctypes
import os
import platform
from ctypes import POINTER, Structure, c_char_p, c_int, c_size_t, c_uint8

def load_voltaire(lib_dir: str = "./zig-out/lib") -> ctypes.CDLL:
    ext = {"Darwin": "dylib", "Windows": "dll"}.get(platform.system(), "so")
    prefix = "" if platform.system() == "Windows" else "lib"
    path = os.environ.get("VOLTAIRE_LIB_PATH", os.path.join(lib_dir, f"{prefix}primitives_c.{ext}"))
    return ctypes.CDLL(path)

class PrimitivesAddress(Structure):
    _fields_ = [("bytes", c_uint8 * 20)]

class PrimitivesHash(Structure):
    _fields_ = [("bytes", c_uint8 * 32)]

lib = load_voltaire()
lib.primitives_address_from_hex.argtypes = [c_char_p, POINTER(PrimitivesAddress)]
lib.primitives_address_from_hex.restype = c_int
lib.primitives_address_to_checksum_hex.argtypes = [POINTER(PrimitivesAddress), POINTER(c_uint8)]
lib.primitives_address_to_checksum_hex.restype = c_int
lib.primitives_keccak256.argtypes = [POINTER(c_uint8), c_size_t, POINTER(PrimitivesHash)]
lib.primitives_keccak256.restype = c_int

def checksum_address(hex_str: str) -> str:
    addr = PrimitivesAddress()
    rc = lib.primitives_address_from_hex(hex_str.encode("utf-8"), ctypes.byref(addr))
    if rc != 0:
        raise ValueError(f"Invalid address (error {rc})")
    buf = (c_uint8 * 42)()
    rc = lib.primitives_address_to_checksum_hex(ctypes.byref(addr), buf)
    if rc != 0:
        raise RuntimeError(f"Checksum failed (error {rc})")
    return bytes(buf).decode("ascii")

def keccak256(data: bytes) -> bytes:
    out = PrimitivesHash()
    buf = (c_uint8 * len(data)).from_buffer_copy(data)
    rc = lib.primitives_keccak256(buf, len(data), ctypes.byref(out))
    if rc != 0:
        raise RuntimeError(f"keccak256 failed (error {rc})")
    return bytes(out.bytes)
```

---

### Swift (Swift Package Manager)

Create a C module target (`Sources/CVoltaire/include/primitives.h` copied from the extracted tarball's `include/primitives.h` or `zig-out/include/primitives.h`, plus an empty `Sources/CVoltaire/empty.c`):

```swift
// Package.swift
// swift-tools-version:5.9
import PackageDescription

let libDir = "../voltaire-c-abi-0.5.1-darwin-arm64/lib" // or "../voltaire/zig-out/lib"

let package = Package(
    name: "MyEthApp",
    platforms: [.macOS(.v12), .iOS(.v15)],
    targets: [
        .target(
            name: "CVoltaire",
            path: "Sources/CVoltaire",
            sources: ["empty.c"],
            publicHeadersPath: "include",
            linkerSettings: [
                .unsafeFlags(["-L\(libDir)", "-lprimitives_c"]),
                .unsafeFlags(["-Xlinker", "-rpath", "-Xlinker", libDir]),
            ]
        ),
        .executableTarget(
            name: "MyEthApp",
            dependencies: ["CVoltaire"]
        ),
    ]
)
```

Call into `CVoltaire` from Swift:

```swift
import CVoltaire
import Foundation

func checksumAddress(_ hex: String) throws -> String {
    var addr = PrimitivesAddress()
    let rc1 = hex.withCString { ptr in
        primitives_address_from_hex(ptr, &addr)
    }
    guard rc1 == 0 else { throw NSError(domain: "Voltaire", code: Int(rc1)) }

    var buf = [UInt8](repeating: 0, count: 42)
    let rc2 = primitives_address_to_checksum_hex(&addr, &buf)
    guard rc2 == 0 else { throw NSError(domain: "Voltaire", code: Int(rc2)) }
    return String(decoding: buf, as: UTF8.self)
}
```

---

### TypeScript / JavaScript / Bun

You do **not** need manual C FFI setup in JS/TS — install `@tevm/voltaire` directly (prebuilt platform packages `@tevm/voltaire-<platform>` are resolved automatically, or override via `VOLTAIRE_NATIVE_LIB`):

```bash
pnpm add @tevm/voltaire
```

- Pure JS/TS: `import { Address, Keccak256 } from '@tevm/voltaire'`
- WebAssembly: `import { Keccak256 } from '@tevm/voltaire/wasm'`
- Synchronous Native FFI (Bun / Node-API): `import { Keccak256, Secp256k1, SHA256, Blake2, Ripemd160, P256, Ed25519, X25519, KZG } from '@tevm/voltaire/native'`
