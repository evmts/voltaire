//go:build mock
// +build mock

package main

// Mock versions of the EVM2 functions when building with --mock tag

func GetEVM2Version() string {
	return "mock-version"
}

func GetEVM2BuildInfo() string {
	return "mock-build"
}

func CleanupEVM2() {
	// No-op
}

func BuildInfo() string {
	return "Mock Build Info"
}