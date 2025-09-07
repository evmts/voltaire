import Foundation

/// Dynamic loader for Guillotine C library
/// This avoids the global constructor hang by loading the library only when needed
/// using dlopen/dlsym instead of static linking
@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
public final class GuillotineDynamicLoader: @unchecked Sendable {
    
    // MARK: - Singleton Pattern
    
    public static let shared = GuillotineDynamicLoader()
    
    // MARK: - Dynamic Loading State
    
    private let loadLock = NSLock()
    private var libraryHandle: UnsafeMutableRawPointer?
    private var isLoaded = false
    private var loadError: Error?
    
    // MARK: - Function Pointers
    
    private var guillotine_version_ptr: (@convention(c) () -> UnsafePointer<CChar>?)?
    private var guillotine_is_initialized_ptr: (@convention(c) () -> Int32)?
    private var guillotine_init_ptr: (@convention(c) () -> Int32)?
    private var guillotine_deinit_ptr: (@convention(c) () -> Void)?
    private var guillotine_vm_create_ptr: (@convention(c) () -> UnsafeMutableRawPointer?)?
    private var guillotine_vm_destroy_ptr: (@convention(c) (UnsafeMutableRawPointer?) -> Void)?
    
    // MARK: - Private Constructor
    
    private init() {
        // Intentionally empty - no dynamic loading during object creation
    }
    
    // MARK: - Dynamic Loading
    
    /// Load the Guillotine library dynamically to avoid global constructor
    public func ensureLoaded() throws {
        loadLock.lock()
        defer { loadLock.unlock() }
        
        // If already loaded successfully, return immediately
        if isLoaded {
            return
        }
        
        // If previous loading failed, throw the cached error
        if let error = loadError {
            throw error
        }
        
        // Attempt dynamic loading
        do {
            try performDynamicLoading()
            isLoaded = true
            loadError = nil
        } catch {
            loadError = error
            throw error
        }
    }
    
    /// Performs the actual dynamic loading of the library
    private func performDynamicLoading() throws {
        // Determine library path
        let libraryPath = "../../zig-out/lib/libGuillotine.dylib"
        
        // Load the library with RTLD_LAZY to avoid immediate symbol resolution
        guard let handle = dlopen(libraryPath, RTLD_LAZY | RTLD_LOCAL) else {
            let error = String(cString: dlerror())
            throw ExecutionError.internalError("Failed to load Guillotine library: \(error)")
        }
        
        libraryHandle = handle
        
        // Load function symbols
        try loadFunctionSymbols(from: handle)
    }
    
    /// Load all required function symbols from the library
    private func loadFunctionSymbols(from handle: UnsafeMutableRawPointer) throws {
        // Load guillotine_version
        guard let versionSym = dlsym(handle, "guillotine_version") else {
            throw ExecutionError.internalError("Failed to load guillotine_version symbol")
        }
        guillotine_version_ptr = unsafeBitCast(versionSym, to: (@convention(c) () -> UnsafePointer<CChar>?).self)
        
        // Load guillotine_is_initialized
        guard let isInitSym = dlsym(handle, "guillotine_is_initialized") else {
            throw ExecutionError.internalError("Failed to load guillotine_is_initialized symbol")
        }
        guillotine_is_initialized_ptr = unsafeBitCast(isInitSym, to: (@convention(c) () -> Int32).self)
        
        // Load guillotine_init
        guard let initSym = dlsym(handle, "guillotine_init") else {
            throw ExecutionError.internalError("Failed to load guillotine_init symbol")
        }
        guillotine_init_ptr = unsafeBitCast(initSym, to: (@convention(c) () -> Int32).self)
        
        // Load guillotine_deinit
        guard let deinitSym = dlsym(handle, "guillotine_deinit") else {
            throw ExecutionError.internalError("Failed to load guillotine_deinit symbol")
        }
        guillotine_deinit_ptr = unsafeBitCast(deinitSym, to: (@convention(c) () -> Void).self)
        
        // Load guillotine_vm_create
        guard let vmCreateSym = dlsym(handle, "guillotine_vm_create") else {
            throw ExecutionError.internalError("Failed to load guillotine_vm_create symbol")
        }
        guillotine_vm_create_ptr = unsafeBitCast(vmCreateSym, to: (@convention(c) () -> UnsafeMutableRawPointer?).self)
        
        // Load guillotine_vm_destroy
        guard let vmDestroySym = dlsym(handle, "guillotine_vm_destroy") else {
            throw ExecutionError.internalError("Failed to load guillotine_vm_destroy symbol")
        }
        guillotine_vm_destroy_ptr = unsafeBitCast(vmDestroySym, to: (@convention(c) (UnsafeMutableRawPointer?) -> Void).self)
    }
    
    // MARK: - Safe Function Wrappers
    
    /// Get version string safely
    public func getVersion() throws -> String {
        try ensureLoaded()
        guard let versionFunc = guillotine_version_ptr,
              let versionPtr = versionFunc() else {
            return "unknown"
        }
        return String(cString: versionPtr)
    }
    
    /// Check initialization status safely
    public func isInitialized() throws -> Bool {
        try ensureLoaded()
        guard let isInitFunc = guillotine_is_initialized_ptr else {
            throw ExecutionError.internalError("guillotine_is_initialized not loaded")
        }
        return isInitFunc() != 0
    }
    
    /// Initialize Guillotine safely
    public func initialize() throws -> Int32 {
        try ensureLoaded()
        guard let initFunc = guillotine_init_ptr else {
            throw ExecutionError.internalError("guillotine_init not loaded")
        }
        return initFunc()
    }
    
    /// Deinitialize Guillotine safely
    public func deinitialize() throws {
        try ensureLoaded()
        guard let deinitFunc = guillotine_deinit_ptr else {
            throw ExecutionError.internalError("guillotine_deinit not loaded")
        }
        deinitFunc()
    }
    
    /// Create VM safely
    public func createVM() throws -> UnsafeMutableRawPointer? {
        try ensureLoaded()
        guard let createFunc = guillotine_vm_create_ptr else {
            throw ExecutionError.internalError("guillotine_vm_create not loaded")
        }
        return createFunc()
    }
    
    /// Destroy VM safely
    public func destroyVM(_ vm: UnsafeMutableRawPointer) throws {
        try ensureLoaded()
        guard let destroyFunc = guillotine_vm_destroy_ptr else {
            throw ExecutionError.internalError("guillotine_vm_destroy not loaded")
        }
        destroyFunc(vm)
    }
    
    /// Check if library is loaded
    public var loaded: Bool {
        loadLock.lock()
        defer { loadLock.unlock() }
        return isLoaded
    }
    
    // MARK: - Cleanup
    
    deinit {
        if let handle = libraryHandle {
            dlclose(handle)
        }
    }
}