import Foundation
import GuillotineC
import GuillotinePrimitives

// Test if async main works without GuillotineEVM

@main
struct BasicTest {
    static func main() {
        print("🎯 SUCCESS: Reached main() with Foundation + GuillotineC + GuillotinePrimitives!")
        print("✅ GuillotineC import successful!")
        print("✅ GuillotinePrimitives import successful!")
        print("📋 Version: \(String(cString: guillotine_version()!))")
        print("🔄 Initialized: \(guillotine_is_initialized() != 0)")
        
        // Test primitives
        let address: Address = "0x1234567890123456789012345678901234567890"
        let value = U256.ether(1.0) 
        let bytes: Bytes = [0x60, 0x42]
        
        print("🏠 Address: \(address)")
        print("💰 Value: \(value)")
        print("📦 Bytes: \(bytes)")
        
        print("🧪 Testing manual C calls...")
        
        // Test the initialization status
        print("🔍 Library initialized status: \(guillotine_is_initialized() != 0)")
        
        // Test manual init logic
        if guillotine_is_initialized() == 0 {
            print("📋 Library not initialized, calling guillotine_init()...")
            let result = guillotine_init()
            print("📊 Init result: \(result)")
        } else {
            print("✅ Library already initialized, skipping guillotine_init()")
        }
        
        print("🔍 After check - Library initialized: \(guillotine_is_initialized() != 0)")
        
        print("🧪 Testing VM creation...")
        if let vm = guillotine_vm_create() {
            print("✅ VM created successfully!")
            guillotine_vm_destroy(vm) 
            print("✅ VM destroyed successfully!")
        } else {
            print("❌ VM creation failed")
        }
        
        print("🚀 Async main test completed successfully!")
    }
}