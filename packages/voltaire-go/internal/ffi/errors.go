// Package ffi provides low-level CGO bindings to voltaire's C API.
package ffi

import "errors"

// Error codes from primitives.h
var (
	ErrInvalidHex           = errors.New("voltaire: invalid hex string")
	ErrInvalidLength        = errors.New("voltaire: invalid length")
	ErrInvalidChecksum      = errors.New("voltaire: invalid EIP-55 checksum")
	ErrOutOfMemory          = errors.New("voltaire: out of memory")
	ErrInvalidInput         = errors.New("voltaire: invalid input")
	ErrInvalidSignature     = errors.New("voltaire: invalid signature")
	ErrInvalidSelector      = errors.New("voltaire: invalid selector")
	ErrUnsupportedType      = errors.New("voltaire: unsupported type")
	ErrMaxLengthExceeded    = errors.New("voltaire: max length exceeded")
	ErrAccessListInvalid    = errors.New("voltaire: invalid access list")
	ErrAuthorizationInvalid = errors.New("voltaire: invalid authorization")
	ErrKZGNotLoaded         = errors.New("voltaire: KZG not loaded")
	ErrKZGInvalidBlob       = errors.New("voltaire: invalid KZG blob")
	ErrKZGInvalidProof      = errors.New("voltaire: invalid KZG proof")
	ErrUnknown              = errors.New("voltaire: unknown error")
)

// MapError converts a C error code to a Go error.
func MapError(code int) error {
	switch code {
	case 0:
		return nil
	case -1:
		return ErrInvalidHex
	case -2:
		return ErrInvalidLength
	case -3:
		return ErrInvalidChecksum
	case -4:
		return ErrOutOfMemory
	case -5:
		return ErrInvalidInput
	case -6:
		return ErrInvalidSignature
	case -7:
		return ErrInvalidSelector
	case -8:
		return ErrUnsupportedType
	case -9:
		return ErrMaxLengthExceeded
	case -10:
		return ErrAccessListInvalid
	case -11:
		return ErrAuthorizationInvalid
	case -20:
		return ErrKZGNotLoaded
	case -21:
		return ErrKZGInvalidBlob
	case -22:
		return ErrKZGInvalidProof
	default:
		return ErrUnknown
	}
}
