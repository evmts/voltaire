//! Low-level FFI bindings to Guillotine EVM
//!
//! This module re-exports the auto-generated bindings from bindgen.
//! All unsafe code is isolated here and wrapped in safe abstractions in the parent module.

#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]
#![allow(improper_ctypes)]

// Include the auto-generated bindings from bindgen
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));