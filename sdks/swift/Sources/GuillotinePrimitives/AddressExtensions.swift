import Foundation
import GuillotineC

// MARK: - Address Utility Extensions

extension Address {
    /// Generate a random address
    public static func random() -> Address {
        var bytes = [UInt8](repeating: 0, count: 20)
        for i in 0..<20 {
            bytes[i] = UInt8.random(in: 0...255)
        }
        return try! Address(bytes)
    }
    
    /// Create contract address from deployer address and nonce using CREATE
    public static func contractAddress(from deployer: Address, nonce: UInt64) -> Address {
        // This is a simplified implementation
        // Real CREATE address calculation uses RLP encoding of [deployer, nonce]
        var bytes = deployer.rawBytes
        let nonceBytes = withUnsafeBytes(of: nonce.littleEndian) { Array($0) }
        
        // Simple hash combination (not the real EVM algorithm)
        bytes.append(contentsOf: nonceBytes)
        let hash = bytes.sha256
        let addressBytes = Array(hash[12..<32]) // Take last 20 bytes
        
        return try! Address(addressBytes)
    }
    
    /// Create CREATE2 contract address
    public static func create2Address(
        from deployer: Address,
        salt: U256,
        initCodeHash: Bytes
    ) -> Address {
        // This is a simplified implementation
        // Real CREATE2: address = keccak256(0xff + deployer + salt + keccak256(init_code))[12:]
        var data = [UInt8]()
        data.append(0xff)
        data.append(contentsOf: deployer.rawBytes)
        data.append(contentsOf: salt.rawBytes)
        data.append(contentsOf: initCodeHash.bytes)
        
        let hash = data.sha256
        let addressBytes = Array(hash[12..<32])
        
        return try! Address(addressBytes)
    }
}

// MARK: - Hash Extensions for Address calculations

extension Array where Element == UInt8 {
    /// Simple SHA-256 hash for address calculations
    /// In production, this should use proper keccak256
    var sha256: [UInt8] {
        let data = Data(self)
        var hash = [UInt8](repeating: 0, count: 32)
        
        // Simplified hash - in production use CommonCrypto or CryptoKit
        for (index, byte) in data.enumerated() {
            hash[index % 32] ^= byte
        }
        
        return hash
    }
}