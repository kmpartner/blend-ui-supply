import {
  parseResult,
  PoolContract,
  PositionEstimates,
  RequestType,
  SubmitArgs,
  UserPositions,
} from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { SorobanRpc } from '@stellar/stellar-sdk';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useSettings, ViewType } from '../../contexts';
import { TxStatus, TxType, useWallet } from '../../contexts/wallet';
import { RPC_DEBOUNCE_DELAY, useDebouncedState } from '../../hooks/debounce';
import { useStore } from '../../store/store';
import { toBalance, toPercentage } from '../../utils/formatter';
import { getAssetReserve } from '../../utils/horizon';
import { scaleInputToBigInt } from '../../utils/scval';
import { getErrorFromSim } from '../../utils/txSim';
import { AnvilAlert } from '../common/AnvilAlert';
import { InputBar } from '../common/InputBar';
import { OpaqueButton } from '../common/OpaqueButton';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { ValueChange } from '../common/ValueChange';

export const LendAnvil: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const { connected, walletAddress, poolSubmit, txStatus, txType, isLoading } = useWallet();

  const account = useStore((state) => state.account);
  const poolData = useStore((state) => state.pools.get(poolId));
  const userPoolData = useStore((state) => state.userPoolData.get(poolId));
  const userBalance = useStore((state) => state.balances.get(assetId)) ?? BigInt(0);

  const [toLend, setToLend] = useState<string>('');
  const [simResponse, setSimResponse] = useState<SorobanRpc.Api.SimulateTransactionResponse>();
  const [parsedSimResult, setParsedSimResult] = useState<UserPositions>();
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const loading = isLoading || loadingEstimate;

  useDebouncedState(toLend, RPC_DEBOUNCE_DELAY, txType, async () => {
    setSimResponse(undefined);
    setParsedSimResult(undefined);
    let response = await handleSubmitTransaction(true);
    if (response) {
      setSimResponse(response);
      if (SorobanRpc.Api.isSimulationSuccess(response)) {
        setParsedSimResult(parseResult(response, PoolContract.parsers.submit));
      }
    }
    setLoadingEstimate(false);
  });

  let newPositionEstimate =
    poolData && parsedSimResult ? PositionEstimates.build(poolData, parsedSimResult) : undefined;

  const reserve = poolData?.reserves.get(assetId);
  const assetToBase = reserve?.oraclePrice ?? 1;
  const decimals = reserve?.config.decimals ?? 7;
  const scalar = 10 ** decimals;
  const symbol = reserve?.tokenMetadata?.symbol ?? '';

  const curBorrowCap = userPoolData ? userPoolData.positionEstimates.borrowCap : undefined;
  const nextBorrowCap = newPositionEstimate ? newPositionEstimate.borrowCap : undefined;
  const curBorrowLimit =
    userPoolData && Number.isFinite(userPoolData?.positionEstimates.borrowLimit)
      ? userPoolData?.positionEstimates?.borrowLimit
      : 0;
  const nextBorrowLimit =
    newPositionEstimate && Number.isFinite(newPositionEstimate?.borrowLimit)
      ? newPositionEstimate?.borrowLimit
      : 0;

  // calculate current wallet state
  let stellar_reserve_amount = getAssetReserve(account, reserve?.tokenMetadata?.asset);
  const freeUserBalanceScaled = Number(userBalance) / scalar - stellar_reserve_amount;

  if (txStatus === TxStatus.SUCCESS && txType === TxType.CONTRACT && Number(toLend) != 0) {
    setToLend('');
  }

  const { isSubmitDisabled, isMaxDisabled, reason, disabledType, isError, extraContent } = useMemo(
    () => getErrorFromSim(toLend, decimals, loading, simResponse, undefined),
    [freeUserBalanceScaled, toLend, simResponse, loading]
  );

  const handleLendMax = () => {
    if (userPoolData) {
      if (freeUserBalanceScaled > 0) {
        setToLend(freeUserBalanceScaled.toFixed(decimals));
        setLoadingEstimate(true);
      }
    }
  };

  const handleSubmitTransaction = async (sim: boolean) => {
    if (toLend && connected && reserve) {
      let submitArgs: SubmitArgs = {
        from: walletAddress,
        spender: walletAddress,
        to: walletAddress,
        requests: [
          {
            amount: scaleInputToBigInt(toLend, reserve.config.decimals),
            request_type: RequestType.SupplyCollateral,
            address: reserve.assetId,
          },
        ],
      };
      return await poolSubmit(poolId, submitArgs, sim);
    }
  };

  return (
    <Row>
      <Section
        width={SectionSize.FULL}
        sx={{ padding: '0px', display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            background: theme.palette.lend.opaque,
            width: '100%',
            borderRadius: '5px',
            padding: '12px',
            marginBottom: '12px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Typography variant="body2" sx={{ marginLeft: '12px', marginBottom: '12px' }}>
            Amount to supply
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: '35px',
              display: 'flex',
              flexDirection: 'row',
              marginBottom: '12px',
            }}
          >
            <InputBar
              symbol={symbol}
              value={toLend}
              onValueChange={(v) => {
                setToLend(v);
                setLoadingEstimate(true);
              }}
              onSetMax={handleLendMax}
              palette={theme.palette.lend}
              sx={{ width: '100%' }}
              isMaxDisabled={isMaxDisabled}
            />
            {viewType !== ViewType.MOBILE && (
              <OpaqueButton
                onClick={() => handleSubmitTransaction(false)}
                palette={theme.palette.lend}
                sx={{ minWidth: '108px', marginLeft: '12px', padding: '6px' }}
                disabled={isSubmitDisabled}
              >
                Supply
              </OpaqueButton>
            )}
          </Box>
          <Box sx={{ marginLeft: '6px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
              {`$${toBalance(Number(toLend ?? 0) * assetToBase, decimals)}`}
            </Typography>
            {viewType === ViewType.MOBILE && (
              <OpaqueButton
                onClick={() => handleSubmitTransaction(false)}
                palette={theme.palette.lend}
                sx={{ minWidth: '108px', width: '100%', padding: '6px' }}
                disabled={isSubmitDisabled}
              >
                Supply
              </OpaqueButton>
            )}
          </Box>
        </Box>
        {!isError && (
          <TxOverview>
            <>
              <Value title="Amount to supply" value={`${toLend ?? '0'} ${symbol}`} />
              <Value
                title={
                  <>
                    <Image src="/icons/dashboard/gascan.svg" alt="blend" width={20} height={20} />{' '}
                    Gas (Fee)
                  </>
                }
                value={`${toBalance(
                  BigInt((simResponse as any)?.minResourceFee ?? 0),
                  decimals
                )} XLM (please make sure you have enough available XLM in wallet)`}
              />
              <ValueChange
                title="Your total supplied"
                curValue={`${toBalance(
                  userPoolData?.positionEstimates?.collateral?.get(assetId) ?? 0,
                  decimals
                )} ${symbol}`}
                newValue={`${toBalance(
                  newPositionEstimate?.collateral.get(assetId) ?? 0,
                  decimals
                )} ${symbol}`}
              />
              {/* <ValueChange
                title="Borrow capacity"
                curValue={`$${toBalance(curBorrowCap)}`}
                newValue={`$${toBalance(nextBorrowCap)}`}
              />
              <ValueChange
                title="Borrow limit"
                curValue={toPercentage(curBorrowLimit)}
                newValue={toPercentage(nextBorrowLimit)}
              /> */}
            </>
          </TxOverview>
        )}
        {isError && (
          <AnvilAlert severity={disabledType} message={reason} extraContent={extraContent} />
        )}
      </Section>
    </Row>
  );
};
