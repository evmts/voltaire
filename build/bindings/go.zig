const std = @import("std");

pub fn createGoSteps(b: *std.Build) void {
    const go_mod_tidy_cmd = b.addSystemCommand(&[_][]const u8{ "go", "mod", "tidy" });
    go_mod_tidy_cmd.setCwd(b.path("src/guillotine-go"));
    go_mod_tidy_cmd.step.dependOn(b.getInstallStep());

    const go_build_cmd = b.addSystemCommand(&[_][]const u8{ "go", "build", "./..." });
    go_build_cmd.setCwd(b.path("src/guillotine-go"));
    go_build_cmd.step.dependOn(&go_mod_tidy_cmd.step);

    const go_build_step = b.step("go", "Build Go bindings");
    go_build_step.dependOn(&go_build_cmd.step);

    const go_test_cmd = b.addSystemCommand(&[_][]const u8{ "go", "test", "./..." });
    go_test_cmd.setCwd(b.path("src/guillotine-go"));
    go_test_cmd.step.dependOn(&go_build_cmd.step);

    const go_test_step = b.step("go-test", "Run Go binding tests");
    go_test_step.dependOn(&go_test_cmd.step);

    const go_vet_cmd = b.addSystemCommand(&[_][]const u8{ "go", "vet", "./..." });
    go_vet_cmd.setCwd(b.path("src/guillotine-go"));
    go_vet_cmd.step.dependOn(&go_build_cmd.step);

    const go_vet_step = b.step("go-vet", "Run Go code analysis");
    go_vet_step.dependOn(&go_vet_cmd.step);

    const go_fmt_check_cmd = b.addSystemCommand(&[_][]const u8{ "sh", "-c", "test -z \"$(gofmt -l .)\" || (echo 'Code is not formatted. Run: go fmt ./...' && exit 1)" });
    go_fmt_check_cmd.setCwd(b.path("src/guillotine-go"));

    const go_fmt_check_step = b.step("go-fmt-check", "Check Go code formatting");
    go_fmt_check_step.dependOn(&go_fmt_check_cmd.step);

    const go_fmt_cmd = b.addSystemCommand(&[_][]const u8{ "go", "fmt", "./..." });
    go_fmt_cmd.setCwd(b.path("src/guillotine-go"));

    const go_fmt_step = b.step("go-fmt", "Format Go code");
    go_fmt_step.dependOn(&go_fmt_cmd.step);
}