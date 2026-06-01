// =============================================================================
// HybridWalletCore.cpp
// -----------------------------------------------------------------------------
// Implementation — delegates all crypto to Trust Wallet Core.
//
// Per Nitro contract, every method returns std::shared_ptr<Promise<T>> and the
// blocking body runs on a worker thread via Promise<T>::async(...). This frees
// the JS thread for the duration of the crypto op.
//
// LIFECYCLE OF A PRIVATE KEY
//   JS → privateKeyHex
//     ↓ moved into worker lambda by value (no shared reference)
//     ↓ hexDecode → std::vector<uint8_t>
//     ↓ SecureBytes RAII guard wipes on every exit path
//     ↓ result resolves the Promise; secret never leaks back
// =============================================================================

#include "HybridWalletCore.hpp"

#include "address/AddressBuilder.hpp"
#include "chains/SupportedChain.hpp"
#include "crypto/Base64.hpp"
#include "crypto/Hex.hpp"
#include "exceptions/WalletCoreException.hpp"
#include "helpers/TWHelpers.hpp"
#include "memory/SecureMemory.hpp"
#include "signers/SignerRegistry.hpp"

#include <WalletCore/TWCoinType.h>
#include <WalletCore/TWCurve.h>
#include <WalletCore/TWHDWallet.h>
#include <WalletCore/TWMnemonic.h>
#include <WalletCore/TWPrivateKey.h>
#include <WalletCore/TWPublicKey.h>

#include <cmath>

namespace margelo::nitro::walletmgr {

namespace {

TWHDWalletPtr hdFromMnemonic(const std::string& mnemonic) {
  auto twMnemonic = makeTWString(mnemonic);
  if (!TWMnemonicIsValid(twMnemonic.get())) {
    throw InvalidMnemonicError("BIP39 validation failed");
  }
  auto pass = makeTWString("");
  TWHDWalletPtr w(TWHDWalletCreateWithMnemonic(twMnemonic.get(), pass.get()));
  if (!w) throw InvalidMnemonicError("HD wallet construction failed");
  return w;
}

bool isAcceptableStrength(int s) noexcept {
  return s == 128 || s == 160 || s == 192 || s == 224 || s == 256;
}

bool isPlausiblePath(std::string_view p) noexcept {
  return !p.empty() && (p.front() == 'm' || p.front() == 'M');
}

DerivedKey deriveOne(TWHDWallet* wallet, SupportedChain chain, const std::string& path) {
  if (!isPlausiblePath(path)) throw InvalidPathError("path must start with 'm/'");
  const auto& spec = specOf(chain);
  auto pathStr = makeTWString(path);
  TWPrivateKeyPtr pk(TWHDWalletGetKey(wallet, spec.twCoinType, pathStr.get()));
  if (!pk) throw AddressDerivationError("HD derivation failed for path");

  auto pub = publicKeyForChain(pk.get(), chain);
  const std::string address = addressForPublicKey(pub.get(), chain);

  TWDataPtr pubData(TWPublicKeyData(pub.get()));
  auto pubBytes = twDataToBytes(pubData.get());
  return DerivedKey{address, hexEncode(pubBytes, /*prefix=*/true)};
}

DerivedKey buildDerivedFromPrivateKey(std::vector<std::uint8_t>& pkBytes, SupportedChain chain) {
  const auto& spec = specOf(chain);
  auto d = makeTWData(pkBytes);
  if (!TWPrivateKeyIsValid(d.get(), TWCoinTypeCurve(spec.twCoinType))) {
    throw InvalidPrivateKeyError("not valid for chain curve");
  }
  TWPrivateKeyPtr pk(TWPrivateKeyCreateWithData(d.get()));
  if (!pk) throw InvalidPrivateKeyError("cannot construct TWPrivateKey");

  auto pub = publicKeyForChain(pk.get(), chain);
  const std::string address = addressForPublicKey(pub.get(), chain);
  TWDataPtr pubData(TWPublicKeyData(pub.get()));
  auto pubBytes = twDataToBytes(pubData.get());
  return DerivedKey{address, hexEncode(pubBytes, /*prefix=*/true)};
}

}  // namespace

// ── Mnemonic / keys ─────────────────────────────────────────────────────────

std::shared_ptr<Promise<std::string>>
HybridWalletCore::generateSeedPhrase(double strength) {
  return Promise<std::string>::async([strength]() -> std::string {
    if (!std::isfinite(strength)) {
      throw InvalidArgumentError("strength is not finite");
    }
    const int s = static_cast<int>(std::llround(strength));
    if (!isAcceptableStrength(s)) {
      throw InvalidArgumentError("strength must be 128/160/192/224/256");
    }
    auto pass = makeTWString("");
    TWHDWalletPtr w(TWHDWalletCreate(s, pass.get()));
    if (!w) throw InternalWalletCoreError("HD wallet create failed");
    TWStringPtr mn(TWHDWalletMnemonic(w.get()));
    if (!mn) throw InternalWalletCoreError("mnemonic extraction failed");
    return twStringToStd(mn.get());
  });
}

std::shared_ptr<Promise<bool>>
HybridWalletCore::validateMnemonic(const std::string& mnemonic) {
  return Promise<bool>::async([mnemonic]() -> bool {
    auto m = makeTWString(mnemonic);
    return TWMnemonicIsValid(m.get());
  });
}

std::shared_ptr<Promise<std::string>>
HybridWalletCore::generatePrivateKey() {
  return Promise<std::string>::async([]() -> std::string {
    TWPrivateKeyPtr pk(TWPrivateKeyCreate());
    if (!pk) throw InternalWalletCoreError("private key generation failed");
    TWDataPtr d(TWPrivateKeyData(pk.get()));
    auto bytes = twDataToBytes(d.get());
    SecureBytes guard(bytes);
    return hexEncode(bytes, /*prefix=*/true);
  });
}

std::shared_ptr<Promise<bool>>
HybridWalletCore::validatePrivateKey(const std::string& privateKey, double twCoinType) {
  return Promise<bool>::async([privateKey, twCoinType]() -> bool {
    const auto chain = chainFromJsCoinType(twCoinType);
    auto bytes = hexDecode(privateKey);
    SecureBytes guard(bytes);
    auto d = makeTWData(bytes);
    const TWCurve curve = TWCoinTypeCurve(specOf(chain).twCoinType);
    return TWPrivateKeyIsValid(d.get(), curve);
  });
}

// ── Derivation ──────────────────────────────────────────────────────────────

std::shared_ptr<Promise<DerivedKey>>
HybridWalletCore::derivedKey(const std::string& mnemonic,
                             double twCoinType,
                             const std::string& path) {
  return Promise<DerivedKey>::async([mnemonic, twCoinType, path]() -> DerivedKey {
    const auto chain = chainFromJsCoinType(twCoinType);
    auto wallet = hdFromMnemonic(mnemonic);
    return deriveOne(wallet.get(), chain, path);
  });
}

std::shared_ptr<Promise<std::vector<DerivedKey>>>
HybridWalletCore::derivedKeys(const std::string& mnemonic,
                              double twCoinType,
                              const std::vector<std::string>& paths) {
  return Promise<std::vector<DerivedKey>>::async(
      [mnemonic, twCoinType, paths]() -> std::vector<DerivedKey> {
        const auto chain = chainFromJsCoinType(twCoinType);
        auto wallet = hdFromMnemonic(mnemonic);
        std::vector<DerivedKey> out;
        out.reserve(paths.size());
        for (const auto& p : paths) {
          out.push_back(deriveOne(wallet.get(), chain, p));
        }
        return out;
      });
}

std::shared_ptr<Promise<std::string>>
HybridWalletCore::derivePrivateKey(const std::string& mnemonic,
                                    double twCoinType,
                                    const std::string& path) {
  return Promise<std::string>::async([mnemonic, twCoinType, path]() -> std::string {
    const auto chain = chainFromJsCoinType(twCoinType);
    if (!isPlausiblePath(path)) throw InvalidPathError("path must start with 'm/'");
    auto wallet = hdFromMnemonic(mnemonic);
    auto pathStr = makeTWString(path);
    TWPrivateKeyPtr pk(TWHDWalletGetKey(wallet.get(), specOf(chain).twCoinType, pathStr.get()));
    if (!pk) throw AddressDerivationError("HD derivation failed for path");
    TWDataPtr d(TWPrivateKeyData(pk.get()));
    auto bytes = twDataToBytes(d.get());
    SecureBytes guard(bytes);
    return hexEncode(bytes, /*prefix=*/true);
  });
}

std::shared_ptr<Promise<DerivedKey>>
HybridWalletCore::addressFromPrivateKey(const std::string& privateKey, double twCoinType) {
  return Promise<DerivedKey>::async([privateKey, twCoinType]() -> DerivedKey {
    const auto chain = chainFromJsCoinType(twCoinType);
    auto bytes = hexDecode(privateKey);
    SecureBytes guard(bytes);
    return buildDerivedFromPrivateKey(bytes, chain);
  });
}

// ── Signing ─────────────────────────────────────────────────────────────────

std::shared_ptr<Promise<std::string>>
HybridWalletCore::signTransaction(double twCoinType,
                                   const std::string& inputB64,
                                   const std::string& privateKey) {
  return Promise<std::string>::async(
      [twCoinType, inputB64, privateKey]() -> std::string {
        const auto chain = chainFromJsCoinType(twCoinType);
        auto input = base64Decode(inputB64);
        auto pkBytes = hexDecode(privateKey);
        SecureBytes pkGuard(pkBytes);

        const auto& signer = signerFor(chain);
        auto signed_ = signer.signTransaction(input, pkBytes);
        return base64Encode(signed_);
      });
}

std::shared_ptr<Promise<std::string>>
HybridWalletCore::signMessage(double twCoinType,
                               const std::string& message,
                               const std::string& privateKey) {
  return Promise<std::string>::async(
      [twCoinType, message, privateKey]() -> std::string {
        const auto chain = chainFromJsCoinType(twCoinType);
        auto pkBytes = hexDecode(privateKey);
        SecureBytes pkGuard(pkBytes);

        const auto& signer = signerFor(chain);
        return signer.signMessage(message, pkBytes);
      });
}

}  // namespace margelo::nitro::walletmgr
