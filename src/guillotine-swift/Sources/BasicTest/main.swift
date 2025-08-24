import Foundation
import GuillotineC

@main
struct BasicTest {
    static func main() {
        print("🔬 Minimal C function test...")
        
        print("Step 1: About to call guillotine_version()")
        let versionPtr = guillotine_version()
        print("Step 2: Got version pointer: \(String(describing: versionPtr))")
        
        if let versionPtr = versionPtr {
            let version = String(cString: versionPtr)
            print("Step 3: Converted to string: \(version)")
            print("✅ guillotine_version() works!")
        } else {
            print("❌ guillotine_version() returned nil!")
            
            // Let's try the init/is_initialized pattern
            print("Step 4: Trying guillotine_init()")
            let initResult = guillotine_init()
            print("Step 5: Init result: \(initResult)")
            
            print("Step 6: Trying guillotine_is_initialized()")
            let isInit = guillotine_is_initialized()
            print("Step 7: Is initialized: \(isInit)")
            
            // Try version again
            print("Step 8: Trying guillotine_version() again")
            let versionPtr2 = guillotine_version()
            print("Step 9: Got version pointer 2: \(String(describing: versionPtr2))")
            
            if let versionPtr2 = versionPtr2 {
                let version = String(cString: versionPtr2)
                print("Step 10: Version after init: \(version)")
                print("✅ guillotine_version() works after init!")
            } else {
                print("❌ guillotine_version() still returns nil after init!")
            }
        }
        
        print("🏁 Test completed")
    }
}