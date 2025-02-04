//! Collection of utility functions to help with Horizon data

import { Reserve } from '@blend-capital/blend-sdk';
import { Asset, Horizon } from '@stellar/stellar-sdk';

export function requiresTrustlineReserve(
  account: Horizon.AccountResponse | undefined,
  reserve: Reserve | undefined
): boolean {
  let asset = reserve?.tokenMetadata?.asset;
  return requiresTrustline(account, asset);
}

export function requiresTrustline(
  account: Horizon.AccountResponse | undefined,
  asset: Asset | undefined
): boolean {
  // no trustline required for unloaded account or asset
  if (!account || !asset) return false;
  /** @TODO this condition can prolly be improved */
  return !account.balances.some((balance) => {
    if (balance.asset_type == 'native') {
      return asset.isNative();
    }
    // @ts-ignore
    return balance.asset_code === asset.getCode() && balance.asset_issuer === asset.getIssuer();
  });
}

/**
 * Fetch the Stellar Assets reserve requirement for an account
 * @param account - The account
 * @param asset - The asset to fetch the reserve for
 * @returns The reserves required, or 0
 */
export function getAssetReserve(
  account: Horizon.AccountResponse | undefined,
  asset: Asset | undefined
): number {
  let stellar_reserve_amount = 0;
  if (asset && account) {
    let balanceLine = account.balances.find((x) => {
      if (x.asset_type == 'native') {
        return asset.isNative();
      } else if (x.asset_type == 'liquidity_pool_shares') {
        return false;
      } else {
        return x.asset_code == asset.getCode() && x.asset_issuer == asset.getIssuer();
      }
    });
    // @ts-ignore
    if (balanceLine?.selling_liabilities) {
      // @ts-ignore
      stellar_reserve_amount += Number(balanceLine?.selling_liabilities);
    }
    if (asset.isNative()) {
      stellar_reserve_amount += 1.5 + 0.5 * account.subentry_count; // add 1 XLM for gas headroom
    }
  }
  return stellar_reserve_amount;
}
