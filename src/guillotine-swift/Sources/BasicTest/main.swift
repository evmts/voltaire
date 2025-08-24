import Foundation
import GuillotineC
import GuillotinePrimitives
import GuillotineEVM  // This import might cause the hang

@main
struct BasicTest {
    static func main() {
        print("🎯 SUCCESS: Reached main() with GuillotineC + GuillotinePrimitives + GuillotineEVM")
        
        // Test C functions
        print("📋 Version: \(String(cString: guillotine_version()!))")
        
        // Test primitives
        let address: Address = "0x1234567890123456789012345678901234567890"
        let value = U256.ether(1.0)
        let bytes: Bytes = [0x60, 0x42]
        
        print("🏠 Address: \(address)")
        print("💰 Value: \(value)")
        print("📦 Bytes: \(bytes)")
        
        print("✅ GuillotineC + GuillotinePrimitives + GuillotineEVM import work!")
        print("🧪 Now testing thread-safe EVM class instantiation...")
        
        // Test thread-safe EVM class
        do {
            let evm = try GuillotineEVMThreadSafe()
            print("✅ GuillotineEVMThreadSafe instantiation successful!")
            print("📋 EVM Version: \(GuillotineEVMThreadSafe.version)")
            print("🔄 EVM Initialized: \(GuillotineEVMThreadSafe.isInitialized)")
        } catch {
            print("❌ GuillotineEVMThreadSafe instantiation failed: \(error)")
        }
    }
}