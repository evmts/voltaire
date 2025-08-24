//go:build mock
// +build mock

package main

// Mock versions of the EVM functions when building with --mock tag

func GetEVMVersion() string {
	return "mock-version"
}

func GetEVMBuildInfo() string {
	return "mock-build"
}

func CleanupEVM() {
	// No-op
}

func BuildInfo() string {
	return "Mock Build Info"
}