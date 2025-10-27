// EIP-4844 Blob Transaction Support
// Reference: https://eips.ethereum.org/EIPS/eip-4844

// Constants
export const BLOB_SIZE = 131072; // 128 KB (4096 field elements * 32 bytes)
export const FIELD_ELEMENTS_PER_BLOB = 4096;
export const BYTES_PER_FIELD_ELEMENT = 32;
export const MAX_BLOBS_PER_TRANSACTION = 6;
export const BLOB_COMMITMENT_VERSION_KZG = 0x01;
export const BLOB_GAS_PER_BLOB = 131072; // 2^17
export const TARGET_BLOB_GAS_PER_BLOCK = 393216; // 3 * BLOB_GAS_PER_BLOB

// Branded type for Blob - exactly 131072 bytes
export type Blob = Uint8Array & { readonly __brand: unique symbol };

// Blob commitment (48 bytes) - KZG commitment output
export type BlobCommitment = Uint8Array & { readonly __brand: unique symbol };

// Blob proof (48 bytes) - KZG proof
export type BlobProof = Uint8Array & { readonly __brand: unique symbol };

// Versioned hash (32 bytes) - commitment hash with version prefix
export type VersionedHash = Uint8Array & { readonly __brand: unique symbol };

/**
 * Create a Blob from arbitrary data
 * Encodes data into blob format (length prefix + data + padding)
 * @param data - Data to encode into blob (max ~131KB)
 * @returns Blob containing the encoded data
 */
export const fromData = (data: Uint8Array): Blob => {
  if (data.length > BLOB_SIZE - 8) {
    throw new Error(`Data too large: ${data.length} bytes (max ${BLOB_SIZE - 8})`);
  }

  const blob = new Uint8Array(BLOB_SIZE);
  // Length prefix (8 bytes, little-endian)
  const view = new DataView(blob.buffer);
  view.setBigUint64(0, BigInt(data.length), true);
  // Copy data
  blob.set(data, 8);

  return blob as Blob;
};

/**
 * Extract data from a Blob
 * Decodes blob format (reads length prefix and extracts data)
 * @param blob - Blob to decode
 * @returns Original data
 */
export const toData = (blob: Blob): Uint8Array => {
  if (blob.length !== BLOB_SIZE) {
    throw new Error(`Invalid blob size: ${blob.length} (expected ${BLOB_SIZE})`);
  }

  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);
  const length = Number(view.getBigUint64(0, true));

  if (length > BLOB_SIZE - 8) {
    throw new Error(`Invalid length prefix: ${length}`);
  }

  return blob.slice(8, 8 + length);
};

/**
 * Compute KZG commitment for a blob
 * @param blob - Blob to commit to
 * @returns 48-byte KZG commitment
 * @stub Implementation requires c-kzg-4844 library
 */
export const commitment = (_blob: Blob): BlobCommitment => {
  // TODO: Implement using c-kzg-4844
  // const commitment = blobToKzgCommitment(blob);
  // return commitment as BlobCommitment;
  throw new Error('Not implemented: requires c-kzg-4844 library');
};

/**
 * Generate KZG proof for a blob
 * @param blob - Blob to generate proof for
 * @returns 48-byte KZG proof
 * @stub Implementation requires c-kzg-4844 library
 */
export const proof = (_blob: Blob): BlobProof => {
  // TODO: Implement using c-kzg-4844
  // const commitment = blobToKzgCommitment(blob);
  // const proof = computeBlobKzgProof(blob, commitment);
  // return proof as BlobProof;
  throw new Error('Not implemented: requires c-kzg-4844 library');
};

/**
 * Create versioned hash from KZG commitment
 * Formula: BLOB_COMMITMENT_VERSION_KZG || sha256(commitment)[1:]
 * @param commitment - 48-byte KZG commitment
 * @returns 32-byte versioned hash
 * @stub Implementation requires crypto.subtle.digest
 */
export const commitmentToVersionedHash = async (
  _commitment: BlobCommitment,
): Promise<VersionedHash> => {
  // TODO: Implement versioned hash calculation
  // const hash = await crypto.subtle.digest('SHA-256', commitment);
  // const versionedHash = new Uint8Array(32);
  // versionedHash[0] = BLOB_COMMITMENT_VERSION_KZG;
  // versionedHash.set(new Uint8Array(hash).slice(1), 1);
  // return versionedHash as VersionedHash;
  throw new Error('Not implemented: requires SHA-256');
};

/**
 * Validate versioned hash has correct version byte
 * @param hash - Versioned hash to validate
 * @returns true if version byte is BLOB_COMMITMENT_VERSION_KZG
 */
export const isValidVersionedHash = (hash: VersionedHash): boolean => {
  return hash[0] === BLOB_COMMITMENT_VERSION_KZG;
};

export const Blob = {
  fromData,
  toData,
  commitment,
  proof,
  commitmentToVersionedHash,
  isValidVersionedHash,
} as const;
