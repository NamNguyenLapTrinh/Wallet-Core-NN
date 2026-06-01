import { CHAINS } from '../types';

export const isSupportedChain = (chain: string): boolean => chain in CHAINS;

export const isLikelyMnemonic = (s: string): boolean => {
  const words = s.trim().split(/\s+/);
  return [12, 15, 18, 21, 24].includes(words.length);
};

export const isHexPrivateKey = (s: string): boolean =>
  /^(0x)?[0-9a-fA-F]{64}$/.test(s.trim());
