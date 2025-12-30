/**
 * ChaCha20-Poly1305 Basics - Overview of Authenticated Encryption
 *
 * ChaCha20-Poly1305 is an Authenticated Encryption with Associated Data (AEAD) cipher.
 * It combines ChaCha20 stream cipher for encryption with Poly1305 MAC for authentication.
 *
 * Key properties:
 * - 256-bit key (32 bytes)
 * - 96-bit nonce (12 bytes)
 * - 128-bit authentication tag (16 bytes)
 * - Software-optimized (no hardware AES needed)
 * - Defined in RFC 8439
 */
import { ChaCha20Poly1305 } from "@tevm/voltaire";

// 1. Generate a key
const key = ChaCha20Poly1305.generateKey();

// 2. Generate a nonce (must be unique per message with same key)
const nonce = ChaCha20Poly1305.generateNonce();

// 3. Encrypt plaintext
const plaintext = new TextEncoder().encode("Hello, ChaCha20-Poly1305!");

const ciphertext = ChaCha20Poly1305.encrypt(plaintext, key, nonce);

// 4. Decrypt ciphertext
const decrypted = ChaCha20Poly1305.decrypt(ciphertext, key, nonce);
