import type { IWalletCoreAdapter } from '../adapters/IWalletCoreAdapter';
import type { ISecureStorage } from '../storage/ISecureStorage';
import { KeyringFactory } from '../keyring/KeyringFactory';
import type { IKeyring } from '../keyring/IKeyring';
import { walletStore } from '../state/walletStore';
import { newId } from '../utils/id';
import { wipeString } from '../utils/memory';
import { WalletError, ERR } from '../types/errors';
import type { Wallet, WalletAccount, KeyringMeta } from '../types';
import { CHAINS } from '../types';

const META_KEY = 'wallet.meta.v1';

type PersistedMeta = {
  wallets: Wallet[];
  accounts: WalletAccount[];
  keyrings: KeyringMeta[];
  activeWalletId?: string;
  activeAccountId?: string;
};

export type WalletManagerDeps = {
  adapter: IWalletCoreAdapter;
  storage: ISecureStorage;
};

export class WalletManager {
  private readonly adapter: IWalletCoreAdapter;
  private readonly storage: ISecureStorage;
  private readonly factory: KeyringFactory;
  private readonly keyrings = new Map<string, IKeyring>();
  private keyringMeta: KeyringMeta[] = [];

  constructor(deps: WalletManagerDeps) {
    this.adapter = deps.adapter;
    this.storage = deps.storage;
    this.factory = new KeyringFactory({
      adapter: this.adapter,
      storage: this.storage,
    });
  }

  async initialize(): Promise<void> {
    let raw: string | null;
    try {
      raw = await this.storage.getItem(META_KEY);
    } catch {
      // Storage read failed (hardware error, passcode removed, etc.).
      // Re-throw so the caller can show an error instead of silently
      // treating the user as having no wallet.
      throw new WalletError(
        ERR.STORAGE_FAILURE,
        'failed to read wallet metadata',
      );
    }
    if (!raw) {
      walletStore.getState().hydrate({
        initialized: true,
        locked: false,
        hydrated: true,
      });
      return;
    }
    const meta: PersistedMeta = JSON.parse(raw);
    this.keyringMeta = meta.keyrings;
    for (const km of meta.keyrings) {
      this.keyrings.set(km.id, this.factory.create(this.metaToInput(km, meta)));
    }
    walletStore.getState().hydrate({
      initialized: true,
      locked: true,
      hydrated: true,
      wallets: meta.wallets,
      accounts: meta.accounts,
      activeWalletId: meta.activeWalletId,
      activeAccountId: meta.activeAccountId,
    });
  }

  async createWallet(opts: { name?: string; chain?: string } = {}): Promise<{
    wallet: Wallet;
    account: WalletAccount;
    mnemonic: string;
  }> {
    const chain = opts.chain ?? 'ethereum';
    this.requireChain(chain);
    const mnemonic = await this.adapter.generateSeedPhrase(128);
    const result = await this.createHDWalletFromMnemonic(
      mnemonic,
      opts.name,
      chain,
    );
    return { ...result, mnemonic };
  }

  async restoreWallet(opts: {
    mnemonic: string;
    name?: string;
    chain?: string;
  }): Promise<{ wallet: Wallet; account: WalletAccount }> {
    const chain = opts.chain ?? 'ethereum';
    this.requireChain(chain);
    const ok = await this.adapter.validateMnemonic(opts.mnemonic);
    if (!ok) throw new WalletError(ERR.INVALID_MNEMONIC, 'invalid mnemonic');
    return this.createHDWalletFromMnemonic(opts.mnemonic, opts.name, chain);
  }

  async importPrivateKey(opts: {
    privateKey: string;
    chain: string;
    name?: string;
  }): Promise<{ wallet: Wallet; account: WalletAccount }> {
    this.requireChain(opts.chain);
    const valid = await this.adapter.validatePrivateKey(
      opts.privateKey,
      opts.chain,
    );
    if (!valid)
      throw new WalletError(ERR.INVALID_PRIVATE_KEY, 'invalid private key');

    const walletId = newId('wlt');
    const keyringId = newId('kr');
    const storageKey = `kr.${keyringId}.pk`;

    await this.storage.setItem(storageKey, opts.privateKey, {
      requireBiometric: true,
    });
    wipeString(opts.privateKey);

    const keyring = this.factory.create({
      type: 'imported',
      id: keyringId,
      storageKey,
      chain: opts.chain,
    });
    this.keyrings.set(keyringId, keyring);

    const derived = await keyring.deriveAccount(opts.chain, 0);
    const wallet: Wallet = {
      id: walletId,
      name: opts.name ?? 'Imported',
      type: 'imported',
      createdAt: Date.now(),
      keyringId,
      chains: [opts.chain],
    };
    const account: WalletAccount = {
      id: newId('acc'),
      walletId,
      address: derived.address,
      publicKey: derived.publicKey,
      index: 0,
      path: derived.path,
      chain: opts.chain,
      type: 'imported',
    };

    this.keyringMeta.push({ id: keyringId, type: 'imported', storageKey });
    await this.commit(s => {
      s.wallets.push(wallet);
      s.accounts.push(account);
      s.activeWalletId = walletId;
      s.activeAccountId = account.id;
    });
    return { wallet, account };
  }

  async addAccount(opts: {
    walletId: string;
    chain: string;
  }): Promise<WalletAccount> {
    const state = walletStore.getState();
    const wallet = state.wallets.find(w => w.id === opts.walletId);
    if (!wallet) throw new WalletError(ERR.WALLET_NOT_FOUND, opts.walletId);
    if (wallet.type !== 'hd') {
      throw new WalletError(
        ERR.KEYRING_TYPE_UNSUPPORTED,
        'only HD wallets can add accounts',
      );
    }
    this.requireChain(opts.chain);

    const keyring = this.keyrings.get(wallet.keyringId);
    if (!keyring) throw new WalletError(ERR.NOT_INITIALIZED, 'keyring missing');

    const usedIndexes = state.accounts
      .filter(a => a.walletId === opts.walletId && a.chain === opts.chain)
      .map(a => a.index);
    const nextIndex =
      usedIndexes.length === 0 ? 0 : Math.max(...usedIndexes) + 1;

    const derived = await keyring.deriveAccount(opts.chain, nextIndex);
    const account: WalletAccount = {
      id: newId('acc'),
      walletId: wallet.id,
      address: derived.address,
      publicKey: derived.publicKey,
      index: nextIndex,
      path: derived.path,
      chain: opts.chain,
      type: 'hd',
    };

    await this.commit(s => {
      s.accounts.push(account);
      const w = s.wallets.find(x => x.id === wallet.id)!;
      if (!w.chains.includes(opts.chain)) {
        w.chains = [...w.chains, opts.chain];
      }
    });
    return account;
  }

  async removeAccount(accountId: string): Promise<void> {
    await this.commit(s => {
      s.accounts = s.accounts.filter(a => a.id !== accountId);
      if (s.activeAccountId === accountId) {
        s.activeAccountId = s.accounts[0]?.id;
      }
    });
  }

  async switchAccount(accountId: string): Promise<void> {
    const state = walletStore.getState();
    const acc = state.accounts.find(a => a.id === accountId);
    if (!acc) throw new WalletError(ERR.ACCOUNT_NOT_FOUND, accountId);
    await this.commit(s => {
      s.activeAccountId = accountId;
      s.activeWalletId = acc.walletId;
    });
  }

  async removeWallet(walletId: string): Promise<void> {
    const wallet = walletStore.getState().wallets.find(w => w.id === walletId);
    if (!wallet) return;
    const km = this.keyringMeta.find(k => k.id === wallet.keyringId);
    if (km) await this.storage.removeItem(km.storageKey);
    this.keyrings.delete(wallet.keyringId);
    this.keyringMeta = this.keyringMeta.filter(k => k.id !== wallet.keyringId);
    await this.commit(s => {
      s.wallets = s.wallets.filter(w => w.id !== walletId);
      s.accounts = s.accounts.filter(a => a.walletId !== walletId);
      if (s.activeWalletId === walletId) {
        s.activeWalletId = s.wallets[0]?.id;
        s.activeAccountId = s.accounts.find(
          a => a.walletId === s.activeWalletId,
        )?.id;
      }
    });
  }

  // Verifies the user can authenticate to access each HD keyring's mnemonic,
  // then immediately wipes the value. Nothing is cached — every subsequent
  // sign/derive will prompt again.
  async unlock(): Promise<void> {
    for (const km of this.keyringMeta) {
      if (km.type !== 'hd') continue;
      const m = await this.storage.getItem(km.storageKey, {
        requireBiometric: true,
        promptMessage: 'Unlock wallet',
      });
      console.log('Unlocking keyring', km.id, km.type, km, m);

      if (!m) throw new WalletError(ERR.AUTH_FAILED, 'auth failed');

      wipeString(m);
    }
    walletStore.getState().setLocked(false);
  }

  lock(): void {
    for (const k of this.keyrings.values()) k.lock();
    walletStore.getState().setLocked(true);
  }

  async signTransaction(accountId: string, inputB64: string): Promise<string> {
    const acc = this.requireAccount(accountId);
    const keyring = this.requireKeyring(acc.walletId);
    let pk = await keyring.exportPrivateKey(acc.chain, acc.index);
    try {
      return await this.adapter.signTransaction({
        chain: acc.chain,
        input: inputB64,
        privateKey: pk,
      });
    } finally {
      wipeString(pk);
      pk = '';
    }
  }

  async signMessage(accountId: string, message: string): Promise<string> {
    const acc = this.requireAccount(accountId);
    const keyring = this.requireKeyring(acc.walletId);
    let pk = await keyring.exportPrivateKey(acc.chain, acc.index);

    try {
      return await this.adapter.signMessage({
        chain: acc.chain,
        message,
        privateKey: pk,
      });
    } finally {
      wipeString(pk);
      pk = '';
    }
  }

  private async createHDWalletFromMnemonic(
    mnemonic: string,
    name: string | undefined,
    chain: string,
  ): Promise<{ wallet: Wallet; account: WalletAccount }> {
    const walletId = newId('wlt');
    const keyringId = newId('kr');
    const storageKey = `kr.${keyringId}.mnemonic`;

    await this.storage.setItem(storageKey, mnemonic, {
      requireBiometric: true,
    });

    const keyring = this.factory.create({
      type: 'hd',
      id: keyringId,
      storageKey,
    });
    this.keyrings.set(keyringId, keyring);

    // Derive the first account from the in-scope mnemonic directly.
    // Going through `keyring.deriveAccount` would trigger a second Keychain
    // biometric prompt right after the setItem above.
    const derived = await this.adapter.derivedKey({
      mnemonic,
      chain,
      index: 0,
    });
    wipeString(mnemonic);

    const wallet: Wallet = {
      id: walletId,
      name: name ?? `Wallet ${Date.now()}`,
      type: 'hd',
      createdAt: Date.now(),
      keyringId,
      chains: [chain],
    };
    const account: WalletAccount = {
      id: newId('acc'),
      walletId,
      address: derived.address,
      publicKey: derived.publicKey,
      index: 0,
      path: derived.path,
      chain,
      type: 'hd',
    };

    this.keyringMeta.push({ id: keyringId, type: 'hd', storageKey });
    await this.commit(s => {
      s.wallets.push(wallet);
      s.accounts.push(account);
      s.activeWalletId = walletId;
      s.activeAccountId = account.id;
    });
    walletStore.getState().setLocked(false);
    walletStore.getState().setInitialized(true);
    return { wallet, account };
  }

  private metaToInput(km: KeyringMeta, persisted: PersistedMeta) {
    if (km.type === 'hd') {
      return { type: 'hd' as const, id: km.id, storageKey: km.storageKey };
    }
    if (km.type === 'imported') {
      const wallet = persisted.wallets.find(w => w.keyringId === km.id)!;
      return {
        type: 'imported' as const,
        id: km.id,
        storageKey: km.storageKey,
        chain: wallet.chains[0],
      };
    }
    const account = persisted.accounts.find(
      a =>
        persisted.wallets.find(w => w.id === a.walletId)?.keyringId === km.id,
    )!;
    return {
      type: 'watch' as const,
      id: km.id,
      address: account.address,
      publicKey: account.publicKey,
      chain: account.chain,
    };
  }

  private requireAccount(id: string): WalletAccount {
    const acc = walletStore.getState().accounts.find(a => a.id === id);
    if (!acc) throw new WalletError(ERR.ACCOUNT_NOT_FOUND, id);
    return acc;
  }

  private requireKeyring(walletId: string): IKeyring {
    const wallet = walletStore.getState().wallets.find(w => w.id === walletId);
    if (!wallet) throw new WalletError(ERR.WALLET_NOT_FOUND, walletId);
    const k = this.keyrings.get(wallet.keyringId);
    if (!k) throw new WalletError(ERR.LOCKED, 'keyring not loaded');
    return k;
  }

  private requireChain(chain: string) {
    if (!CHAINS[chain]) throw new WalletError(ERR.CHAIN_UNSUPPORTED, chain);
  }

  private async commit(mutator: (s: PersistedMeta) => void) {
    const state = walletStore.getState();
    const next: PersistedMeta = {
      wallets: state.wallets.map(w => ({ ...w, chains: [...w.chains] })),
      accounts: [...state.accounts],
      keyrings: this.keyringMeta,
      activeWalletId: state.activeWalletId,
      activeAccountId: state.activeAccountId,
    };
    mutator(next);
    walletStore.getState().hydrate({
      initialized: true,
      locked: state.locked,
      wallets: next.wallets,
      accounts: next.accounts,
      activeWalletId: next.activeWalletId,
      activeAccountId: next.activeAccountId,
    });
    this.keyringMeta = next.keyrings;
    await this.storage.setItem(META_KEY, JSON.stringify(next));
  }
}
