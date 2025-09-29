const std = @import("std");
const builtin = @import("builtin");

// Configuration options (can be overridden via environment variables)
const Config = struct {
    verbose: bool = false,
    fail_fast: bool = false,
    show_timing: bool = true,
    show_leaks: bool = true,
    filter: ?[]const u8 = null,
    colors: bool = true,
    quiet: bool = false,
    show_slowest: usize = 5,
};

// Test runner state
const TestRunner = struct {
    allocator: std.mem.Allocator,
    config: Config,
    stdout: std.fs.File,
    stderr: std.fs.File,
    stdout_buf: [4096]u8 = undefined,
    stderr_buf: [4096]u8 = undefined,
    // Statistics
    total_tests: usize = 0,
    passed: usize = 0,
    failed: usize = 0,
    skipped: usize = 0,
    leaked: usize = 0,
    // Timing
    timer: std.time.Timer,
    total_time: u64 = 0,
    slowest_tests: std.ArrayList(TestTiming),
    // Current test tracking
    current_test: ?[]const u8 = null,
    current_test_start: u64 = 0,

    const TestTiming = struct {
        name: []const u8,
        duration_ns: u64,
    };

    const Color = struct {
        const reset = "\x1b[0m";
        const bold = "\x1b[1m";
        const dim = "\x1b[2m";
        const red = "\x1b[31m";
        const green = "\x1b[32m";
        const yellow = "\x1b[33m";
        const blue = "\x1b[34m";
        const cyan = "\x1b[36m";
        const gray = "\x1b[90m";
    };

    pub fn init(allocator: std.mem.Allocator) !TestRunner {
        var config = Config{};
        
        // Read configuration from environment variables
        if (std.process.getEnvVarOwned(allocator, "TEST_VERBOSE")) |val| {
            defer allocator.free(val);
            config.verbose = std.mem.eql(u8, val, "1") or std.mem.eql(u8, val, "true");
        } else |_| {}
        
        if (std.process.getEnvVarOwned(allocator, "TEST_FAIL_FAST")) |val| {
            defer allocator.free(val);
            config.fail_fast = std.mem.eql(u8, val, "1") or std.mem.eql(u8, val, "true");
        } else |_| {}
        
        if (std.process.getEnvVarOwned(allocator, "TEST_FILTER")) |val| {
            config.filter = val; // We'll free this later
        } else |_| {}
        
        if (std.process.getEnvVarOwned(allocator, "TEST_NO_COLOR")) |val| {
            defer allocator.free(val);
            config.colors = !(std.mem.eql(u8, val, "1") or std.mem.eql(u8, val, "true"));
        } else |_| {}

        if (std.process.getEnvVarOwned(allocator, "TEST_QUIET")) |val| {
            defer allocator.free(val);
            config.quiet = std.mem.eql(u8, val, "1") or std.mem.eql(u8, val, "true");
        } else |_| {}

        // Check if output is a TTY (disable colors if not)
        const stdout_file = std.fs.File.stdout();
        if (!stdout_file.isTty()) {
            config.colors = false;
        }

        return TestRunner{
            .allocator = allocator,
            .config = config,
            .stdout = stdout_file,
            .stderr = std.fs.File.stderr(),
            .timer = try std.time.Timer.start(),
            .slowest_tests = std.ArrayList(TestTiming).init(allocator),
        };
    }

    pub fn deinit(self: *TestRunner) void {
        if (self.config.filter) |filter| {
            self.allocator.free(filter);
        }
        self.slowest_tests.deinit();
    }

    fn color(self: *const TestRunner, comptime c: []const u8) []const u8 {
        return if (self.config.colors) c else "";
    }

    fn formatDuration(ns: u64) struct { value: f64, unit: []const u8 } {
        if (ns < 1000) {
            return .{ .value = @as(f64, @floatFromInt(ns)), .unit = "ns" };
        } else if (ns < 1000_000) {
            return .{ .value = @as(f64, @floatFromInt(ns)) / 1000.0, .unit = "μs" };
        } else if (ns < 1000_000_000) {
            return .{ .value = @as(f64, @floatFromInt(ns)) / 1000_000.0, .unit = "ms" };
        } else {
            return .{ .value = @as(f64, @floatFromInt(ns)) / 1000_000_000.0, .unit = "s" };
        }
    }

    fn printTestName(_: *TestRunner, name: []const u8) ![]const u8 {
        // Extract just the test name from the full path
        // Format is usually: "module.test.description" or "test_N"
        var friendly_name = name;
        if (std.mem.lastIndexOf(u8, name, ".test.")) |idx| {
            friendly_name = name[idx + 6..];
        } else if (std.mem.startsWith(u8, name, "test ")) {
            friendly_name = name[5..];
        }
        return friendly_name;
    }

    fn shouldRunTest(self: *const TestRunner, name: []const u8) bool {
        if (self.config.filter) |filter| {
            return std.mem.indexOf(u8, name, filter) != null;
        }
        return true;
    }

    fn runTest(self: *TestRunner, test_fn: std.builtin.TestFn) !void {
        const friendly_name = try self.printTestName(test_fn.name);
        
        // Check filter
        if (!self.shouldRunTest(test_fn.name)) {
            return;
        }

        self.total_tests += 1;
        self.current_test = test_fn.name;
        self.current_test_start = self.timer.read();

        // Print test start if verbose
        if (self.config.verbose and !self.config.quiet) {
            const writer = self.stdout.writer(&self.stdout_buf);
            try writer.print("{s}[RUN]{s} {s}\n", .{ 
                self.color(Color.cyan), 
                self.color(Color.reset),
                friendly_name 
            });
            try self.stdout.flush();
        }

        // Reset test allocator
        std.testing.allocator_instance = .{};

        // Run the test
        var test_error: ?anyerror = null;
        test_fn.func() catch |err| {
            test_error = err;
        };

        // Check for memory leaks
        const leaked = std.testing.allocator_instance.deinit() == .leak;

        // Calculate duration
        const duration = self.timer.read() - self.current_test_start;
        const dur = formatDuration(duration);

        // Track slowest tests
        try self.updateSlowestTests(test_fn.name, duration);

        // Handle results
        if (test_error) |err| {
            if (err == error.SkipZigTest) {
                self.skipped += 1;
                if (self.config.verbose or !self.config.quiet) {
                    const writer = self.stdout.writer(&self.stdout_buf);
                    try writer.print("{s}[SKIP]{s} {s}\n", .{
                        self.color(Color.yellow),
                        self.color(Color.reset),
                        friendly_name,
                    });
                    try self.stdout.flush();
                }
            } else {
                self.failed += 1;
                const writer = self.stderr.writer(&self.stderr_buf);
                try writer.print("{s}[FAIL]{s} {s} {s}({d:.2} {s}){s}\n", .{
                    self.color(Color.red),
                    self.color(Color.reset),
                    friendly_name,
                    self.color(Color.gray),
                    dur.value,
                    dur.unit,
                    self.color(Color.reset),
                });
                try writer.print("  {s}Error: {s}{s}\n", .{
                    self.color(Color.red),
                    @errorName(err),
                    self.color(Color.reset),
                });
                try self.stderr.flush();
                
                // Print stack trace if available
                if (@errorReturnTrace()) |trace| {
                    std.debug.dumpStackTrace(trace.*);
                }

                // Fail fast if configured
                if (self.config.fail_fast) {
                    return err;
                }
            }
        } else {
            self.passed += 1;
            
            if (leaked) {
                self.leaked += 1;
                try self.stderr.print("{s}[LEAK]{s} {s} {s}({d:.2} {s}){s}\n", .{
                    self.color(Color.yellow),
                    self.color(Color.reset),
                    friendly_name,
                    self.color(Color.gray),
                    dur.value,
                    dur.unit,
                    self.color(Color.reset),
                });
            } else if (self.config.verbose or !self.config.quiet) {
                try self.stdout.print("{s}[PASS]{s} {s} {s}({d:.2} {s}){s}\n", .{
                    self.color(Color.green),
                    self.color(Color.reset),
                    friendly_name,
                    self.color(Color.gray),
                    dur.value,
                    dur.unit,
                    self.color(Color.reset),
                });
            } else if (!self.config.quiet) {
                // Dot progress
                try self.stdout.print("{s}.{s}", .{
                    self.color(Color.green),
                    self.color(Color.reset),
                });
                // Flush to show progress immediately
                _ = std.fs.File.stdout().write("") catch {};
            }
        }

        self.current_test = null;
    }

    fn updateSlowestTests(self: *TestRunner, name: []const u8, duration: u64) !void {
        // Only track if we're showing slowest tests
        if (self.config.show_slowest == 0) return;

        const timing = TestTiming{
            .name = name,
            .duration_ns = duration,
        };

        // If we haven't filled the list yet, just add
        if (self.slowest_tests.items.len < self.config.show_slowest) {
            try self.slowest_tests.append(timing);
            // Sort to maintain order
            std.sort.pdq(TestTiming, self.slowest_tests.items, {}, struct {
                fn lessThan(_: void, a: TestTiming, b: TestTiming) bool {
                    return a.duration_ns > b.duration_ns; // Descending order
                }
            }.lessThan);
        } else {
            // Check if this test is slower than the fastest in our list
            const fastest = self.slowest_tests.items[self.slowest_tests.items.len - 1];
            if (duration > fastest.duration_ns) {
                self.slowest_tests.items[self.slowest_tests.items.len - 1] = timing;
                // Re-sort
                std.sort.pdq(TestTiming, self.slowest_tests.items, {}, struct {
                    fn lessThan(_: void, a: TestTiming, b: TestTiming) bool {
                        return a.duration_ns > b.duration_ns;
                    }
                }.lessThan);
            }
        }
    }

    fn printSummary(self: *TestRunner) !void {
        if (!self.config.quiet and !self.config.verbose) {
            try self.stdout.print("\n", .{});
        }

        const total_dur = formatDuration(self.total_time);

        // Print summary header
        try self.stdout.print("\n{s}Test Summary{s}\n", .{
            self.color(Color.bold),
            self.color(Color.reset),
        });
        try self.stdout.print("{s}────────────{s}\n", .{
            self.color(Color.gray),
            self.color(Color.reset),
        });

        // Print results
        if (self.passed > 0) {
            try self.stdout.print("  {s}✓{s} {d} passed\n", .{
                self.color(Color.green),
                self.color(Color.reset),
                self.passed,
            });
        }
        if (self.failed > 0) {
            try self.stderr.print("  {s}✗{s} {d} failed\n", .{
                self.color(Color.red),
                self.color(Color.reset),
                self.failed,
            });
        }
        if (self.skipped > 0) {
            try self.stdout.print("  {s}○{s} {d} skipped\n", .{
                self.color(Color.yellow),
                self.color(Color.reset),
                self.skipped,
            });
        }
        if (self.leaked > 0) {
            try self.stderr.print("  {s}⚠{s} {d} leaked memory\n", .{
                self.color(Color.yellow),
                self.color(Color.reset),
                self.leaked,
            });
        }

        // Print timing
        try self.stdout.print("\n  {s}Total:{s} {d} tests in {d:.2} {s}\n", .{
            self.color(Color.dim),
            self.color(Color.reset),
            self.total_tests,
            total_dur.value,
            total_dur.unit,
        });

        // Print slowest tests
        if (self.config.show_slowest > 0 and self.slowest_tests.items.len > 0) {
            try self.stdout.print("\n{s}Slowest Tests{s}\n", .{
                self.color(Color.bold),
                self.color(Color.reset),
            });
            try self.stdout.print("{s}─────────────{s}\n", .{
                self.color(Color.gray),
                self.color(Color.reset),
            });

            for (self.slowest_tests.items) |t| {
                const friendly_name = try self.printTestName(t.name);
                const dur = formatDuration(t.duration_ns);
                try self.stdout.print("  {d:.2} {s} - {s}\n", .{
                    dur.value,
                    dur.unit,
                    friendly_name,
                });
            }
        }

        // Print final status
        if (self.failed == 0) {
            try self.stdout.print("\n{s}✨ All tests passed!{s}\n", .{
                self.color(Color.green),
                self.color(Color.reset),
            });
        } else {
            try self.stderr.print("\n{s}❌ {d} test(s) failed{s}\n", .{
                self.color(Color.red),
                self.failed,
                self.color(Color.reset),
            });
        }
    }

    pub fn run(self: *TestRunner) !void {
        const start_time = self.timer.read();

        // Print header if not quiet
        if (!self.config.quiet) {
            try self.stdout.print("{s}Running {d} tests...{s}\n", .{
                self.color(Color.bold),
                builtin.test_functions.len,
                self.color(Color.reset),
            });
            
            if (self.config.filter) |filter| {
                try self.stdout.print("{s}Filter: {s}{s}\n", .{
                    self.color(Color.dim),
                    filter,
                    self.color(Color.reset),
                });
            }
            
            if (!self.config.verbose) {
                try self.stdout.print("\n", .{});
            }
        }

        // Check for special setup/teardown tests
        var setup_tests = std.ArrayList(std.builtin.TestFn).init(self.allocator);
        var teardown_tests = std.ArrayList(std.builtin.TestFn).init(self.allocator);
        var regular_tests = std.ArrayList(std.builtin.TestFn).init(self.allocator);
        defer setup_tests.deinit();
        defer teardown_tests.deinit();
        defer regular_tests.deinit();

        // Categorize tests
        for (builtin.test_functions) |test_fn| {
            if (std.mem.endsWith(u8, test_fn.name, "tests:beforeAll")) {
                try setup_tests.append(test_fn);
            } else if (std.mem.endsWith(u8, test_fn.name, "tests:afterAll")) {
                try teardown_tests.append(test_fn);
            } else {
                try regular_tests.append(test_fn);
            }
        }

        // Run setup tests
        for (setup_tests.items) |test_fn| {
            try self.runTest(test_fn);
        }

        // Run regular tests
        for (regular_tests.items) |test_fn| {
            self.runTest(test_fn) catch |err| {
                if (self.config.fail_fast) {
                    return err;
                }
            };
        }

        // Run teardown tests
        for (teardown_tests.items) |test_fn| {
            try self.runTest(test_fn);
        }

        self.total_time = self.timer.read() - start_time;

        // Print summary
        try self.printSummary();
    }
};

// Custom panic handler
pub const panic = std.debug.FullPanic(struct {
    var current_test: ?[]const u8 = null;

    pub fn setCurrentTest(name: ?[]const u8) void {
        current_test = name;
    }

    pub fn panicFn(msg: []const u8, ret_addr: ?usize) noreturn {
        if (current_test) |test_name| {
            const stderr_file = std.fs.File.stderr();
            var buf: [4096]u8 = undefined;
            const stderr = stderr_file.writer(&buf);
            stderr.print("\n\x1b[31m════════════════════════════════════════\x1b[0m\n", .{}) catch {};
            stderr.print("\x1b[31mPANIC in test: {s}\x1b[0m\n", .{test_name}) catch {};
            stderr.print("\x1b[31m════════════════════════════════════════\x1b[0m\n", .{}) catch {};
            stderr_file.flush() catch {};
        }
        std.debug.defaultPanic(msg, null, ret_addr);
    }
}.panicFn);

// Main entry point
pub fn main() !void {
    // Use a general purpose allocator for the test runner itself
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // Initialize test runner
    var runner = try TestRunner.init(allocator);
    defer runner.deinit();

    // Run tests
    runner.run() catch |err| {
        // Exit with error code
        std.process.exit(1);
        return err;
    };

    // Exit with appropriate code
    if (runner.failed > 0) {
        std.process.exit(1);
    }
}