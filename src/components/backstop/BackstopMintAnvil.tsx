import { parseResult } from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { Address, SorobanRpc, scValToBigInt, xdr } from '@stellar/stellar-sdk';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { ViewType, useSettings } from '../../contexts';
import { TxStatus, TxType, useWallet } from '../../contexts/wallet';
import { getTokenBalance } from '../../external/token';
import { RPC_DEBOUNCE_DELAY, useDebouncedState } from '../../hooks/debounce';
import { useStore } from '../../store/store';
import { toBalance } from '../../utils/formatter';
import { scaleInputToBigInt } from '../../utils/scval';
import { SubmitError, getErrorFromSim } from '../../utils/txSim';
import { AnvilAlert } from '../common/AnvilAlert';
import { InputBar } from '../common/InputBar';
import { OpaqueButton } from '../common/OpaqueButton';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { ValueChange } from '../common/ValueChange';

export const BackstopMintAnvil: React.FC<{
  currentDepositToken: { address: string | undefined; symbol: string };
  setCurrentDepositToken: (token: { address: string | undefined; symbol: string }) => void;
}> = ({ currentDepositToken, setCurrentDepositToken }) => {
  const theme = useTheme();
  const { viewType } = useSettings();

  const { walletAddress, txStatus, backstopMintByDepositTokenAmount, txType, isLoading } =
    useWallet();

  const [currentPoolUSDCBalance, setCurrentPoolUSDCBalance] = useState<bigint>();
  const [currentPoolBLNDBalance, setCurrentPoolBLNDBalance] = useState<bigint>();
  const [toMint, setToMint] = useState<number>(0);
  const network = useStore((state) => state.network);
  const rpcServer = useStore((state) => state.rpcServer());
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);
  const [toSwap, setToSwap] = useState<string>('');
  const [simResponse, setSimResponse] = useState<SorobanRpc.Api.SimulateTransactionResponse>();
  const loading = isLoading || loadingEstimate;

  /** run function on each state change */
  useDebouncedState(toSwap, RPC_DEBOUNCE_DELAY, txType, handleSwapChange);

  const backstopData = useStore((state) => state.backstop);
  const loadUserData = useStore((state) => state.loadUserData);
  const usdcAddress = backstopData?.config.usdcTkn || '';
  const blndAddress = backstopData?.config.blndTkn || '';
  const userBackstopData = useStore((state) => state.backstopUserData);
  const balancesByAddress = useStore((state) => state.balances);

  const userLPBalance = Number(userBackstopData?.tokens ?? BigInt(0)) / 1e7;
  const decimals = 7;
  if (txStatus === TxStatus.SUCCESS && txType === TxType.CONTRACT && Number(toSwap) != 0) {
    setToSwap('');
  }

  // verify that the user can act
  const { isSubmitDisabled, isMaxDisabled, reason, disabledType, isError, extraContent } = useMemo(
    () =>
      getErrorFromSim(toSwap, decimals, loading, simResponse, () => {
        const errorProps: Partial<SubmitError> = {};
        const currentDepositTokenBalance =
          balancesByAddress.get(currentDepositToken.address ?? '') || 0;
        const validDecimals = toSwap.split('.')[1]?.length ?? 0 <= decimals;
        if (currentDepositTokenBalance <= BigInt(0)) {
          errorProps.isSubmitDisabled = true;
          errorProps.isError = true;
          errorProps.isMaxDisabled = true;
          errorProps.reason = 'You do not have any available balance to mint.';
          errorProps.disabledType = 'warning';
        } else if (
          validDecimals &&
          scaleInputToBigInt(toSwap, decimals) > currentDepositTokenBalance
        ) {
          errorProps.isSubmitDisabled = true;
          errorProps.isError = true;
          errorProps.isMaxDisabled = false;
          errorProps.reason = 'You do not have enough available balance to mint.';
          errorProps.disabledType = 'warning';
        } else if (
          validDecimals &&
          currentDepositToken.address === blndAddress &&
          !!currentPoolBLNDBalance &&
          scaleInputToBigInt(toSwap, decimals) > currentPoolBLNDBalance / BigInt(3) - BigInt(1)
        ) {
          errorProps.isSubmitDisabled = true;
          errorProps.isError = true;
          errorProps.isMaxDisabled = true;
          errorProps.reason = `Cannot deposit more than a third of the pools token balance, estimated max deposit amount: ${toBalance(
            currentPoolBLNDBalance / BigInt(3) - BigInt(1),
            decimals
          )}`;
          errorProps.disabledType = 'warning';
        } else if (
          validDecimals &&
          currentDepositToken.address === usdcAddress &&
          !!currentPoolUSDCBalance &&
          scaleInputToBigInt(toSwap, decimals) > currentPoolUSDCBalance / BigInt(3) - BigInt(1)
        ) {
          errorProps.isSubmitDisabled = true;
          errorProps.isError = true;
          errorProps.isMaxDisabled = true;
          errorProps.reason = `Cannot deposit more than a third of the pools token balance, estimated max deposit amount: ${toBalance(
            currentPoolUSDCBalance / BigInt(3) - BigInt(1),
            decimals
          )}`;
          errorProps.disabledType = 'warning';
        }
        return errorProps;
      }),
    [
      toSwap,
      currentDepositToken.address,
      balancesByAddress,
      loadingEstimate,
      currentPoolBLNDBalance,
      currentPoolUSDCBalance,
      simResponse,
    ]
  );

  const handleMaxClick = () => {
    if (currentDepositToken.address) {
      const currentTokenBalance = balancesByAddress.get(currentDepositToken.address ?? '');
      if (currentTokenBalance) {
        const max = Number(currentTokenBalance) / 10 ** decimals;
        setToSwap(max.toString());
      }
    }
  };

  async function handleSwapChange(value: string) {
    /**  get comet estimate LP token for the inputted swap token and set in mint input  */
    const validDecimals = value.split('.')[1]?.length ?? 0 <= decimals;
    setSimResponse(undefined);
    setToMint(0);
    if (currentDepositToken.address && validDecimals) {
      const bigintValue = scaleInputToBigInt(value, decimals);
      const currentDepositTokenBalance =
        balancesByAddress.get(currentDepositToken.address ?? '') || 0;
      const isLargerUSDC =
        !!currentPoolUSDCBalance && bigintValue > currentPoolUSDCBalance / BigInt(2) - BigInt(1);
      const isLargerBLND =
        !!currentPoolBLNDBalance && bigintValue > currentPoolBLNDBalance / BigInt(2) - BigInt(1);

      if (isLargerBLND || isLargerUSDC) {
        setLoadingEstimate(false);
        setToMint(0);
        return;
      }
      if (bigintValue <= currentDepositTokenBalance) {
        backstopMintByDepositTokenAmount(
          {
            depositTokenAddress: currentDepositToken.address,
            depositTokenAmount: bigintValue,
            minLPTokenAmount: BigInt(0),
            user: walletAddress,
          },
          true,
          backstopData?.config.backstopTkn || ''
        ).then((sim: SorobanRpc.Api.SimulateTransactionResponse | undefined) => {
          if (sim === undefined) {
            setLoadingEstimate(false);
            setToMint(0);
            return;
          }
          setLoadingEstimate(false);
          if (SorobanRpc.Api.isSimulationSuccess(sim)) {
            let result = parseResult(sim, (xdrString: string) => {
              return scValToBigInt(xdr.ScVal.fromXDR(xdrString, 'base64'));
            });
            setToMint(result ? Number(result) / 1e7 : 0);
            setSimResponse(sim);
          }
        });
      }
      setLoadingEstimate(false);
    }
  }

  async function handleSubmitTransaction() {
    await backstopMintByDepositTokenAmount(
      {
        depositTokenAddress: currentDepositToken.address || '',
        depositTokenAmount: scaleInputToBigInt(toSwap, decimals),
        minLPTokenAmount: BigInt(0),
        user: walletAddress,
      },
      false,
      backstopData?.config.backstopTkn || ''
    );
  }

  function handleSwitchDepositToken() {
    if (currentDepositToken.symbol === 'USDC') {
      setCurrentDepositToken({
        address: backstopData?.config.blndTkn,
        symbol: 'BLND',
      });
    } else {
      setCurrentDepositToken({
        address: backstopData?.config.usdcTkn,
        symbol: 'USDC',
      });
    }
  }

  async function loadCometBalances() {
    if (
      backstopData?.config.usdcTkn &&
      backstopData?.config.blndTkn &&
      backstopData.config.backstopTkn
    ) {
      if (!currentPoolUSDCBalance) {
        const cometPoolUSDCBalance = await getTokenBalance(
          rpcServer,
          network.passphrase,
          usdcAddress,
          Address.fromString(backstopData?.config.backstopTkn as string)
        );
        setCurrentPoolUSDCBalance(cometPoolUSDCBalance);
      }

      if (!currentPoolBLNDBalance) {
        const cometPoolBLNDBalance = await getTokenBalance(
          rpcServer,
          network.passphrase,
          blndAddress,
          Address.fromString(backstopData?.config.backstopTkn as string)
        );
        setCurrentPoolBLNDBalance(cometPoolBLNDBalance);
      }
    }
  }

  useEffect(() => {
    if (!balancesByAddress.get(backstopData?.config.usdcTkn ?? '')) {
      loadUserData(walletAddress);
    }
    loadCometBalances();
  }, [balancesByAddress]);
  useEffect(() => {
    handleSwapChange(toSwap);
  }, [currentDepositToken.address]);

  return (
    <Row>
      <Section
        width={SectionSize.FULL}
        sx={{ padding: '0px', display: 'flex', flexDirection: 'column' }}
      >
        <Box
          sx={{
            background: theme.palette.backstop.opaque,
            width: '100%',
            borderRadius: '5px',
            padding: '12px',
            marginBottom: '12px',
            boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
          }}
        >
          <Typography variant="body2" sx={{ marginLeft: '12px', marginBottom: '12px' }}>
            Mint pool tokens
          </Typography>
          <Box
            sx={{
              width: '100%',
              height: 'max-content',
              display: 'flex',
              gap: '12px',
              flexDirection: viewType === ViewType.MOBILE ? 'column' : 'row',
              marginBottom: '12px',
              alignItems: 'end',
            }}
          >
            <Box
              sx={{
                width: '100%',
                height: 'max-content',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
              }}
            >
              <InputBar
                symbol={currentDepositToken.symbol}
                value={toSwap}
                onValueChange={(v) => {
                  setToSwap(v);
                  setLoadingEstimate(true);
                }}
                onSetMax={handleMaxClick}
                palette={theme.palette.backstop}
                sx={{ width: '100%' }}
                isMaxDisabled={isMaxDisabled}
                showSwitch
                onSwitchClick={handleSwitchDepositToken}
              />
              <Box
                sx={{
                  display: 'flex',
                  gap: '12px',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '2px',
                  borderRadius: '5px',
                  height: '38px',
                  backgroundColor: theme.palette.accent.main,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ color: theme.palette.text.secondary, marginLeft: '12px' }}
                >
                  {loadingEstimate ? 'Loading...' : toBalance(toMint, 7) || 0}
                </Typography>
                <Typography
                  variant="h5"
                  sx={{
                    minWidth: '113px',
                    color: theme.palette.text.secondary,
                    textAlign: 'right',
                    marginRight: '12px',
                  }}
                >
                  BLND-USDC LP
                </Typography>
              </Box>
            </Box>
            {viewType !== ViewType.MOBILE && (
              <OpaqueButton
                onClick={handleSubmitTransaction}
                palette={theme.palette.backstop}
                sx={{
                  minWidth: '108px',

                  padding: '6px',
                  height: 'max-content',
                }}
                disabled={isSubmitDisabled}
              >
                Mint
              </OpaqueButton>
            )}
          </Box>
          <Box sx={{ marginLeft: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
              {`$${toBalance(toMint * (backstopData?.lpTokenPrice ?? 1))}`}
            </Typography>
            {viewType === ViewType.MOBILE && (
              <OpaqueButton
                onClick={handleSubmitTransaction}
                palette={theme.palette.backstop}
                sx={{
                  minWidth: '108px',

                  padding: '6px',
                  height: 'max-content',
                }}
                disabled={isSubmitDisabled}
              >
                Mint
              </OpaqueButton>
            )}
          </Box>
        </Box>
        {!isError && (
          <TxOverview>
            <>
              {' '}
              <Value title="Amount to mint" value={`${toMint ?? '0'} BLND-USDC LP`} />
              <Value
                title={
                  <>
                    <Image src="/icons/dashboard/gascan.svg" alt="blend" width={20} height={20} />{' '}
                    Gas
                  </>
                }
                value={`${toBalance(
                  BigInt((simResponse as any)?.minResourceFee ?? 0),
                  decimals
                )} XLM (please make sure you have enoguh available XLM in wallet)`}
              />
              <ValueChange
                title="Your total mint"
                curValue={`${toBalance(userLPBalance)} BLND-USDC LP`}
                newValue={`${toBalance(userLPBalance + toMint)} BLND-USDC LP`}
              />
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
