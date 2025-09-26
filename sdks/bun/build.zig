const std = @import("std");

pub fn createBunSteps(b: *std.Build) void {
    // Check if bun is available
    const bun_check = b.addSystemCommand(&[_][]const u8{ "which", "bun" });
    bun_check.addCheck(.{ .expect_stdout_match = "bun" });

    // Install dependencies
    const bun_install = b.addSystemCommand(&[_][]const u8{ "bun", "install" });
    bun_install.setCwd(b.path("sdks/bun"));
    bun_install.step.dependOn(&bun_check.step);

    // Build TypeScript bindings
    const bun_build = b.addSystemCommand(&[_][]const u8{
        "bun", "build", "src/index.ts",
        "--outdir", "dist",
        "--target", "bun"
    });
    bun_build.setCwd(b.path("sdks/bun"));
    bun_build.step.dependOn(&bun_install.step);

    // The Bun SDK requires the shared library to be built first
    bun_build.step.dependOn(b.getInstallStep());

    const bun_build_step = b.step("bun", "Build Bun SDK bindings");
    bun_build_step.dependOn(&bun_build.step);

    // Run tests
    const bun_test = b.addSystemCommand(&[_][]const u8{ "bun", "test" });
    bun_test.setCwd(b.path("sdks/bun"));
    bun_test.step.dependOn(&bun_build.step);

    const bun_test_step = b.step("bun-test", "Run Bun SDK tests");
    bun_test_step.dependOn(&bun_test.step);

    // Run specific test files
    const bun_test_basic = b.addSystemCommand(&[_][]const u8{
        "bun", "test", "test/basic-ffi.test.ts"
    });
    bun_test_basic.setCwd(b.path("sdks/bun"));
    bun_test_basic.step.dependOn(&bun_build.step);

    const bun_test_basic_step = b.step("bun-test-basic", "Run basic FFI tests for Bun SDK");
    bun_test_basic_step.dependOn(&bun_test_basic.step);

    // Run example
    const bun_example = b.addSystemCommand(&[_][]const u8{ "bun", "run", "example.ts" });
    bun_example.setCwd(b.path("sdks/bun"));
    bun_example.step.dependOn(&bun_build.step);

    const bun_example_step = b.step("bun-example", "Run Bun SDK example");
    bun_example_step.dependOn(&bun_example.step);

    // Clean build artifacts
    const bun_clean = b.addSystemCommand(&[_][]const u8{ "rm", "-rf", "dist" });
    bun_clean.setCwd(b.path("sdks/bun"));

    const bun_clean_step = b.step("bun-clean", "Clean Bun SDK build artifacts");
    bun_clean_step.dependOn(&bun_clean.step);
}