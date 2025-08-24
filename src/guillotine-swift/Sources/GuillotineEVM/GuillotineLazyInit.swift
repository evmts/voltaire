import Foundation
import GuillotineC

/// Thread-safe lazy initialization manager for Guillotine EVM
/// This bypasses the problematic global constructor by deferring all initialization
/// until the first actual use of EVM functionality.
@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
public final class GuillotineLazyInit: @unchecked Sendable {
    
    // MARK: - Singleton Pattern
    
    public static let shared = GuillotineLazyInit()
    
    // MARK: - Thread Safety
    
    private let initLock = NSLock()
    private var _isInitialized = false
    private var _initializationError: ExecutionError?
    
    // MARK: - Private Constructor
    
    private init() {
        // Intentionally empty - no C calls during object creation
    }
    
    // MARK: - Lazy Initialization
    
    /// Ensures Guillotine is initialized, performing initialization if needed
    /// This is the ONLY place where guillotine_init() should be called
    public func ensureInitialized() throws {
        initLock.lock()
        defer { initLock.unlock() }
        
        // If already initialized successfully, return immediately
        if _isInitialized {
            return
        }
        
        // If previous initialization failed, throw the cached error
        if let error = _initializationError {
            throw error
        }
        
        // First time initialization - this is where we actually call C functions
        do {
            try performInitialization()
            _isInitialized = true
            _initializationError = nil
        } catch let error as ExecutionError {
            _initializationError = error
            throw error
        } catch {
            let executionError = ExecutionError.internalError("Initialization failed: \(error)")
            _initializationError = executionError
            throw executionError
        }
    }
    
    /// Performs the actual C library initialization
    private func performInitialization() throws {
        // Check if the C library claims to be initialized already
        // (this handles the case where global constructor might have run)
        let alreadyInitialized = guillotine_is_initialized() != 0
        
        if !alreadyInitialized {
            let result = guillotine_init()
            guard result == GUILLOTINE_OK.rawValue else {
                throw mapCErrorToExecutionError(result)
            }
        }
        
        // Verify initialization was successful
        guard guillotine_is_initialized() != 0 else {
            throw ExecutionError.internalError("Guillotine initialization verification failed")
        }
    }
    
    /// Check if Guillotine is currently initialized
    public var isInitialized: Bool {
        initLock.lock()
        defer { initLock.unlock() }
        return _isInitialized
    }
    
    /// Get version information (completely avoids C calls until needed)
    public var version: String {
        // Avoid ANY C function calls during static access
        // Return a safe default that doesn't trigger global constructor
        return "1.0.0-lazy"
    }
    
    /// Get the actual version from C library (only call after ensureInitialized)
    public func getCVersion() -> String {
        guard let versionPtr = guillotine_version() else {
            return "unknown"
        }
        return String(cString: versionPtr)
    }
    
    /// Force reset initialization state (for testing)
    internal func resetForTesting() {
        initLock.lock()
        defer { initLock.unlock() }
        _isInitialized = false
        _initializationError = nil
    }
}

// MARK: - Error Mapping

private func mapCErrorToExecutionError(_ errorCode: Int32) -> ExecutionError {
    switch errorCode {
    case Int32(GUILLOTINE_ERROR_MEMORY.rawValue):
        return .outOfMemory
    case Int32(GUILLOTINE_ERROR_INVALID_PARAM.rawValue):
        return .invalidTransaction("Invalid parameter")
    case Int32(GUILLOTINE_ERROR_VM_NOT_INITIALIZED.rawValue):
        return .internalError("VM not initialized")
    case Int32(GUILLOTINE_ERROR_EXECUTION_FAILED.rawValue):
        return .internalError("Execution failed")
    case Int32(GUILLOTINE_ERROR_INVALID_ADDRESS.rawValue):
        return .invalidTransaction("Invalid address")
    case Int32(GUILLOTINE_ERROR_INVALID_BYTECODE.rawValue):
        return .invalidTransaction("Invalid bytecode")
    default:
        return .internalError("Unknown error code: \(errorCode)")
    }
}