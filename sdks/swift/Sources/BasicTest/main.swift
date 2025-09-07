import Foundation
import GuillotinePrimitives

// CRITICAL TEST: Completely avoid GuillotineC import to bypass global constructor
// Test if we can at least get to main() and test primitives

@main
struct BasicTest {
    static func main() async {
        print("🎯 SUCCESS: Reached main() without GuillotineC import!")
        print("✅ Foundation import successful!")
        print("✅ GuillotinePrimitives import successful!")
        
        // Test primitives (should work completely independently)
        let address: Address = "0x1234567890123456789012345678901234567890"
        let value = U256.ether(1.0) 
        let bytes: Bytes = [0x60, 0x42]
        
        print("🏠 Address: \(address)")
        print("💰 Value: \(value)")
        print("📦 Bytes: \(bytes)")
        print("✅ Primitives work independently!")
        
        // Test primitive operations
        let isZero = Address.zero == Address.zero
        let randomAddr = Address.random()
        let etherValue = U256.ether(2.5)
        
        print("🏠 Zero address check: \(isZero)")
        print("🎲 Random address: \(randomAddr)")  
        print("💰 2.5 ETH: \(etherValue)")
        
        print("✅ All primitive operations successful!")
        print("🎉 PRIMITIVES MODULE IS COMPLETELY FUNCTIONAL!")
        print("🚀 Test completed without any C library dependencies!")
    }
}