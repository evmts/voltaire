const std = @import("std");

pub fn createTypeScriptSteps(b: *std.Build) void {
    // Note: TypeScript bindings are in src/guillotine-ts, not sdks/typescript
    const ts_install_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "install" });
    ts_install_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_install_cmd.step.dependOn(b.getInstallStep());

    const ts_copy_wasm_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "copy-wasm" });
    ts_copy_wasm_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_copy_wasm_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_build_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "build" });
    ts_build_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_build_cmd.step.dependOn(&ts_copy_wasm_cmd.step);

    const ts_build_step = b.step("ts", "Build TypeScript bindings");
    ts_build_step.dependOn(&ts_build_cmd.step);

    const ts_test_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "test" });
    ts_test_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_test_cmd.step.dependOn(&ts_build_cmd.step);

    const ts_test_step = b.step("ts-test", "Run TypeScript binding tests");
    ts_test_step.dependOn(&ts_test_cmd.step);

    const ts_lint_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "lint" });
    ts_lint_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_lint_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_lint_step = b.step("ts-lint", "Run TypeScript linting");
    ts_lint_step.dependOn(&ts_lint_cmd.step);

    const ts_format_check_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "format:check" });
    ts_format_check_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_format_check_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_format_check_step = b.step("ts-format-check", "Check TypeScript code formatting");
    ts_format_check_step.dependOn(&ts_format_check_cmd.step);

    const ts_format_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "format" });
    ts_format_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_format_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_format_step = b.step("ts-format", "Format TypeScript code");
    ts_format_step.dependOn(&ts_format_cmd.step);

    const ts_typecheck_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "typecheck" });
    ts_typecheck_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_typecheck_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_typecheck_step = b.step("ts-typecheck", "Run TypeScript type checking");
    ts_typecheck_step.dependOn(&ts_typecheck_cmd.step);

    const ts_dev_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "dev" });
    ts_dev_cmd.setCwd(b.path("src/guillotine-ts"));
    ts_dev_cmd.step.dependOn(&ts_install_cmd.step);

    const ts_dev_step = b.step("ts-dev", "Run TypeScript in development/watch mode");
    ts_dev_step.dependOn(&ts_dev_cmd.step);

    const ts_clean_cmd = b.addSystemCommand(&[_][]const u8{ "npm", "run", "clean" });
    ts_clean_cmd.setCwd(b.path("src/guillotine-ts"));

    const ts_clean_step = b.step("ts-clean", "Clean TypeScript build artifacts");
    ts_clean_step.dependOn(&ts_clean_cmd.step);
}