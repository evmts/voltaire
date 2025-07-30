#!/usr/bin/env python3
"""
Build script for Guillotine EVM Python bindings.

This script builds the native library and compiles the FFI bindings.
"""

import os
import sys
import subprocess
import shutil
from pathlib import Path


def run_command(cmd, cwd=None):
    """Run a command and return success status."""
    print(f"Running: {' '.join(cmd)}")
    try:
        result = subprocess.run(cmd, cwd=cwd, check=True, capture_output=True, text=True)
        if result.stdout:
            print(result.stdout)
        return True
    except subprocess.CalledProcessError as e:
        print(f"Command failed: {e}")
        if e.stdout:
            print(f"stdout: {e.stdout}")
        if e.stderr:
            print(f"stderr: {e.stderr}")
        return False


def build_native_library():
    """Build the native Guillotine library."""
    print("Building native Guillotine library...")
    
    # Go to project root
    project_root = Path(__file__).parent.parent.parent
    
    # Run zig build
    if not run_command(["zig", "build"], cwd=project_root):
        print("Failed to build native library")
        return False
    
    print("Native library built successfully")
    return True


def build_ffi_bindings():
    """Build the CFFI bindings."""
    print("Building FFI bindings...")
    
    try:
        # Import and run the FFI builder
        from guillotine_evm._ffi_build import ffibuilder
        ffibuilder.compile(verbose=True)
        print("FFI bindings built successfully")
        return True
    except Exception as e:
        print(f"Failed to build FFI bindings: {e}")
        return False


def install_development_mode():
    """Install package in development mode."""
    print("Installing in development mode...")
    
    if not run_command([sys.executable, "-m", "pip", "install", "-e", "."], cwd=Path(__file__).parent):
        print("Failed to install in development mode")
        return False
    
    print("Package installed in development mode")
    return True


def main():
    """Main build function."""
    print("Building Guillotine EVM Python bindings...")
    
    # Check if we're in the right directory
    if not Path("guillotine_evm/__init__.py").exists():
        print("Error: Please run this script from the guillotine-py directory")
        return 1
    
    # Build native library
    if not build_native_library():
        print("Build failed at native library stage")
        return 1
    
    # Build FFI bindings
    if not build_ffi_bindings():
        print("Build failed at FFI bindings stage")
        return 1
    
    # Install in development mode
    if "--dev" in sys.argv or "--development" in sys.argv:
        if not install_development_mode():
            print("Build failed at installation stage")
            return 1
    
    print("Build completed successfully!")
    return 0


if __name__ == "__main__":
    sys.exit(main())