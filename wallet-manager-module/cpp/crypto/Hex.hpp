#pragma once

// =============================================================================
// Hex.hpp
// -----------------------------------------------------------------------------
// Constant-time-ish, allocation-conscious hex codec.
//   - hexEncode: no allocations beyond the result string (reserve up front).
//   - hexDecode: validates strict 0-9a-fA-F, throws InvalidHexError on any
//     stray byte. Optional "0x"/"0X" prefix stripped.
// =============================================================================

#include "exceptions/WalletCoreException.hpp"

#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

namespace margelo::nitro::walletmgr {

[[nodiscard]] inline std::string hexEncode(const std::vector<std::uint8_t>& bytes,
                                           bool prefix = false) {
  static constexpr char kHex[] = "0123456789abcdef";
  std::string out;
  out.reserve(bytes.size() * 2 + (prefix ? 2 : 0));
  if (prefix) out.append("0x");
  for (auto b : bytes) {
    out.push_back(kHex[(b >> 4) & 0xF]);
    out.push_back(kHex[b & 0xF]);
  }
  return out;
}

[[nodiscard]] inline int hexNibble(char c) noexcept {
  if (c >= '0' && c <= '9') return c - '0';
  if (c >= 'a' && c <= 'f') return 10 + (c - 'a');
  if (c >= 'A' && c <= 'F') return 10 + (c - 'A');
  return -1;
}

[[nodiscard]] inline std::vector<std::uint8_t> hexDecode(std::string_view in) {
  std::string_view s = in;
  if (s.size() >= 2 && s[0] == '0' && (s[1] == 'x' || s[1] == 'X')) {
    s.remove_prefix(2);
  }
  if ((s.size() & 1U) != 0U) {
    throw InvalidHexError("hex string has odd length");
  }
  std::vector<std::uint8_t> out;
  out.reserve(s.size() / 2);
  for (std::size_t i = 0; i < s.size(); i += 2) {
    const int hi = hexNibble(s[i]);
    const int lo = hexNibble(s[i + 1]);
    if (hi < 0 || lo < 0) {
      throw InvalidHexError("hex string contains non-hex byte");
    }
    out.push_back(static_cast<std::uint8_t>((hi << 4) | lo));
  }
  return out;
}

}  // namespace margelo::nitro::walletmgr
