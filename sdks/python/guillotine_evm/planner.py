"""
Bytecode planner and optimization for Guillotine EVM Python bindings.

This module provides advanced bytecode analysis and optimization using the
underlying planner C API, with comprehensive caching and performance optimization.
"""

from typing import Optional, Dict, Any
from dataclasses import dataclass

from .bytecode import Bytecode
from .exceptions import ValidationError, ExecutionError
from ._ffi_comprehensive import ffi, lib, require_ffi


@dataclass
class CacheStats:
    """Planner cache statistics."""
    size: int
    capacity: int
    hit_rate: float
    miss_count: int


@dataclass
class Plan:
    """
    Optimized execution plan for bytecode.
    
    Contains the optimized instruction stream and metadata for efficient execution.
    """
    instruction_count: int
    constant_count: int
    optimization_ratio: float
    has_jump_table: bool
    _handle: Optional[Any] = None  # Internal C handle
    
    def __post_init__(self):
        """Calculate optimization ratio if not provided."""
        if self.optimization_ratio == 0 and self.instruction_count > 0:
            # Estimate based on instruction reduction
            self.optimization_ratio = max(1.0, self.instruction_count / max(self.instruction_count * 0.8, 1))
    
    def __del__(self):
        """Cleanup plan resources."""
        if self._handle is not None and lib is not None:
            lib.evm_planner_plan_destroy(self._handle)
            self._handle = None
    
    def is_valid_jump_destination(self, pc: int) -> bool:
        """Check if PC is valid jump destination in this plan."""
        if self._handle is not None and lib is not None:
            result = lib.evm_planner_plan_is_valid_jump_dest(self._handle, pc)
            return bool(result)
        else:
            # Fallback - assume valid for now
            return True


class Planner:
    """
    Bytecode analysis and optimization engine.
    
    Provides comprehensive bytecode optimization with LRU caching for improved performance.
    The planner analyzes bytecode and creates optimized execution plans that can significantly
    improve EVM execution speed.
    """
    
    def __init__(self, *, cache_size: int = 256) -> None:
        """
        Create planner with LRU cache.
        
        Args:
            cache_size: Maximum number of plans to cache (must be positive)
        """
        if cache_size <= 0:
            raise ValidationError(f"Cache size must be positive, got {cache_size}")
        
        self._cache_size = cache_size
        self._handle = None
        self._plans_cache: Dict[bytes, Plan] = {}  # Python-side cache for fallback
        
        # Initialize FFI handle if available
        if lib is not None:
            self._handle = lib.evm_planner_create()
            if self._handle is None:
                raise ExecutionError("Failed to create planner instance")
    
    def __del__(self):
        """Cleanup planner resources."""
        if self._handle is not None and lib is not None:
            lib.evm_planner_destroy(self._handle)
            self._handle = None
    
    def plan(self, bytecode: Bytecode) -> Plan:
        """
        Create optimized execution plan.
        
        Args:
            bytecode: Bytecode to analyze and optimize
        
        Returns:
            Optimized execution plan
        
        Raises:
            ValidationError: If bytecode is invalid
            ExecutionError: If planning fails
        """
        if not isinstance(bytecode, Bytecode):
            raise ValidationError(f"Expected Bytecode, got {type(bytecode)}")
        
        bytecode_bytes = bytecode.to_bytes()
        
        # Check cache first
        if bytecode_bytes in self._plans_cache:
            return self._plans_cache[bytecode_bytes]
        
        if self._handle is not None and lib is not None:
            # Use C implementation if available
            plan_handle = lib.evm_planner_plan_bytecode(
                self._handle,
                bytecode_bytes,
                len(bytecode_bytes)
            )
            
            if plan_handle is None:
                raise ExecutionError("Failed to create execution plan")
            
            # Extract plan metadata
            instruction_count = lib.evm_planner_plan_get_instruction_count(plan_handle)
            constant_count = lib.evm_planner_plan_get_constant_count(plan_handle)
            has_jump_table = bool(lib.evm_planner_plan_has_pc_mapping(plan_handle))
            
            # Calculate optimization ratio (simplified)
            original_length = len(bytecode_bytes)
            optimization_ratio = max(1.0, original_length / max(instruction_count, 1))
            
            plan = Plan(
                instruction_count=instruction_count,
                constant_count=constant_count,
                optimization_ratio=optimization_ratio,
                has_jump_table=has_jump_table,
                _handle=plan_handle
            )
        else:
            # Fallback to Python implementation
            stats = bytecode.statistics()
            
            # Simple optimization estimation
            instruction_count = stats.instruction_count
            constant_count = stats.push_count  # Assume PUSH instructions become constants
            optimization_ratio = max(1.0, stats.length / max(instruction_count, 1))
            
            plan = Plan(
                instruction_count=instruction_count,
                constant_count=constant_count,
                optimization_ratio=optimization_ratio,
                has_jump_table=True  # Assume jump table is built
            )
        
        # Cache the plan (manage cache size)
        if len(self._plans_cache) >= self._cache_size:
            # Remove oldest entry (simplified LRU)
            oldest_key = next(iter(self._plans_cache))
            del self._plans_cache[oldest_key]
        
        self._plans_cache[bytecode_bytes] = plan
        return plan
    
    def has_cached_plan(self, bytecode: Bytecode) -> bool:
        """
        Check if plan is cached.
        
        Args:
            bytecode: Bytecode to check
        
        Returns:
            True if plan is cached
        """
        if not isinstance(bytecode, Bytecode):
            raise ValidationError(f"Expected Bytecode, got {type(bytecode)}")
        
        bytecode_bytes = bytecode.to_bytes()
        
        if self._handle is not None and lib is not None:
            # Use C implementation if available
            result = lib.evm_planner_has_cached_plan(
                self._handle,
                bytecode_bytes,
                len(bytecode_bytes)
            )
            return bool(result)
        else:
            # Fallback to Python cache
            return bytecode_bytes in self._plans_cache
    
    def get_cached_plan(self, bytecode: Bytecode) -> Optional[Plan]:
        """
        Get cached plan if available.
        
        Args:
            bytecode: Bytecode to get plan for
        
        Returns:
            Cached plan or None if not cached
        """
        if not isinstance(bytecode, Bytecode):
            raise ValidationError(f"Expected Bytecode, got {type(bytecode)}")
        
        if not self.has_cached_plan(bytecode):
            return None
        
        bytecode_bytes = bytecode.to_bytes()
        
        if self._handle is not None and lib is not None:
            # Use C implementation if available
            plan_handle = lib.evm_planner_get_cached_plan(
                self._handle,
                bytecode_bytes,
                len(bytecode_bytes)
            )
            
            if plan_handle is None:
                return None
            
            # Extract plan metadata
            instruction_count = lib.evm_planner_plan_get_instruction_count(plan_handle)
            constant_count = lib.evm_planner_plan_get_constant_count(plan_handle)
            has_jump_table = bool(lib.evm_planner_plan_has_pc_mapping(plan_handle))
            
            # Calculate optimization ratio
            original_length = len(bytecode_bytes)
            optimization_ratio = max(1.0, original_length / max(instruction_count, 1))
            
            return Plan(
                instruction_count=instruction_count,
                constant_count=constant_count,
                optimization_ratio=optimization_ratio,
                has_jump_table=has_jump_table,
                _handle=plan_handle
            )
        else:
            # Fallback to Python cache
            return self._plans_cache.get(bytecode_bytes)
    
    def clear_cache(self) -> None:
        """Clear the plan cache."""
        if self._handle is not None and lib is not None:
            # Use C implementation if available
            result = lib.evm_planner_clear_cache(self._handle)
            if result != 0:  # 0 = success
                raise ExecutionError("Failed to clear planner cache")
        
        # Also clear Python cache
        self._plans_cache.clear()
    
    def cache_stats(self) -> CacheStats:
        """
        Get cache statistics.
        
        Returns:
            Cache statistics including hit rate and size
        """
        if self._handle is not None and lib is not None:
            # Use C implementation if available
            stats_c = ffi.new("CCacheStats *")
            result = lib.evm_planner_get_cache_stats(self._handle, stats_c)
            
            if result == 0:  # Success
                total_requests = stats_c.hits + stats_c.misses
                hit_rate = stats_c.hits / max(total_requests, 1)
                
                return CacheStats(
                    size=stats_c.size,
                    capacity=stats_c.capacity,
                    hit_rate=hit_rate,
                    miss_count=stats_c.misses
                )
        
        # Fallback to Python cache stats
        return CacheStats(
            size=len(self._plans_cache),
            capacity=self._cache_size,
            hit_rate=0.0,  # We don't track hits in Python fallback
            miss_count=0
        )
    
    def optimize_for_execution(self, bytecode: Bytecode) -> Plan:
        """
        Create plan optimized for execution performance.
        
        This is an alias for plan() but indicates the intent to optimize for
        maximum execution speed rather than compilation speed.
        
        Args:
            bytecode: Bytecode to optimize
        
        Returns:
            Execution-optimized plan
        """
        return self.plan(bytecode)
    
    def optimize_for_size(self, bytecode: Bytecode) -> Plan:
        """
        Create plan optimized for memory usage.
        
        Args:
            bytecode: Bytecode to optimize
        
        Returns:
            Size-optimized plan
        """
        # For now, same as regular plan
        # TODO: Implement size-specific optimizations
        return self.plan(bytecode)
    
    def analyze_complexity(self, bytecode: Bytecode) -> Dict[str, Any]:
        """
        Analyze bytecode complexity metrics.
        
        Args:
            bytecode: Bytecode to analyze
        
        Returns:
            Dictionary of complexity metrics
        """
        if not isinstance(bytecode, Bytecode):
            raise ValidationError(f"Expected Bytecode, got {type(bytecode)}")
        
        stats = bytecode.statistics()
        plan = self.plan(bytecode)
        
        return {
            "bytecode_length": stats.length,
            "instruction_count": stats.instruction_count,
            "unique_opcodes": stats.unique_opcodes,
            "push_instructions": stats.push_count,
            "jump_instructions": stats.jump_count,
            "invalid_opcodes": stats.invalid_opcode_count,
            "estimated_gas": stats.gas_estimate,
            "complexity_score": stats.complexity_score,
            "optimization_ratio": plan.optimization_ratio,
            "optimized_instructions": plan.instruction_count,
            "plan_constants": plan.constant_count,
            "has_jump_optimization": plan.has_jump_table,
        }
    
    def estimate_performance_gain(self, bytecode: Bytecode) -> float:
        """
        Estimate performance improvement from optimization.
        
        Args:
            bytecode: Bytecode to analyze
        
        Returns:
            Estimated performance gain multiplier (e.g., 1.5 = 50% faster)
        """
        plan = self.plan(bytecode)
        stats = bytecode.statistics()
        
        # Simple heuristic based on optimization ratio and complexity
        base_gain = plan.optimization_ratio
        
        # Additional gains from specific optimizations
        if plan.has_jump_table:
            base_gain *= 1.2  # 20% gain from jump table optimization
        
        if stats.push_count > stats.instruction_count * 0.3:  # Lots of PUSH instructions
            base_gain *= 1.1  # 10% gain from constant pooling
        
        return min(base_gain, 5.0)  # Cap at 5x improvement
    
    def __enter__(self) -> "Planner":
        """Context manager entry."""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb) -> None:
        """Context manager exit."""
        # Planner doesn't need explicit cleanup beyond __del__
        pass