# Tracer

Configurable execution tracing for debugging, analysis, and perf monitoring.

## Overview

Multiple tracer implementations are available and selected at compile time for zero‑overhead when disabled:
- `DefaultTracer` — production default, compiled away
- `DebuggingTracer` — step snapshots and breakpoints
- `LoggingTracer` — structured logs to stdout
- `FileTracer` — high‑throughput JSON/binary file writer

## Components and Architecture

### Core Implementation
- **`tracer.zig`** - Complete tracing system with multiple tracer implementations

### Tracer Types

#### DefaultTracer
- **Zero Runtime Overhead**: Compile-time elimination of all tracing code
- **Production Default**: Optimal for production deployments
- **Interface Compliance**: Satisfies tracer interface without any operations

#### DebuggingTracer
- **Step-by-Step Execution**: Detailed opcode-level execution tracking
- **Breakpoint Support**: Conditional execution pausing and inspection
- **State Inspection**: Complete EVM state capture at each step
- **Interactive Debugging**: Integration with debugging tools and IDEs

#### LoggingTracer
- **Structured Output**: JSON-formatted execution logs
- **Configurable Verbosity**: Multiple logging levels and detail options
- **Real-time Streaming**: Live execution monitoring via stdout
- **Performance Metrics**: Gas usage, timing, and performance statistics

#### FileTracer
- **High-Performance File Output**: Optimized binary and text file formats
- **Batch Processing**: Efficient buffered writes for minimal I/O overhead
- **Compression Support**: Optional compression for reduced storage requirements
- **Structured Formats**: JSON, CSV, and binary output options

## Key Features

### Compile-Time Configuration
- **Zero-Cost Abstractions**: Tracer selection at compile time eliminates runtime overhead
- **Type Safety**: Compile-time verification of tracer interfaces and capabilities
- **Optimization**: Dead code elimination for unused tracer functionality
- **Conditional Compilation**: Feature flags for enabling/disabling tracing subsystems

### Execution Tracking
- **Opcode-Level Monitoring**: Every EVM instruction execution captured
- **State Transitions**: Before/after state snapshots for each operation
- **Gas Accounting**: Detailed gas consumption tracking and analysis
- **Error Handling**: Exception and error condition capture and reporting

### Performance Monitoring
- **Execution Timing**: High-resolution timing for performance analysis
- **Memory Usage**: Stack and memory allocation tracking
- **Resource Utilization**: CPU, memory, and I/O resource monitoring
- **Bottleneck Identification**: Hot path analysis and optimization insights

## Integration Points

### EVM Core
- **Frame Integration**: Deep integration with EVM execution frame
- **Opcode Dispatch**: Tracing hooks in opcode dispatch system
- **State Access**: Direct access to EVM stack, memory, and storage
- **Error Propagation**: Seamless integration with EVM error handling

### Host Interface
- **External Calls**: Tracing of host function invocations
- **State Queries**: Database and storage access tracing
- **Event Emission**: Contract event and log generation tracking
- **Precompile Execution**: Tracing of precompiled contract operations

### Testing Framework
- **Test Execution**: Comprehensive test execution tracing
- **Differential Analysis**: Comparison with reference implementations
- **Regression Detection**: Automated detection of behavior changes
- **Coverage Analysis**: Code coverage and execution path analysis

## Usage Examples

### Basic Configuration
```zig
const tracer = @import("tracer");
const evm = @import("evm");

const EvmProd = evm.Evm(tracer.DefaultTracer);
const EvmDebug = evm.Evm(tracer.LoggingTracer);

var prod = EvmProd.init(allocator, host);
var dbg = EvmDebug.init(allocator, host);
```

### Debugging Tracer Usage
```zig
// Initialize debugging tracer with breakpoints
var debug_tracer = tracer.DebuggingTracer.init(allocator);
defer debug_tracer.deinit();

// Set breakpoints
try debug_tracer.set_breakpoint(.{ .pc = 0x42 });
try debug_tracer.set_breakpoint(.{ .opcode = .SSTORE });
try debug_tracer.set_breakpoint(.{ .gas_remaining = 1000 });

// Configure debugging options
debug_tracer.set_options(.{
    .capture_stack = true,
    .capture_memory = true,
    .capture_storage = false,
    .max_steps = 10000,
});

// Execute with debugging
const result = try debug_evm.execute(bytecode);

// Analyze execution steps
for (debug_tracer.steps.items) |step| {
    std.debug.print("Step {}: {} at PC {} (gas: {})\n", .{
        step.step_number,
        step.opcode_name,
        step.pc,
        step.gas_before,
    });
    
    if (step.error_occurred) {
        std.debug.print("Error: {s}\n", .{step.error_msg.?});
        break;
    }
}
```

### Logging Tracer
```zig
// Configure logging tracer
var logging_tracer = tracer.LoggingTracer.init(allocator);
defer logging_tracer.deinit();

logging_tracer.set_options(.{
    .log_level = .DEBUG,
    .include_stack = true,
    .include_memory = false,
    .include_storage = true,
    .output_format = .JSON,
});

// Execute with logging
const LoggingEvm = evm.Evm(tracer.LoggingTracer);
var logging_evm = LoggingEvm.init(allocator, host);
defer logging_evm.deinit();

const result = try logging_evm.execute(bytecode);

// Logs are automatically written to stdout in JSON format
```

### File Tracer
```zig
// Configure file tracer for batch processing
var file_tracer = try tracer.FileTracer.init(
    allocator,
    "/tmp/execution_trace.json"
);
defer file_tracer.deinit();

file_tracer.set_options(.{
    .format = .JSON,
    .compression = .GZIP,
    .buffer_size = 64 * 1024, // 64KB buffer
    .flush_frequency = 1000,   // Flush every 1000 steps
});

// Execute with file tracing
const FileEvm = evm.Evm(tracer.FileTracer);
var file_evm = FileEvm.init(allocator, host);
defer file_evm.deinit();

const result = try file_evm.execute(bytecode);

// Trace data is automatically written to file
// Can be processed later with external tools
```

### Custom Tracer Implementation
```zig
// Implement custom tracer following the interface
const CustomTracer = struct {
    const Self = @This();
    
    steps: std.ArrayList(ExecutionStep),
    custom_data: std.HashMap(u32, CustomData),
    
    pub fn init(allocator: std.mem.Allocator) Self {
        return Self{
            .steps = std.ArrayList(ExecutionStep).init(allocator),
            .custom_data = std.HashMap(u32, CustomData).init(allocator),
        };
    }
    
    pub fn deinit(self: *Self) void {
        self.steps.deinit();
        self.custom_data.deinit();
    }
    
    pub fn trace_step(
        self: *Self,
        pc: u32,
        opcode: u8,
        gas_before: i32,
        stack: []const u256,
        memory: []const u8,
    ) !void {
        // Custom tracing logic
        const step = ExecutionStep{
            .pc = pc,
            .opcode = opcode,
            .gas_before = gas_before,
            .custom_metric = self.calculate_custom_metric(opcode),
        };
        
        try self.steps.append(step);
        try self.custom_data.put(pc, CustomData{ .timestamp = std.time.nanoTimestamp() });
    }
    
    fn calculate_custom_metric(self: *Self, opcode: u8) f64 {
        // Custom analysis logic
        return @floatFromInt(opcode) * 1.5;
    }
};

// Use custom tracer
const CustomEvm = evm.Evm(CustomTracer);
```

## Performance Characteristics

### DefaultTracer Performance
- **Zero Runtime Cost**: Complete compile-time elimination
- **No Memory Overhead**: No additional memory allocation
- **No CPU Overhead**: No additional CPU cycles consumed
- **Identical Performance**: Same performance as non-traced execution

### Debugging Tracer Performance
- **Development Optimized**: Acceptable overhead for development use
- **Memory Usage**: Proportional to execution length
- **CPU Overhead**: ~20-50% depending on capture options
- **Storage Requirements**: Detailed state capture increases memory usage

### Logging Tracer Performance
- **Streaming Optimized**: Minimal memory footprint with continuous output
- **I/O Bound**: Performance limited by output stream speed
- **CPU Overhead**: ~10-30% for formatting and output
- **Configurable Impact**: Adjustable verbosity for performance tuning

### File Tracer Performance
- **High Throughput**: Optimized for minimal execution impact
- **Buffered I/O**: Reduces file system overhead through batching
- **Compression Support**: Optional compression reduces storage requirements
- **CPU Overhead**: ~5-15% depending on format and compression options

## Configuration Options

### Tracer Selection
```zig
// Compile-time tracer selection
const Config = struct {
    tracer_type: type = if (builtin.mode == .Debug) 
        tracer.DebuggingTracer 
    else 
        tracer.DefaultTracer,
    
    // Other EVM configuration options
    enable_precompiles: bool = true,
    max_call_depth: u32 = 1024,
};
```

### Runtime Configuration
```zig
// Debugging tracer options
const DebugOptions = struct {
    capture_stack: bool = true,
    capture_memory: bool = false,
    capture_storage: bool = true,
    max_steps: ?u32 = null,
    breakpoints: []const Breakpoint = &[_]Breakpoint{},
    step_limit: ?u32 = null,
};

// Logging tracer options
const LoggingOptions = struct {
    log_level: LogLevel = .INFO,
    output_format: OutputFormat = .JSON,
    include_stack: bool = false,
    include_memory: bool = false,
    include_storage: bool = true,
    timestamp: bool = true,
};

// File tracer options
const FileOptions = struct {
    format: FileFormat = .JSON,
    compression: ?CompressionType = null,
    buffer_size: usize = 32 * 1024,
    flush_frequency: u32 = 500,
    max_file_size: ?u64 = null,
    file_rotation: bool = false,
};
```

## Analysis and Post-Processing

### Trace Analysis Tools
```zig
// Analyze execution trace for performance bottlenecks
const analyzer = tracer.TraceAnalyzer.init(allocator);
defer analyzer.deinit();

try analyzer.load_trace("execution_trace.json");

// Performance analysis
const hot_spots = try analyzer.find_hot_spots();
const gas_analysis = try analyzer.analyze_gas_usage();
const memory_patterns = try analyzer.analyze_memory_patterns();

// Generate reports
try analyzer.generate_report("performance_report.html");
```

### Differential Analysis
```zig
// Compare execution traces between implementations
const differ = tracer.TraceDiffer.init(allocator);
defer differ.deinit();

const differences = try differ.compare_traces(
    "guillotine_trace.json",
    "reference_trace.json"
);

for (differences) |diff| {
    std.debug.print("Difference at step {}: {} vs {}\n", .{
        diff.step_number, diff.guillotine_value, diff.reference_value
    });
}
```

## Testing Integration

### Unit Testing with Tracing
```zig
test "EVM execution with tracing" {
    var debug_tracer = tracer.DebuggingTracer.init(std.testing.allocator);
    defer debug_tracer.deinit();
    
    const DebugEvm = evm.Evm(tracer.DebuggingTracer);
    var debug_evm = DebugEvm.init(std.testing.allocator, test_host);
    defer debug_evm.deinit();
    
    const bytecode = &[_]u8{ 0x60, 0x01, 0x60, 0x02, 0x01 }; // PUSH1 1 PUSH1 2 ADD
    const result = try debug_evm.execute(bytecode);
    
    try std.testing.expect(result.success);
    try std.testing.expect(debug_tracer.steps.items.len == 3);
    
    const final_step = debug_tracer.steps.items[2];
    try std.testing.expect(final_step.opcode == 0x01); // ADD opcode
}
```

### Regression Testing
```zig
test "execution trace consistency" {
    // Execute same bytecode with different configurations
    const traces = try execute_with_all_tracers(test_bytecode);
    defer deinit_traces(traces);
    
    // Verify consistent execution results
    const reference_result = traces.noop_result;
    try std.testing.expect(std.meta.eql(reference_result, traces.debug_result));
    try std.testing.expect(std.meta.eql(reference_result, traces.logging_result));
}
```

The tracer module provides a powerful, flexible foundation for EVM execution analysis, debugging, and performance optimization while maintaining zero overhead in production deployments through compile-time configuration.
