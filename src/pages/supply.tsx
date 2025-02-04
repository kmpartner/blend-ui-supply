import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import { Box, Link, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AllbridgeButton } from '../components/bridge/allbridge';
import { AprDisplay } from '../components/common/AprDisplay';
import { GoBackHeader } from '../components/common/GoBackHeader';
import { ReserveDetailsBar } from '../components/common/ReserveDetailsBar';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { StackedText } from '../components/common/StackedText';
import { LendAnvil } from '../components/lend/LendAnvil';
import {
  useBackstop,
  useHorizonAccount,
  usePool,
  usePoolOracle,
  useTokenBalance,
} from '../hooks/api';
import { toBalance, toPercentage } from '../utils/formatter';
import { estimateEmissionsApr } from '../utils/math';
import { getTokenLinkFromReserve } from '../utils/token';

const Supply: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();
  const { poolId, assetId } = router.query;
  const safePoolId = typeof poolId == 'string' && /^[0-9A-Z]{56}$/.test(poolId) ? poolId : '';
  const safeAssetId = typeof assetId == 'string' && /^[0-9A-Z]{56}$/.test(assetId) ? assetId : '';

  const { data: pool } = usePool(safePoolId);
  const reserve = pool?.reserves.get(safeAssetId);
  const { data: horizonAccount } = useHorizonAccount();
  const { data: tokenBalance } = useTokenBalance(
    reserve?.assetId,
    reserve?.tokenMetadata?.asset,
    horizonAccount,
    reserve !== undefined
  );
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();

  const emissionsPerAsset = reserve !== undefined ? reserve.emissionsPerYearPerSuppliedAsset() : 0;
  const oraclePrice = reserve ? poolOracle?.getPriceFloat(reserve.assetId) : 0;
  const emissionApr =
    backstop && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;
  return (
    <>
      <Row>
        <GoBackHeader name={pool?.config.name} />
      </Row>

      <ReserveDetailsBar action="supply" poolId={safePoolId} activeReserveId={safeAssetId} />
      {reserve?.tokenMetadata.symbol === 'USDC' && <AllbridgeButton />}

      <Row>
        <Section width={SectionSize.FULL} sx={{ padding: '12px' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <Typography variant="h5" sx={{ marginRight: '6px' }}>
                Balance
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.lend.main }}>
                {toBalance(tokenBalance, reserve?.config.decimals)}
              </Typography>
            </Box>
            <Box>
              <Link
                target="_blank"
                href={getTokenLinkFromReserve(reserve)}
                variant="h5"
                rel="noopener"
                sx={{
                  color: theme.palette.text.secondary,
                  cursor: 'pointer',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderBottom: '.5px solid transparent',
                  '&:hover': {
                    borderBottom: `.5px solid ${theme.palette.text.secondary}`,
                  },
                }}
              >
                <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                  {reserve?.tokenMetadata?.symbol ?? ''}
                </Typography>
                <OpenInNewIcon fontSize="inherit" />
              </Link>
            </Box>
          </Box>
        </Section>
      </Row>
      <Row>
        <Section width={SectionSize.THIRD} sx={{ justifyContent: 'center' }}>
          <StackedText
            title="Supply APR"
            text={
              reserve ? (
                <AprDisplay
                  assetSymbol={reserve.tokenMetadata.symbol}
                  assetApr={reserve.supplyApr}
                  emissionSymbol={'BLND'}
                  emissionApr={emissionApr}
                  isSupply={true}
                  direction={'horizontal'}
                />
              ) : (
                ''
              )
            }
            sx={{ width: '100%', padding: '6px' }}
            tooltip="The interest rate earned on a supplied position. This rate will fluctuate based on the market conditions and is accrued to the supplied position."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Collateral Factor"
            text={toPercentage(reserve?.getCollateralFactor())}
            sx={{ width: '100%', padding: '6px' }}
            tooltip="The percent of this asset's value added to your borrow capacity."
          ></StackedText>
        </Section>
        <Section width={SectionSize.THIRD}>
          <StackedText
            title="Total Supplied"
            text={toBalance(reserve?.totalSupplyFloat())}
            sx={{ width: '100%', padding: '6px' }}
          ></StackedText>
        </Section>
      </Row>
      <LendAnvil poolId={safePoolId} assetId={safeAssetId} />
    </>
  );
};

export default Supply;
