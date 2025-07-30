"""
Guillotine EVM Python Bindings

High-performance Python bindings for the Guillotine Ethereum Virtual Machine.
"""

__version__ = "0.1.0"
__author__ = "EVMts Contributors"
__email__ = "noreply@evmts.dev"

from .primitives import Address, U256, Hash, Bytes
from .evm import EVM, ExecutionResult, EvmError
from .exceptions import GuillotineError, ExecutionError, InvalidAddressError

__all__ = [
    # Core EVM
    "EVM",
    "ExecutionResult", 
    "EvmError",
    
    # Primitives
    "Address",
    "U256", 
    "Hash",
    "Bytes",
    
    # Exceptions
    "GuillotineError",
    "ExecutionError", 
    "InvalidAddressError",
    
    # Version info
    "__version__",
    "__author__",
    "__email__",
]