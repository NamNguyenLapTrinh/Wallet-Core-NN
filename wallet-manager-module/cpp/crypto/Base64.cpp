// =============================================================================
// Base64.cpp
// -----------------------------------------------------------------------------
// Hardened base64 codec:
//   - Strict input validation (length % 4, allowed alphabet, pad position).
//   - Pre-reserved output buffer (no realloc churn).
//   - Throws typed InvalidBase64Error on any defect.
//   - No locale, no allocator surprises.
// =============================================================================

#include "Base64.hpp"
#include "exceptions/WalletCoreException.hpp"

#include <array>

namespace margelo::nitro::walletmgr {

namespace {

constexpr const char* kB64Alphabet =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

constexpr std::array<int, 256> buildDecodeTable() noexcept {
  std::array<int, 256> t{};
  for (auto& v : t) v = -1;
  for (int i = 0; i < 64; ++i) {
    t[static_cast<unsigned char>(kB64Alphabet[i])] = i;
  }
  return t;
}

const std::array<int, 256>& decodeTable() noexcept {
  static const auto t = buildDecodeTable();
  return t;
}

}  // namespace

std::string base64Encode(const std::vector<std::uint8_t>& bytes) {
  std::string out;
  const std::size_t n = bytes.size();
  out.reserve(((n + 2) / 3) * 4);
  for (std::size_t i = 0; i < n; i += 3) {
    std::uint32_t v = static_cast<std::uint32_t>(bytes[i]) << 16;
    if (i + 1 < n) v |= static_cast<std::uint32_t>(bytes[i + 1]) << 8;
    if (i + 2 < n) v |= static_cast<std::uint32_t>(bytes[i + 2]);

    out.push_back(kB64Alphabet[(v >> 18) & 0x3F]);
    out.push_back(kB64Alphabet[(v >> 12) & 0x3F]);
    out.push_back(i + 1 < n ? kB64Alphabet[(v >> 6) & 0x3F] : '=');
    out.push_back(i + 2 < n ? kB64Alphabet[v & 0x3F] : '=');
  }
  return out;
}

std::vector<std::uint8_t> base64Decode(std::string_view in) {
  if (in.empty()) return {};
  if ((in.size() & 3U) != 0U) {
    throw InvalidBase64Error("length must be a multiple of 4");
  }

  const auto& tbl = decodeTable();
  std::vector<std::uint8_t> out;
  out.reserve((in.size() / 4) * 3);

  for (std::size_t i = 0; i < in.size(); i += 4) {
    const char c1 = in[i];
    const char c2 = in[i + 1];
    const char c3 = in[i + 2];
    const char c4 = in[i + 3];

    // Pad characters may only appear in the very last group, and only at
    // positions 3 and 4. (c3 alone padded → 1 byte output, c3+c4 padded → 2.)
    const bool last = (i + 4 == in.size());
    const int a = tbl[static_cast<unsigned char>(c1)];
    const int b = tbl[static_cast<unsigned char>(c2)];
    if (a < 0 || b < 0) {
      throw InvalidBase64Error("illegal character in head");
    }

    int c = -1;
    int d = -1;
    bool pad3 = false;
    bool pad4 = false;
    if (c3 == '=') {
      if (!last) throw InvalidBase64Error("pad before final group");
      pad3 = true;
      c = 0;
    } else {
      c = tbl[static_cast<unsigned char>(c3)];
      if (c < 0) throw InvalidBase64Error("illegal character");
    }
    if (c4 == '=') {
      if (!last) throw InvalidBase64Error("pad before final group");
      pad4 = true;
      d = 0;
    } else {
      d = tbl[static_cast<unsigned char>(c4)];
      if (d < 0) throw InvalidBase64Error("illegal character");
    }
    if (pad3 && !pad4) {
      throw InvalidBase64Error("invalid padding");
    }

    const std::uint32_t v =
        (static_cast<std::uint32_t>(a) << 18) |
        (static_cast<std::uint32_t>(b) << 12) |
        (static_cast<std::uint32_t>(c) << 6) |
        (static_cast<std::uint32_t>(d));

    out.push_back(static_cast<std::uint8_t>((v >> 16) & 0xFF));
    if (!pad3) out.push_back(static_cast<std::uint8_t>((v >> 8) & 0xFF));
    if (!pad4) out.push_back(static_cast<std::uint8_t>(v & 0xFF));
  }

  return out;
}

}  // namespace margelo::nitro::walletmgr
