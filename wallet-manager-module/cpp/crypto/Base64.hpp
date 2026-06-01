#pragma once

#include <cstdint>
#include <string>
#include <string_view>
#include <vector>

namespace margelo::nitro::walletmgr {

[[nodiscard]] std::string base64Encode(const std::vector<std::uint8_t>& bytes);

// Throws InvalidBase64Error on any invalid input: bad length, illegal char,
// pad in wrong position. Whitespace is NOT silently stripped — caller's job.
[[nodiscard]] std::vector<std::uint8_t> base64Decode(std::string_view in);

}  // namespace margelo::nitro::walletmgr
