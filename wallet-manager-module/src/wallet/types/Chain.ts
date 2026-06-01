export type ChainId = 'ethereum' | 'bitcoin' | 'solana' | 'ton';

export type ChainMeta = {
  id: ChainId;
  name: string;
  symbol: string;
  decimals: number;
  explorerUrl: (addressOrTx: string) => string;
  iconUri?: string;
};

export const CHAIN_META: Record<ChainId, ChainMeta> = {
  ethereum: {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
    explorerUrl: (id) => `https://etherscan.io/address/${id}`,
  },
  bitcoin: {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    decimals: 8,
    explorerUrl: (id) => `https://mempool.space/address/${id}`,
  },
  solana: {
    id: 'solana',
    name: 'Solana',
    symbol: 'SOL',
    decimals: 9,
    explorerUrl: (id) => `https://solscan.io/account/${id}`,
  },
  ton: {
    id: 'ton',
    name: 'TON',
    symbol: 'TON',
    decimals: 9,
    explorerUrl: (id) => `https://tonscan.org/address/${id}`,
  },
};

export const ALL_CHAINS: ChainId[] = ['ethereum', 'bitcoin', 'solana', 'ton'];
