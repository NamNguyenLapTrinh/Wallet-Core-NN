#pragma once

// =============================================================================
// SecureMemory.hpp
// -----------------------------------------------------------------------------
// Secret-lifecycle helpers. Two responsibilities:
//   1. Wipe-in-place primitives that defeat the compiler's dead-store
//      elimination so the bytes are actually zeroed before the storage is
//      returned to the allocator.
//   2. RAII guards so callers don't need to remember to wipe in every
//      try/catch arm.
//
// USAGE
//   {
//     auto bytes = hexDecode(privateKeyHex);
//     SecureBytes guard(bytes);          // RAII — wipes on scope exit
//     ...                                // use bytes
//   }                                    // <-- wipe happens here
//
// NOTES
//   - We use a volatile pointer to ensure the writes are observable to the
//     abstract machine and not optimized out. On Apple platforms
//     `memset_s` is available; on Android NDK we rely on the volatile dance.
//   - These are *best-effort*. A determined attacker with kernel-level
//     access can still recover secrets from physical memory; this defends
//     against accidental leakage to heap-reuse, swap, core dumps.
// =============================================================================

#include <cstddef>
#include <cstdint>
#include <string>
#include <vector>

namespace margelo::nitro::walletmgr {

// Cross-platform secure wipe. Volatile pointer prevents the compiler from
// optimising the writes away (dead-store elimination), without depending on
// optional libc extensions like memset_s that aren't available in C++ mode
// on all SDKs.
inline void secureWipeBytes(void* data, std::size_t size) noexcept {
  if (!data || size == 0) return;
  volatile auto* p = static_cast<volatile std::uint8_t*>(data);
  for (std::size_t i = 0; i < size; ++i) p[i] = 0;
}

inline void secureWipeString(std::string& s) noexcept {
  if (s.empty()) return;
  secureWipeBytes(s.data(), s.size());
  s.clear();
  s.shrink_to_fit();
}

inline void secureWipeVector(std::vector<std::uint8_t>& v) noexcept {
  if (v.empty()) return;
  secureWipeBytes(v.data(), v.size());
  v.clear();
  v.shrink_to_fit();
}

// ── RAII guards ─────────────────────────────────────────────────────────────
// Wipe the wrapped container when the guard goes out of scope, no matter how
// (return, exception, early break).

class SecureString {
 public:
  explicit SecureString(std::string& ref) noexcept : ref_(&ref) {}
  SecureString(const SecureString&) = delete;
  SecureString& operator=(const SecureString&) = delete;
  SecureString(SecureString&& other) noexcept : ref_(other.ref_) { other.ref_ = nullptr; }
  SecureString& operator=(SecureString&&) = delete;
  ~SecureString() { if (ref_) secureWipeString(*ref_); }

  void dismiss() noexcept { ref_ = nullptr; }

 private:
  std::string* ref_;
};

class SecureBytes {
 public:
  explicit SecureBytes(std::vector<std::uint8_t>& ref) noexcept : ref_(&ref) {}
  SecureBytes(const SecureBytes&) = delete;
  SecureBytes& operator=(const SecureBytes&) = delete;
  SecureBytes(SecureBytes&& other) noexcept : ref_(other.ref_) { other.ref_ = nullptr; }
  SecureBytes& operator=(SecureBytes&&) = delete;
  ~SecureBytes() { if (ref_) secureWipeVector(*ref_); }

  void dismiss() noexcept { ref_ = nullptr; }

 private:
  std::vector<std::uint8_t>* ref_;
};

}  // namespace margelo::nitro::walletmgr
