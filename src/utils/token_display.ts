import { Asset } from '@stellar/stellar-sdk';

export const USDC_ASSET = new Asset('USDC', process.env.NEXT_PUBLIC_USDC_ISSUER || '');

export const BLND_ASSET = new Asset('BLND', process.env.NEXT_PUBLIC_BLND_ISSUER || '');
