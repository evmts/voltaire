import Foundation
import Voltaire
import CVoltaire

// Simple utility for headings
func section(_ title: String) {
    print("\n=== \(title) ===\n")
}

// 1) Getting Started: Address + Hashing
section("Getting Started")
do {
    // Parse and print address forms
    let addr = try Address(hex: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
    print("Address (hex):", addr.hex)
    print("Address (EIP-55):", addr.checksumHex)
    print("Checksum valid:", Address.isValidChecksum(addr.checksumHex))

    // Keccak-256 hash from different inputs
    let h1 = Keccak256.hash("hello world")
    print("Keccak-256 (\"hello world\"):", h1.hex)

    let bytes: [UInt8] = [0xde, 0xad, 0xbe, 0xef]
    let h2 = Keccak256.hash(bytes)
    print("Keccak-256 ([0xDE,0xAD,0xBE,0xEF]):", h2.hex)
} catch {
    print("Error:", error)
}

// 2) Keys: PrivateKey -> PublicKey -> Address
section("Key Derivation & Addresses")
do {
    // Generate a random private key and derive public key
    let priv = try PrivateKey.generate()
    let pub = try priv.publicKey() // 64-byte uncompressed
    let compressed = try pub.compressed() // 33-byte SEC1
    let address = try pub.address() // Ethereum address from pubkey

    print("Private Key:", "0x…" + Hex.encode(Array(priv.bytes.suffix(4))))
    print("Public Key (uncompressed, 64 bytes):", pub.uncompressed.count)
    print("Public Key (compressed, 33 bytes):", compressed.count)
    print("Derived Address:", address.checksumHex)
} catch {
    print("Error:", error)
}

// 3) Hex utilities, U256, Bytes32
section("Hex, U256, Bytes32")
do {
    // Hex encoding / decoding
    let decoded = try Hex.decode("0xdeadbeef")
    print("Decoded bytes:", decoded)
    let reencoded = Hex.encode(decoded)
    print("Re-encoded hex:", reencoded)

    // 256-bit unsigned integer (0x-prefixed, 64 hex chars padded)
    let one = try U256(hex: "0x1")
    print("U256(1) hex:", one.hex)

    // Fixed 32 bytes
    let zero32 = try Bytes32(bytes: [UInt8](repeating: 0, count: 32))
    print("Bytes32 zero:", zero32.hex)
} catch {
    print("Error:", error)
}

// 4) Signature parsing & normalization (no signing yet in Swift wrapper)
section("Signature Parsing & Normalization")
do {
    // Construct a compact signature (64 bytes = r||s), v defaults to 0 when parsing
    var r = [UInt8](repeating: 0x00, count: 32); r[31] = 0x01
    var s = [UInt8](repeating: 0x00, count: 32); s[31] = 0x02
    let compact = r + s

    let sig = try Signature(compact: compact)
    print("Parsed signature v:", sig.v)
    print("Is canonical (low-s):", sig.isCanonical)

    let normalized = sig.normalized()
    let out = normalized.serialize(includeV: false)
    print("Normalized compact length:", out.count)
} catch {
    print("Error:", error)
}

print("\nDone.")

// 5) ABI: Function selectors and ERC-20 transfer calldata
section("ABI: Selectors & ERC-20 Calldata")
do {
    // Compute function selector as first 4 bytes of keccak256(signature)
    func selector(_ signature: String) -> [UInt8] {
        Array(Keccak256.hash(signature).bytes.prefix(4))
    }

    // ERC-20 transfer(address,uint256)
    let sig = "transfer(address,uint256)"
    let sel = selector(sig)
    print("Selector(transfer): 0x" + Hex.encode(sel))

    // Minimal calldata: selector (4) + address (32) + amount (32)
    let recipientHex = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"
    let recipient = try Address(hex: recipientHex)
    var addrWord = [UInt8](repeating: 0, count: 32)
    let addrBytes = recipient.bytes
    addrWord.replaceSubrange(32 - addrBytes.count ..< 32, with: addrBytes)

    // amount = 1 ether (1e18)
    let amount = try U256(hex: "0x0de0b6b3a7640000")
    let calldata = sel + addrWord + amount.bytes

    print("Recipient:", recipient.checksumHex)
    print("Amount(U256):", amount.hex)
    print("Calldata(\(calldata.count) bytes): 0x" + Hex.encode(calldata))
} catch {
    print("Error:", error)
}

// 6) Events: Compute Transfer topic0 and indexed address topics
section("Event Topics: Transfer(address,address,uint256)")
do {
    let eventSig = "Transfer(address,address,uint256)"
    let topic0 = Keccak256.hash(eventSig)

    func topicAddress(_ addr: Address) -> String {
        var word = [UInt8](repeating: 0, count: 32)
        let bytes = addr.bytes
        word.replaceSubrange(32 - bytes.count ..< 32, with: bytes)
        return Hex.encode(word)
    }

    let from = try Address(hex: "0x742d35cc6632c0532925a3b8d39c0e6cfc8c74e4")
    let to = try Address(hex: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")

    print("topic0:", topic0.hex)
    print("topic1(from):", topicAddress(from))
    print("topic2(to):", topicAddress(to))
} catch {
    print("Error:", error)
}

// 7) EIP-191 personal message hash
section("EIP-191 Personal Message Hash")
do {
    let message = "Sign-In with Ethereum"
    let prefix = "\u{19}Ethereum Signed Message:\n\(message.utf8.count)"
    let data = Array(prefix.utf8) + Array(message.utf8)
    let msgHash = Keccak256.hash(data)
    print("Message:", message)
    print("Hash:", msgHash.hex)
} catch {
    print("Error:", error)
}

// 8) CREATE and CREATE2 address derivation via C API
section("CREATE/CREATE2 Address Derivation")
do {
    // Helper to create PrimitivesAddress from Swift Address
    func primitivesAddress(from addr: Address) -> PrimitivesAddress {
        var pa = PrimitivesAddress()
        withUnsafeMutableBytes(of: &pa.bytes) { dest in
            addr.bytes.withUnsafeBytes { src in dest.copyMemory(from: src) }
        }
        return pa
    }

    // CREATE (nonce-based)
    let deployer = try Address(hex: "0xa0cf798816d4b9b9866b5330eea46a18382f251e")
    var outCreate = PrimitivesAddress()
    var dep = primitivesAddress(from: deployer)
    let rc1 = withUnsafePointer(to: &dep) { depPtr in
        primitives_calculate_create_address(depPtr, 1, &outCreate)
    }
    try checkResult(rc1)
    let createAddr = try Address(bytes: withUnsafeBytes(of: outCreate.bytes) { Array($0) })
    print("CREATE (nonce=1):", createAddr.checksumHex)

    // CREATE2 (salt + init_code)
    let deployer2 = try Address(hex: "0x742d35cc6632c0532925a3b8d39c0e6cfc8c74e4")
    var dep2 = primitivesAddress(from: deployer2)
    let salt: [UInt8] = Array(repeating: 0, count: 28) + [0xca, 0xfe, 0xba, 0xbe] // 32-byte salt
    let initCode: [UInt8] = [0x60, 0x80, 0x60, 0x40, 0x52] // trivial init code

    var outCreate2 = PrimitivesAddress()
    let rc2 = salt.withUnsafeBufferPointer { sPtr in
        initCode.withUnsafeBufferPointer { iPtr in
            withUnsafePointer(to: &dep2) { dPtr in
                primitives_calculate_create2_address(dPtr, sPtr.baseAddress, iPtr.baseAddress, iPtr.count, &outCreate2)
            }
        }
    }
    try checkResult(rc2)
    let create2Addr = try Address(bytes: withUnsafeBytes(of: outCreate2.bytes) { Array($0) })
    print("CREATE2:", create2Addr.checksumHex)
} catch {
    print("Error:", error)
}
