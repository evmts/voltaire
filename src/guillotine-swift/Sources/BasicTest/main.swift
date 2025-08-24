import Foundation
import GuillotineC
import GuillotineEVM

@main
struct BasicTest {
    static func main() {
        print("🔬 Step-by-step debugging...")
        
        // Step 1: Test basic C functions
        print("Step 1: Testing guillotine_version()...")
        let version = String(cString: guillotine_version()!)
        print("✅ Version: \(version)")
        
        print("Step 2: Testing guillotine_is_initialized()...")
        let isInit = guillotine_is_initialized()
        print("✅ Is initialized: \(isInit)")
        
        // Step 3: Test thread-safe creation (this might hang)
        print("Step 3: Creating GuillotineEVMThreadSafe...")
        do {
            let evm = try GuillotineEVMThreadSafe()
            print("✅ Thread-safe EVM created successfully!")
            
            // Step 4: Test static methods
            print("Step 4: Testing static methods...")
            print("  Version: \(GuillotineEVMThreadSafe.version)")
            print("  Initialized: \(GuillotineEVMThreadSafe.isInitialized)")
            print("✅ Static methods work!")
            
            print("\n🎉 SUCCESS: Thread-safe implementation works!")
            
        } catch {
            print("❌ Failed at GuillotineEVMThreadSafe creation: \(error)")
        }
        
        print("🏁 Test completed without hanging!")
    }
}