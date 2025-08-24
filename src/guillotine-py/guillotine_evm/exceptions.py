"""
Exception classes for Guillotine EVM Python bindings.
"""

from typing import Optional


class GuillotineError(Exception):
    """Base exception for all Guillotine EVM errors."""
    
    def __init__(self, message: str, error_code: Optional[int] = None) -> None:
        super().__init__(message)
        self.error_code = error_code


class ExecutionError(GuillotineError):
    """Raised when EVM execution fails."""
    
    def __init__(
        self, 
        message: str, 
        error_code: Optional[int] = None,
        gas_used: Optional[int] = None
    ) -> None:
        super().__init__(message, error_code)
        self.gas_used = gas_used


class InvalidAddressError(GuillotineError):
    """Raised when an invalid Ethereum address is provided."""
    pass


class ValidationError(GuillotineError):
    """Raised when input validation fails."""
    pass


class InvalidHashError(GuillotineError):
    """Raised when an invalid hash is provided."""
    pass


class InvalidBytecodeError(GuillotineError):
    """Raised when invalid bytecode is provided."""
    pass


class InsufficientGasError(ExecutionError):
    """Raised when execution runs out of gas."""
    pass


class MemoryError(GuillotineError):
    """Raised when memory allocation fails."""
    pass


class StateError(GuillotineError):
    """Raised when blockchain state operations fail."""
    pass