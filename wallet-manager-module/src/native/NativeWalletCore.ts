// =============================================================================
// NativeWalletCore.ts
// -----------------------------------------------------------------------------
// Runtime binding for the Nitro HybridObject defined in
// `src/specs/WalletCore.nitro.ts`. The spec file is the source of truth that
// nitrogen reads; this file just constructs the JS-side hybrid object and
// re-exports it for the rest of the app.
//
// Keep spec + binding separate:
//   - `.nitro.ts` files contain ONLY the interface (nitrogen parses strictly).
//   - This file holds runtime code that would confuse the parser.
// =============================================================================

import { NitroModules } from 'react-native-nitro-modules';
import type { WalletCore, DerivedKey } from '../specs/WalletCore.nitro';

// Back-compat alias for code that still imports the old spec name.
export type NativeWalletCoreSpec = WalletCore;
export type { WalletCore, DerivedKey };

// The string "WalletCore" must match:
//   - the autolinking key in nitro.json (`autolinking.WalletCore`)
//   - the spec interface name in WalletCore.nitro.ts
//   - the name registered by HybridObjectRegistry on the C++ side
export const NativeWalletCore =
  NitroModules.createHybridObject<WalletCore>('WalletCore');
