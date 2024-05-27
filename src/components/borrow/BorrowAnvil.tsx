import {
  parseResult,
  PoolContract,
  PositionEstimates,
  RequestType,
  SubmitArgs,
  UserPositions,
} from '@blend-capital/blend-sdk';
import { Box, CircularProgress, Typography, useTheme } from '@mui/material';
import { SorobanRpc } from '@stellar/stellar-sdk';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useSettings, ViewType } from '../../contexts';
import { TxStatus, TxType, useWallet } from '../../contexts/wallet';
import { RPC_DEBOUNCE_DELAY, useDebouncedState } from '../../hooks/debounce';
import { useStore } from '../../store/store';
import { toBalance, toPercentage } from '../../utils/formatter';
import { requiresTrustline } from '../../utils/horizon';
import { scaleInputToBigInt } from '../../utils/scval';
import { getErrorFromSim, SubmitError } from '../../utils/txSim';
import { AnvilAlert } from '../common/AnvilAlert';
import { InputBar } from '../common/InputBar';
import { OpaqueButton } from '../common/OpaqueButton';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { ValueChange } from '../common/ValueChange';

export const BorrowAnvil: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const { connected, walletAddress, poolSubmit, txStatus, txType, createTrustline, isLoading } =
    useWallet();

  const poolData = useStore((state) => state.pools.get(poolId));
  const userPoolData = useStore((state) => state.userPoolData.get(poolId));
  const userAccount = useStore((state) => state.account);

  const [toBorrow, setToBorrow] = useState<string>('');
  const [simResponse, setSimResponse] = useState<SorobanRpc.Api.SimulateTransactionResponse>();
  const [parsedSimResult, setParsedSimResult] = useState<UserPositions>();
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const loading = isLoading || loadingEstimate;

  if (txStatus === TxStatus.SUCCESS && txType === TxType.CONTRACT && Number(toBorrow) != 0) {
    setToBorrow('');
  }

  useDebouncedState(toBorrow, RPC_DEBOUNCE_DELAY, txType, async () => {
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
  const symbol = reserve?.tokenMetadata?.symbol ?? '';

  const assetToEffectiveLiability = reserve
    ? assetToBase * reserve.getLiabilityFactor()
    : undefined;
  const curBorrowCap =
    userPoolData && assetToEffectiveLiability
      ? userPoolData.positionEstimates.borrowCap / assetToEffectiveLiability
      : undefined;
  const nextBorrowCap =
    newPositionEstimate && assetToEffectiveLiability
      ? newPositionEstimate.borrowCap / assetToEffectiveLiability
      : undefined;
  const curBorrowLimit =
    userPoolData && Number.isFinite(userPoolData?.positionEstimates.borrowLimit)
      ? userPoolData?.positionEstimates?.borrowLimit
      : 0;
  const nextBorrowLimit =
    newPositionEstimate && Number.isFinite(newPositionEstimate?.borrowLimit)
      ? newPositionEstimate?.borrowLimit
      : 0;
  const AddTrustlineButton = (
    <OpaqueButton
      onClick={handleAddAssetTrustline}
      palette={theme.palette.warning}
      sx={{ padding: '6px 24px', margin: '12px auto' }}
    >
      Add {reserve?.tokenMetadata.asset?.code} Trustline
    </OpaqueButton>
  );

  const { isSubmitDisabled, isMaxDisabled, reason, disabledType, extraContent, isError } =
    useMemo(() => {
      const hasTokenTrustline = !requiresTrustline(userAccount, reserve?.tokenMetadata?.asset);
      if (!hasTokenTrustline) {
        let submitError: SubmitError = {
          isSubmitDisabled: true,
          isError: true,
          isMaxDisabled: true,
          reason: 'You need a trustline for this asset in order to borrow it.',
          disabledType: 'warning',
          extraContent: AddTrustlineButton,
        };
        return submitError;
      } else {
        return getErrorFromSim(toBorrow, decimals, loading, simResponse, undefined);
      }
    }, [toBorrow, simResponse, userPoolData?.positionEstimates]);

  const handleBorrowMax = () => {
    if (reserve && userPoolData) {
      let to_bounded_hf =
        (userPoolData.positionEstimates.totalEffectiveCollateral -
          userPoolData.positionEstimates.totalEffectiveLiabilities * 1.02) /
        1.02;
      let to_borrow = Math.min(
        to_bounded_hf / (assetToBase * reserve.getLiabilityFactor()),
        reserve.estimates.supplied * (reserve.config.max_util / 1e7 - 0.01) -
          reserve.estimates.borrowed
      );
      setToBorrow(Math.max(to_borrow, 0).toFixed(7));
      setLoadingEstimate(true);
    }
  };

  const handleSubmitTransaction = async (sim: boolean) => {
    if (toBorrow && connected && reserve) {
      let submitArgs: SubmitArgs = {
        from: walletAddress,
        to: walletAddress,
        spender: walletAddress,
        requests: [
          {
            amount: scaleInputToBigInt(toBorrow, reserve.config.decimals),
            address: reserve.assetId,
            request_type: RequestType.Borrow,
          },
        ],
      };
      return await poolSubmit(poolId, submitArgs, sim);
    }
  };

  async function handleAddAssetTrustline() {
    if (connected && reserve?.tokenMetadata?.asset) {
      const reserveAsset = reserve?.tokenMetadata?.asset;
      await createTrustline(reserveAsset);
    }
  }

  return (
    <Row>
      <Section
        width={SectionSize.FULL}
        sx={{ padding: '0px', display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            background: theme.palette.borrow.opaque,
            width: '100%',
            borderRadius: '5px',
            padding: '12px',
            marginBottom: '12px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Typography variant="body2" sx={{ marginLeft: '12px', marginBottom: '12px' }}>
            Amount to borrow
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
              value={toBorrow}
              onValueChange={(v) => {
                setToBorrow(v);
                setLoadingEstimate(true);
              }}
              onSetMax={handleBorrowMax}
              palette={theme.palette.borrow}
              sx={{ width: '100%' }}
              isMaxDisabled={isMaxDisabled}
            />
            {viewType !== ViewType.MOBILE && (
              <OpaqueButton
                onClick={() => handleSubmitTransaction(false)}
                palette={theme.palette.borrow}
                sx={{ minWidth: '108px', marginLeft: '12px', padding: '6px' }}
                disabled={isSubmitDisabled}
              >
                Borrow
              </OpaqueButton>
            )}
          </Box>
          <Box sx={{ marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
              {`$${toBalance(Number(toBorrow ?? 0) * assetToBase, decimals)}`}
            </Typography>
            {viewType === ViewType.MOBILE && (
              <OpaqueButton
                onClick={() => handleSubmitTransaction(false)}
                palette={theme.palette.borrow}
                sx={{ minWidth: '108px', width: '100%', padding: '6px' }}
                disabled={isSubmitDisabled}
              >
                Borrow
              </OpaqueButton>
            )}
          </Box>
        </Box>
        {!isError && (
          <TxOverview>
            {!isLoading && (
              <>
                <Value title="Amount to borrow" value={`${toBorrow ?? '0'} ${symbol}`} />
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
                  title="Your total borrowed"
                  curValue={`${toBalance(
                    userPoolData?.positionEstimates?.liabilities?.get(assetId) ?? 0,
                    decimals
                  )} ${symbol}`}
                  newValue={`${toBalance(
                    newPositionEstimate?.liabilities.get(assetId) ?? 0,
                    decimals
                  )} ${symbol}`}
                />
                <ValueChange
                  title="Borrow capacity"
                  curValue={`${toBalance(curBorrowCap)} ${symbol}`}
                  newValue={`${toBalance(nextBorrowCap)} ${symbol}`}
                />
                <ValueChange
                  title="Borrow limit"
                  curValue={toPercentage(curBorrowLimit)}
                  newValue={toPercentage(nextBorrowLimit)}
                />
              </>
            )}
            {isLoading && (
              <Box
                sx={{
                  width: '100%',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                }}
              >
                <CircularProgress color={'borrow' as any} />
              </Box>
            )}
          </TxOverview>
        )}
        {isError && (
          <AnvilAlert severity={disabledType} message={reason} extraContent={extraContent} />
        )}
      </Section>
    </Row>
  );
};
