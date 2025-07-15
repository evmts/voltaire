const std = @import("std");
const Allocator = std.mem.Allocator;

// =============================================================================
// Transport Error Types
// =============================================================================

pub const TransportError = error{
    ConnectionFailed,
    NetworkError,
    Timeout,
    InvalidResponse,
    InvalidRequest,
    OutOfMemory,
    TlsError,
    AuthenticationFailed,
} || Allocator.Error;

// =============================================================================
// Error Context
// =============================================================================

pub const ErrorContext = struct {
    error_type: TransportError,
    message: []const u8,
    url: ?[]const u8 = null,
    status_code: ?u16 = null,

    pub fn init(error_type: TransportError, message: []const u8) ErrorContext {
        return ErrorContext{
            .error_type = error_type,
            .message = message,
        };
    }

    pub fn withUrl(self: ErrorContext, url: []const u8) ErrorContext {
        return ErrorContext{
            .error_type = self.error_type,
            .message = self.message,
            .url = url,
            .status_code = self.status_code,
        };
    }

    pub fn withStatusCode(self: ErrorContext, status_code: u16) ErrorContext {
        return ErrorContext{
            .error_type = self.error_type,
            .message = self.message,
            .url = self.url,
            .status_code = status_code,
        };
    }

    pub fn toString(self: ErrorContext, allocator: Allocator) ![]u8 {
        if (self.url) |url| {
            if (self.status_code) |code| {
                return try std.fmt.allocPrint(allocator, "Transport error at {s} (status {d}): {s}", .{ url, code, self.message });
            } else {
                return try std.fmt.allocPrint(allocator, "Transport error at {s}: {s}", .{ url, self.message });
            }
        } else {
            return try std.fmt.allocPrint(allocator, "Transport error: {s}", .{self.message});
        }
    }
};

// =============================================================================
// HTTP Specific Errors
// =============================================================================

pub const HttpError = struct {
    status_code: u16,
    message: []const u8,

    pub fn init(status_code: u16, message: []const u8) HttpError {
        return HttpError{
            .status_code = status_code,
            .message = message,
        };
    }

    pub fn toTransportError(self: HttpError) TransportError {
        return switch (self.status_code) {
            400...499 => TransportError.InvalidRequest,
            500...599 => TransportError.NetworkError,
            else => TransportError.NetworkError,
        };
    }
};

// =============================================================================
// IPC Specific Errors
// =============================================================================

pub const IpcError = struct {
    path: []const u8,
    message: []const u8,

    pub fn init(path: []const u8, message: []const u8) IpcError {
        return IpcError{
            .path = path,
            .message = message,
        };
    }

    pub fn toTransportError(self: IpcError) TransportError {
        _ = self;
        return TransportError.ConnectionFailed;
    }
};
