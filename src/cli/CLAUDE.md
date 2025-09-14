# CLAUDE.md - CLI Module AI Context

## MISSION CRITICAL: User Interface Safety and Security

The CLI module provides the primary user interface for Guillotine. **ANY vulnerability in CLI parsing or execution can enable attacks or system compromise.** Command-line interfaces must validate all inputs rigorously and handle errors gracefully.

## Critical Implementation Details

### Command-Line Security
- **Input Validation**: Sanitize all user-provided arguments and files
- **Path Traversal Prevention**: Validate file paths to prevent directory traversal
- **Resource Limits**: Enforce reasonable limits on file sizes and execution time
- **Privilege Management**: Run with minimal required privileges
- **Error Handling**: Never expose sensitive system information in error messages

### Key Responsibilities
- **EVM Execution Interface**: Safe execution of user-provided bytecode
- **File Operations**: Secure reading/writing of bytecode and configuration files
- **Network Interface**: Safe communication with external blockchain nodes
- **Debugging Tools**: Provide debugging capabilities without security risks
- **Configuration Management**: Secure handling of configuration data

### Critical Safety Patterns

#### Input Validation
```zig
// CRITICAL: Validate all file paths
fn validate_file_path(path: []const u8) ![]const u8 {
    // Prevent directory traversal
    if (std.mem.indexOf(u8, path, "..") != null) {
        return CliError.InvalidPath;
    }

    // Ensure path is within allowed directories
    if (!is_safe_path(path)) {
        return CliError.ForbiddenPath;
    }

    return path;
}

// CRITICAL: Limit file sizes
fn read_bytecode_file(path: []const u8) ![]u8 {
    const MAX_BYTECODE_SIZE = 1024 * 1024; // 1MB limit

    const file = std.fs.cwd().openFile(path, .{}) catch |err| switch (err) {
        error.FileNotFound => return CliError.FileNotFound,
        error.AccessDenied => return CliError.AccessDenied,
        else => return CliError.FileError,
    };
    defer file.close();

    const file_size = try file.getEndPos();
    if (file_size > MAX_BYTECODE_SIZE) {
        return CliError.FileTooLarge;
    }

    return try file.readToEndAlloc(allocator, file_size);
}
```

#### Execution Safety
```zig
// CRITICAL: Sandbox EVM execution
fn execute_user_bytecode(bytecode: []const u8, args: ExecutionArgs) !ExecutionResult {
    // Validate bytecode before execution
    try validate_bytecode(bytecode);

    // Set resource limits
    const config = EvmConfig{
        .gas_limit = @min(args.gas_limit, MAX_ALLOWED_GAS),
        .memory_limit = MAX_ALLOWED_MEMORY,
        .call_depth_limit = MAX_CALL_DEPTH,
        .execution_timeout = EXECUTION_TIMEOUT,
    };

    // Execute in controlled environment
    const result = try evm.execute(bytecode, config) catch |err| switch (err) {
        error.OutOfGas => return CliError.GasExhausted,
        error.OutOfMemory => return CliError.MemoryExhausted,
        error.InvalidOpcode => return CliError.InvalidBytecode,
        else => return CliError.ExecutionFailed,
    };

    return result;
}
```

### Command Structure Safety
```zig
const CliCommand = enum {
    run,
    trace,
    debug,
    analyze,
    test,
    help,
    version,

    // Parse command safely
    pub fn parse(arg: []const u8) !CliCommand {
        // Use string map for safe parsing
        const command_map = std.ComptimeStringMap(CliCommand, .{
            .{ "run", .run },
            .{ "trace", .trace },
            .{ "debug", .debug },
            .{ "analyze", .analyze },
            .{ "test", .test },
            .{ "help", .help },
            .{ "version", .version },
        });

        return command_map.get(arg) orelse CliError.UnknownCommand;
    }
};
```

### Error Handling (CRITICAL)
```zig
// NEVER expose sensitive information in error messages
fn handle_execution_error(err: anyerror) void {
    switch (err) {
        CliError.FileNotFound => {
            std.debug.print("Error: File not found\n", .{});
        },
        CliError.InvalidBytecode => {
            std.debug.print("Error: Invalid bytecode format\n", .{});
        },
        CliError.GasExhausted => {
            std.debug.print("Error: Execution ran out of gas\n", .{});
        },
        CliError.AccessDenied => {
            std.debug.print("Error: Permission denied\n", .{});
        },
        else => {
            // Generic error message - never expose internal details
            std.debug.print("Error: Operation failed\n", .{});
            log.err("Internal CLI error: {}", .{err});
        },
    }
}
```

### Configuration Security
```zig
// CRITICAL: Validate all configuration values
const CliConfig = struct {
    max_gas_limit: u64,
    max_memory_mb: u64,
    execution_timeout_ms: u64,
    allowed_directories: []const []const u8,
    debug_mode: bool,

    pub fn validate(self: *const CliConfig) !void {
        if (self.max_gas_limit > ABSOLUTE_MAX_GAS) {
            return CliError.InvalidConfig;
        }

        if (self.max_memory_mb > ABSOLUTE_MAX_MEMORY_MB) {
            return CliError.InvalidConfig;
        }

        if (self.execution_timeout_ms > MAX_TIMEOUT_MS) {
            return CliError.InvalidConfig;
        }

        // Validate allowed directories exist and are accessible
        for (self.allowed_directories) |dir| {
            std.fs.cwd().access(dir, .{}) catch {
                return CliError.InvalidDirectory;
            };
        }
    }
};
```

### Resource Management
```zig
// CRITICAL: Prevent resource exhaustion
const ResourceLimits = struct {
    const MAX_ALLOWED_GAS = 50_000_000;           // 50M gas max
    const MAX_ALLOWED_MEMORY = 256 * 1024 * 1024; // 256MB memory max
    const MAX_CALL_DEPTH = 1024;                  // EVM standard
    const EXECUTION_TIMEOUT = 30 * 1000;          // 30 second timeout
    const MAX_FILE_SIZE = 10 * 1024 * 1024;      // 10MB file max
    const MAX_OUTPUT_SIZE = 1024 * 1024;          // 1MB output max
};

fn enforce_resource_limits() !void {
    // Set process limits if supported
    if (builtin.target.os.tag != .wasm32) {
        try set_memory_limit(ResourceLimits.MAX_ALLOWED_MEMORY);
        try set_cpu_time_limit(ResourceLimits.EXECUTION_TIMEOUT / 1000);
    }
}
```

### Testing and Validation
- **Input Fuzzing**: Test CLI with malformed and edge-case inputs
- **Path Traversal Tests**: Verify directory traversal prevention
- **Resource Limit Tests**: Validate all resource limits are enforced
- **Error Handling Tests**: Ensure errors don't leak sensitive information
- **Security Audit**: Regular security review of CLI code

### Logging and Monitoring
```zig
// Log all security-relevant events
fn log_security_event(event_type: SecurityEventType, details: []const u8) void {
    log.warn("CLI Security Event: type={s}, details={s}", .{ @tagName(event_type), details });

    // In production, also send to security monitoring system
    if (comptime is_production()) {
        security_monitor.report_event(event_type, details);
    }
}
```

### Emergency Procedures
- **Security Incident**: Isolate and analyze any security breaches
- **Resource Exhaustion**: Detect and handle resource exhaustion gracefully
- **Input Validation Bypass**: Investigate and patch validation bypasses
- **Privilege Escalation**: Monitor for unauthorized privilege usage
- **Data Exposure**: Audit and prevent sensitive data leakage

Remember: **The CLI is the primary attack surface for user interactions.** All user inputs are potentially malicious and must be validated rigorously. Never trust user input and always fail securely.