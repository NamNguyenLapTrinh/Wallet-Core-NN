export type TokenStandard = 'native' | 'erc20' | 'spl' | 'jetton' | 'brc20';

export type Token = {
  id: string;
  chain: string;
  standard: TokenStandard;
  contractAddress?: string;
  symbol: string;
  name: string;
  decimals: number;
  iconUri?: string;
};

export type TokenBalance = {
  tokenId: string;
  accountId: string;
  amount: string;
  amountFormatted: string;
  fiatValue?: string;
  fiatCurrency?: string;
  updatedAt: number;
};

export const NATIVE_TOKENS: Record<string, Token> = {
  ethereum: {
    id: 'eth-native',
    chain: 'ethereum',
    standard: 'native',
    symbol: 'ETH',
    name: 'Ethereum',
    decimals: 18,
  },
  bitcoin: {
    id: 'btc-native',
    chain: 'bitcoin',
    standard: 'native',
    symbol: 'BTC',
    name: 'Bitcoin',
    decimals: 8,
  },
  solana: {
    id: 'sol-native',
    chain: 'solana',
    standard: 'native',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
  },
  ton: {
    id: 'ton-native',
    chain: 'ton',
    standard: 'native',
    symbol: 'TON',
    name: 'TON',
    decimals: 9,
  },
};
