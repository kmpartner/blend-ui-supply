import { BackstopClaimArgs, parseResult } from '@blend-capital/blend-sdk';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import HelpOutline from '@mui/icons-material/HelpOutline';
import { Box, Tooltip, Typography } from '@mui/material';
import { Address, SorobanRpc, scValToBigInt, xdr } from '@stellar/stellar-sdk';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { BackstopAPY } from '../components/backstop/BackstopAPY';
import { BackstopBalanceCard } from '../components/backstop/BackstopBalanceCard';
import { BackstopQueueMod } from '../components/backstop/BackstopQueueMod';
import { CustomButton } from '../components/common/CustomButton';
import { Divider } from '../components/common/Divider';
import { FlameIcon } from '../components/common/FlameIcon';
import { Icon } from '../components/common/Icon';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { SectionBase } from '../components/common/SectionBase';
import { StackedText } from '../components/common/StackedText';
import { TokenIcon } from '../components/common/TokenIcon';
import { PoolExploreBar } from '../components/pool/PoolExploreBar';
import { ViewType, useSettings } from '../contexts';
import { useWallet } from '../contexts/wallet';
import { getTokenBalance } from '../external/token';
import { useStore } from '../store/store';
import theme from '../theme';
import { toBalance, toPercentage } from '../utils/formatter';
import { getEmissionsPerYearPerUnit } from '../utils/token';

const Backstop: NextPage = () => {
  const router = useRouter();
  const { viewType } = useSettings();
  const { connected, walletAddress, backstopClaim, backstopMintByDepositTokenAmount } = useWallet();
  const loadBlendData = useStore((state) => state.loadBlendData);
  const network = useStore((state) => state.network);
  const rpcServer = useStore((state) => state.rpcServer());
  const { poolId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';

  const [availableToMint, setAvailableToMint] = useState<string>();
  const [loadingEstimate, setLoadingEstimate] = useState(false);
  const [lpTokenEmissions, setLpTokenEmissions] = useState<bigint>();

  const backstopPoolData = useStore((state) => state.backstop?.pools?.get(safePoolId));
  const poolData = useStore((state) => state.pools.get(safePoolId));
  const backstopData = useStore((state) => state.backstop);
  const userBackstopData = useStore((state) => state.backstopUserData);
  const userEmissions = userBackstopData?.estimates.get(safePoolId)?.emissions;
  const balancesByAddress = useStore((state) => state.balances);
  const estBackstopApy =
    backstopPoolData && poolData
      ? ((poolData.config.backstopRate / 1e7) *
          poolData.estimates.totalBorrowApy *
          poolData.estimates.totalBorrow) /
        backstopPoolData.estimates.totalSpotValue
      : 0;
  const backstopEmissionsPerDayPerLPToken =
    backstopPoolData && backstopPoolData.emissions
      ? getEmissionsPerYearPerUnit(
          backstopPoolData.emissions.config.eps,
          Number(backstopPoolData.poolBalance.shares - backstopPoolData.poolBalance.q4w) / 1e7,
          7
        )
      : 0;

  const handleClaimEmissionsClick = async () => {
    if (connected && userBackstopData && userEmissions) {
      let claimArgs: BackstopClaimArgs = {
        from: walletAddress,
        pool_addresses: [safePoolId],
        to: walletAddress,
      };
      setLpTokenEmissions(BigInt(0));
      await backstopClaim(claimArgs, false);
      await loadBlendData(true, safePoolId, walletAddress);
    }
  };

  async function getLPEstimate(amount: bigint, depositTokenAddress: string, source: string) {
    let response = await backstopMintByDepositTokenAmount(
      {
        depositTokenAddress: depositTokenAddress,
        depositTokenAmount: amount,
        minLPTokenAmount: BigInt(0),
        user: source,
      },
      true,
      backstopData?.config.backstopTkn || ''
    );
    if (response) {
      return SorobanRpc.Api.isSimulationSuccess(response)
        ? parseResult(response, (xdrString: string) => {
            return scValToBigInt(xdr.ScVal.fromXDR(xdrString, 'base64'));
          })
        : BigInt(0);
    }
    return BigInt(0);
  }

  async function estimateMaxAmountToMint() {
    try {
      /** load comet estimate for users full balance */
      const usdcBalance = balancesByAddress.get(backstopData?.config.usdcTkn ?? '') || BigInt(0);
      const blndBalance = balancesByAddress.get(backstopData?.config.blndTkn ?? '') || BigInt(0);
      const usdcAddress = backstopData?.config.usdcTkn || '';
      const blndAddress = backstopData?.config.blndTkn || '';

      const cometPoolUSDCBalance = await getTokenBalance(
        rpcServer,
        network.passphrase,
        usdcAddress,
        Address.fromString(backstopData?.config.backstopTkn as string)
      );
      const cometPoolBLNDBalance = await getTokenBalance(
        rpcServer,
        network.passphrase,
        blndAddress,
        Address.fromString(backstopData?.config.backstopTkn as string)
      );

      let usdcEstimate =
        usdcBalance > cometPoolUSDCBalance
          ? (await getLPEstimate(
              cometPoolUSDCBalance / BigInt(2) - BigInt(1),
              usdcAddress,
              walletAddress
            )) ?? BigInt(0)
          : (await getLPEstimate(usdcBalance, usdcAddress, walletAddress)) ?? BigInt(0);
      let blndEstimate =
        blndBalance > cometPoolBLNDBalance
          ? (await getLPEstimate(
              cometPoolBLNDBalance / BigInt(2) - BigInt(1),
              blndAddress,
              walletAddress
            )) ?? BigInt(0)
          : (await getLPEstimate(blndBalance, blndAddress, walletAddress)) ?? BigInt(0);

      if (blndEstimate > BigInt(0) || usdcEstimate > BigInt(0)) {
        const totalEstimate = usdcEstimate + blndEstimate;
        setAvailableToMint(toBalance(totalEstimate, 7));
        setLoadingEstimate(false);
      } else {
        setLoadingEstimate(false);
        setAvailableToMint('0');
      }
    } catch (e) {
      console.error('Unable to estimate LP token mint amounts');
      setLoadingEstimate(false);
      setAvailableToMint('0');
    }
  }

  useEffect(() => {
    if (
      balancesByAddress.get(backstopData?.config.usdcTkn ?? '') !== undefined ||
      balancesByAddress.get(backstopData?.config.blndTkn ?? '') !== undefined
    ) {
      estimateMaxAmountToMint();
    }
  }, [balancesByAddress]);

  useEffect(() => {
    const update = async () => {
      if (
        backstopData?.config?.blndTkn !== undefined &&
        userEmissions !== undefined &&
        userEmissions > 0
      ) {
        let emissions_as_bigint = BigInt((userEmissions * 1e7).toFixed(0));
        let lp_tokens_emitted = await getLPEstimate(
          emissions_as_bigint,
          backstopData.config.blndTkn,
          backstopData.id
        );
        setLpTokenEmissions(lp_tokens_emitted);
      }
    };
    update();
  }, [userEmissions]);

  return (
    <>
      <PoolExploreBar poolId={safePoolId} />
      <Row>
        <SectionBase type="alt" sx={{ margin: '6px', padding: '6px' }}>
          Backstop Manager
        </SectionBase>
      </Row>
      <Divider />
      <Row>
        <Section width={SectionSize.THIRD} sx={{ alignItems: 'center' }}>
          <BackstopAPY poolId={safePoolId} />
        </Section>
        <Section width={SectionSize.THIRD}>
          <Tooltip
            title="Percent of capital insuring this pool queued for withdrawal (Q4W). A higher percent indicates potential risks."
            placement="top"
            enterTouchDelay={0}
            enterDelay={500}
            leaveTouchDelay={3000}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <StackedText
                title="Q4W"
                text={toPercentage(backstopPoolData?.estimates?.q4wPercentage)}
                sx={{ width: '100%', padding: '6px' }}
              ></StackedText>
              <HelpOutline
                sx={{
                  marginLeft: '-10px',
                  marginTop: '9px',
                  width: '15px',
                  color: 'text.secondary',
                }}
              />
            </Box>
          </Tooltip>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total deposited"
            text={`$${toBalance(backstopPoolData?.estimates?.totalSpotValue)}`}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      {lpTokenEmissions !== undefined && lpTokenEmissions > BigInt(0) && (
        <Row>
          <Section
            width={SectionSize.FULL}
            sx={{
              flexDirection: 'column',
              paddingTop: '12px',
            }}
          >
            <Typography variant="body2" sx={{ margin: '6px', color: theme.palette.primary.main }}>
              Emissions to claim
            </Typography>
            <Row>
              <CustomButton
                sx={{
                  width: '100%',
                  margin: '6px',
                  padding: '12px',
                  color: theme.palette.text.primary,
                  backgroundColor: theme.palette.background.default,
                  '&:hover': {
                    color: theme.palette.primary.main,
                  },
                }}
                onClick={handleClaimEmissionsClick}
              >
                <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <FlameIcon />
                  <TokenIcon symbol="blndusdclp" sx={{ marginRight: '12px' }}></TokenIcon>
                  <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                    <Typography variant="h4" sx={{ marginRight: '6px' }}>
                      {toBalance(lpTokenEmissions, 7)}
                    </Typography>
                    <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                      BLND-USDC LP
                    </Typography>
                  </Box>
                </Box>
                <ArrowForwardIcon fontSize="inherit" />
              </CustomButton>
            </Row>
          </Section>
        </Row>
      )}
      <Row>
        <Section
          width={SectionSize.FULL}
          sx={{
            flexDirection: 'column',
            paddingTop: '12px',
          }}
        >
          <Typography variant="body2" sx={{ margin: '6px', color: theme.palette.backstop.main }}>
            Pool tokens available to mint
          </Typography>
          <Row>
            <CustomButton
              sx={{
                width: '100%',
                margin: '6px',
                padding: '12px',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.default,
                '&:hover': {
                  color: theme.palette.backstop.main,
                },
              }}
              onClick={() => {
                router.push({ pathname: `/backstop-mint`, query: { poolId: poolId } });
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <Box
                  sx={{
                    backgroundColor: theme.palette.backstop.opaque,
                    color: theme.palette.backstop.main,
                    borderRadius: '50%',
                    padding: '4px',
                    margin: '6px',
                    display: 'flex',
                  }}
                >
                  <Icon width="24px" height="24px" src="/icons/dashboard/mint.svg" alt="mint" />
                </Box>
                <TokenIcon symbol="blndusdclp" sx={{ marginRight: '12px' }}></TokenIcon>
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <Typography variant="h4" sx={{ marginRight: '6px' }}>
                    {loadingEstimate ? 'loading...' : availableToMint}
                  </Typography>
                  <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                    BLND-USDC LP
                  </Typography>
                </Box>
              </Box>
              <ArrowForwardIcon fontSize="inherit" />
            </CustomButton>
          </Row>
        </Section>
      </Row>

      <Row sx={{ display: 'flex', flexDirection: viewType === ViewType.MOBILE ? 'column' : 'row' }}>
        <BackstopBalanceCard type="deposit" poolId={safePoolId} />
        <BackstopBalanceCard type="wallet" poolId={safePoolId} />
      </Row>
      <BackstopQueueMod poolId={safePoolId} />
    </>
  );
};

export default Backstop;
