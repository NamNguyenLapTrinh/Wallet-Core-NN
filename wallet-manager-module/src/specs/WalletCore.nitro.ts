// =============================================================================
// WalletCore.nitro.ts
// -----------------------------------------------------------------------------
// Nitro spec file. nitrogen scans **/*.nitro.ts for interfaces extending
// HybridObject and generates the C++/Swift/Kotlin spec bases + JS autolinking.
//
// Run codegen with:
//   pnpm nitrogen        (from repo root)
//   # or
//   pnpm --filter wallet-manager-module nitrogen
//
// Generated tree:
//   nitrogen/generated/
//     shared/c++/HybridWalletCoreSpec.{hpp,cpp}    ← pure-virtual base
//     ios/c++/...                                  ← iOS autolinking glue
//     android/c++/...                              ← Android autolinking glue
//
// IMPORTANT: keep this file PURE SPEC (interface + supporting types only).
// Do NOT add runtime imports / calls — nitrogen parses it strictly.
// =============================================================================

import type { HybridObject } from 'react-native-nitro-modules';

export type DerivedKey = {
  address: string;
  publicKey: string;
};

export interface WalletCore extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  // Mnemonic / random keys
  generateSeedPhrase(strength: number): Promise<string>;
  validateMnemonic(mnemonic: string): Promise<boolean>;
  generatePrivateKey(): Promise<string>;
  validatePrivateKey(privateKey: string, twCoinType: number): Promise<boolean>;

  // Derivation
  derivedKey(
    mnemonic: string,
    twCoinType: number,
    path: string,
  ): Promise<DerivedKey>;
  derivedKeys(
    mnemonic: string,
    twCoinType: number,
    paths: string[],
  ): Promise<DerivedKey[]>;
  derivePrivateKey(
    mnemonic: string,
    twCoinType: number,
    path: string,
  ): Promise<string>;
  addressFromPrivateKey(
    privateKey: string,
    twCoinType: number,
  ): Promise<DerivedKey>;

  // Signing
  signTransaction(
    twCoinType: number,
    inputB64: string,
    privateKey: string,
  ): Promise<string>;
  signMessage(
    twCoinType: number,
    message: string,
    privateKey: string,
  ): Promise<string>;
}
