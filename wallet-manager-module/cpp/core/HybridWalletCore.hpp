#pragma once

// =============================================================================
// HybridWalletCore.hpp
// -----------------------------------------------------------------------------
// Nitro HybridObject — the C++ counterpart to WalletCore.nitro.ts.
//
// CONTRACT (per Nitro Modules docs)
//   - Every method on the spec returns `Promise<T>` in TS → C++ must return
//     `std::shared_ptr<Promise<T>>`. The implementation body runs on a worker
//     thread via `Promise<T>::async(...)`, so JS code that `await`s the call
//     doesn't block the JS runtime.
//   - Cross-bridge results use the nitrogen-generated `DerivedKey` struct
//     `{address, publicKey}`. Extra metadata (chain, path) doesn't cross —
//     callers resolve those on JS side from the inputs.
//
// SECURITY LIFECYCLE
//   - Mnemonic / private-key arguments are wiped before the worker returns.
//   - The legacy `derivePrivateKey` is marked deprecated. Prefer signing
//     on the native side.
// =============================================================================

// nitrogen-generated abstract base. Run `pnpm nitrogen` before compiling.
#include "HybridWalletCoreSpec.hpp"

#include <NitroModules/Promise.hpp>

#include <memory>
#include <string>
#include <vector>

namespace margelo::nitro::walletmgr {

class HybridWalletCore final : public HybridWalletCoreSpec {
 public:
  // Virtual-base initialisation: HybridObject is a virtual base of the
  // generated spec; the most-derived class must initialise it directly.
  HybridWalletCore() : HybridObject(TAG) {}
  ~HybridWalletCore() override = default;

  HybridWalletCore(const HybridWalletCore&) = delete;
  HybridWalletCore& operator=(const HybridWalletCore&) = delete;

  // ── Mnemonic / random keys ────────────────────────────────────────────
  std::shared_ptr<Promise<std::string>> generateSeedPhrase(double strength) override;
  std::shared_ptr<Promise<bool>>        validateMnemonic(const std::string& mnemonic) override;
  std::shared_ptr<Promise<std::string>> generatePrivateKey() override;
  std::shared_ptr<Promise<bool>>        validatePrivateKey(const std::string& privateKey,
                                                            double twCoinType) override;

  // ── Derivation ────────────────────────────────────────────────────────
  std::shared_ptr<Promise<DerivedKey>>              derivedKey(const std::string& mnemonic,
                                                                double twCoinType,
                                                                const std::string& path) override;
  std::shared_ptr<Promise<std::vector<DerivedKey>>> derivedKeys(const std::string& mnemonic,
                                                                 double twCoinType,
                                                                 const std::vector<std::string>& paths) override;

  /**
   * \warning UNSAFE — returns raw private key bytes to the JS layer.
   * Prefer native signing. Caller MUST wipe the result.
   */
  [[deprecated("Use native signing; export only behind biometric prompt")]]
  std::shared_ptr<Promise<std::string>> derivePrivateKey(const std::string& mnemonic,
                                                         double twCoinType,
                                                         const std::string& path) override;

  std::shared_ptr<Promise<DerivedKey>> addressFromPrivateKey(const std::string& privateKey,
                                                              double twCoinType) override;

  // ── Signing ───────────────────────────────────────────────────────────
  std::shared_ptr<Promise<std::string>> signTransaction(double twCoinType,
                                                         const std::string& inputB64,
                                                         const std::string& privateKey) override;
  std::shared_ptr<Promise<std::string>> signMessage(double twCoinType,
                                                     const std::string& message,
                                                     const std::string& privateKey) override;
};

}  // namespace margelo::nitro::walletmgr
