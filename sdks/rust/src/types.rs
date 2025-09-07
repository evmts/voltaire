//! Common types used throughout the Guillotine Rust wrapper

use alloy_primitives::{Address, Bytes, B256};

/// Result of executing a transaction on the EVM
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct ExecutionResult {
    /// Whether the execution was successful
    pub success: bool,
    /// Amount of gas consumed during execution
    pub gas_used: u64,
    /// Output data from the execution
    pub output: Vec<u8>,
    /// Logs emitted during execution
    pub logs: Vec<Log>,
}

impl ExecutionResult {
    /// Create a successful execution result
    pub fn success(gas_used: u64, output: Vec<u8>) -> Self {
        Self {
            success: true,
            gas_used,
            output,
            logs: Vec::new(),
        }
    }

    /// Create a failed execution result
    pub fn failure(gas_used: u64) -> Self {
        Self {
            success: false,
            gas_used,
            output: Vec::new(),
            logs: Vec::new(),
        }
    }

    /// Check if the execution was successful
    pub fn is_success(&self) -> bool {
        self.success
    }

    /// Check if the execution failed
    pub fn is_failure(&self) -> bool {
        !self.success
    }

    /// Get the output as bytes
    pub fn output(&self) -> &[u8] {
        &self.output
    }

    /// Get the output as a Bytes object
    pub fn output_bytes(&self) -> Bytes {
        Bytes::from(self.output.clone())
    }
}

/// An EVM log entry
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Log {
    /// The address that emitted this log
    pub address: Address,
    /// The topics of the log
    pub topics: Vec<B256>,
    /// The data of the log
    pub data: Bytes,
}

impl Log {
    /// Create a new log entry
    pub fn new(address: Address, topics: Vec<B256>, data: Bytes) -> Self {
        Self {
            address,
            topics,
            data,
        }
    }
}

/// Transaction input builder for contract calls
#[derive(Debug, Clone)]
pub struct CallData {
    /// Function selector (first 4 bytes)
    pub selector: [u8; 4],
    /// Encoded parameters
    pub params: Vec<u8>,
}

impl CallData {
    /// Create new call data from selector and parameters
    pub fn new(selector: [u8; 4], params: Vec<u8>) -> Self {
        Self { selector, params }
    }

    /// Encode the call data into a single byte vector
    pub fn encode(&self) -> Vec<u8> {
        let mut result = Vec::with_capacity(4 + self.params.len());
        result.extend_from_slice(&self.selector);
        result.extend_from_slice(&self.params);
        result
    }
}

/// Contract deployment data
#[derive(Debug, Clone)]
pub struct DeployData {
    /// Contract bytecode
    pub bytecode: Vec<u8>,
    /// Constructor parameters
    pub constructor_params: Vec<u8>,
}

impl DeployData {
    /// Create new deployment data
    pub fn new(bytecode: Vec<u8>, constructor_params: Vec<u8>) -> Self {
        Self {
            bytecode,
            constructor_params,
        }
    }

    /// Encode the deployment data (bytecode + constructor params)
    pub fn encode(&self) -> Vec<u8> {
        let mut result = Vec::with_capacity(self.bytecode.len() + self.constructor_params.len());
        result.extend_from_slice(&self.bytecode);
        result.extend_from_slice(&self.constructor_params);
        result
    }
}