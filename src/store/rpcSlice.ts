import { Network } from '@blend-capital/blend-sdk';
import { Horizon, SorobanRpc } from '@stellar/stellar-sdk';
import { StateCreator } from 'zustand';
import { DataStore } from './store';

export interface RPCSlice {
  network: Network & { horizonUrl: string };
  rpcServer: () => SorobanRpc.Server;
  setNetwork: (
    rpcUrl: string,
    newPassphrase: string,
    newHorizonUrl: string,
    opts?: SorobanRpc.Server.Options
  ) => void;

  horizonServer: () => Horizon.Server;
}

export const createRPCSlice: StateCreator<DataStore, [], [], RPCSlice> = (set, get) => ({
  network: {
    rpc: process.env.NEXT_PUBLIC_RPC_URL || 'https://soroban-testnet.stellar.org',
    passphrase: process.env.NEXT_PUBLIC_PASSPHRASE || 'Test SDF Network ; September 2015',
    opts: undefined,
    horizonUrl: process.env.NEXT_PUBLIC_HORIZON_URL || 'https://horizon-testnet.stellar.org',
  },
  rpcServer: () => {
    let network = get().network;
    return new SorobanRpc.Server(network.rpc, network.opts);
  },
  setNetwork: (newUrl, newPassphrase, horizonUrl: string, newOpts) =>
    set({ network: { rpc: newUrl, passphrase: newPassphrase, opts: newOpts, horizonUrl } }),
  horizonServer: () => {
    let network = get().network;
    return new Horizon.Server(network.horizonUrl, network.opts);
  },
});
