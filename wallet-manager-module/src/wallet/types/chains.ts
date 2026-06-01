export type Curve = 'secp256k1' | 'ed25519' | 'ed25519-blake2b' | 'nist256p1';

export type ChainConfig = {
  id: string;
  coinType: number;
  curve: Curve;
  derivationTemplate: string;
  twCoinType: number;
};

export const CHAINS: Record<string, ChainConfig> = {
  ethereum: {
    id: 'ethereum',
    coinType: 60,
    curve: 'secp256k1',
    derivationTemplate: "m/44'/60'/0'/0/{index}",
    twCoinType: 60,
  },
  bitcoin: {
    id: 'bitcoin',
    coinType: 0,
    curve: 'secp256k1',
    derivationTemplate: "m/84'/0'/0'/0/{index}",
    twCoinType: 0,
  },
  solana: {
    id: 'solana',
    coinType: 501,
    curve: 'ed25519',
    derivationTemplate: "m/44'/501'/{index}'/0'",
    twCoinType: 501,
  },
  ton: {
    id: 'ton',
    coinType: 607,
    curve: 'ed25519',
    derivationTemplate: "m/44'/607'/{index}'",
    twCoinType: 607,
  },
};

export const resolvePath = (chain: ChainConfig, index: number): string =>
  chain.derivationTemplate.replace('{index}', String(index));
