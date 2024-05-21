import { Contract, nativeToScVal } from '@stellar/stellar-sdk';

export class CometClient {
  comet: Contract;

  constructor(address: string) {
    this.comet = new Contract(address);
  }
  /**
 * 
    token_in: Address,
    token_amount_in: i128,
    min_pool_amount_out: i128,
    user: Address,
 */
  public depositTokenInGetLPOut(
    depositTokenAddress: string,
    depositTokenAmount: bigint,
    minLPTokenAmount: bigint,
    user: string
  ) {
    const invokeArgs = {
      method: 'dep_tokn_amt_in_get_lp_tokns_out',
      args: [
        nativeToScVal(depositTokenAddress, { type: 'address' }),
        nativeToScVal(depositTokenAmount, { type: 'i128' }),
        nativeToScVal(minLPTokenAmount, { type: 'i128' }),
        nativeToScVal(user, { type: 'address' }),
      ],
    };
    const operation = this.comet.call(invokeArgs.method, ...invokeArgs.args);
    return operation;
  }
  /**
  // To get Y amount of LP tokens, how much of token will be required
        token_in: Address,
        pool_amount_out: i128,
        max_amount_in: i128,
        user: Address,
 */
  public getTokenAmountInByLPAmount(
    depositTokenAddress: string,
    LPTokenAmount: bigint,
    maxDepositTokenAmount: bigint,
    user: string
  ) {
    const invokeArgs = {
      method: 'dep_lp_tokn_amt_out_get_tokn_in',
      args: [
        nativeToScVal(depositTokenAddress, { type: 'address' }),
        nativeToScVal(LPTokenAmount, { type: 'i128' }),
        nativeToScVal(maxDepositTokenAmount, { type: 'i128' }),
        nativeToScVal(user, { type: 'address' }),
      ],
    };
    const operation = this.comet.call(invokeArgs.method, ...invokeArgs.args);
    return operation;
  }
}
export interface cometPoolDepositArgs {
  depositTokenAddress: string;
  depositTokenAmount: bigint;
  minLPTokenAmount: bigint;
  user: string;
}

export interface cometPoolGetDepositAmountByLPArgs {
  depositTokenAddress: string;
  LPTokenAmount: bigint;
  maxDepositTokenAmount: bigint;
  user: string;
}
