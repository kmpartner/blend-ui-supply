import { Circle } from '@mui/icons-material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Typography, useTheme } from '@mui/material';
import {
  useBackstop,
  usePool,
  usePoolMeta,
  usePoolOracle,
  useTokenMetadata,
} from '../../hooks/api';
import { toBalance, toCompactAddress, toPercentage } from '../../utils/formatter';
import { estimateEmissionsApr } from '../../utils/math';
import { LinkBox } from '../common/LinkBox';
import { OpaqueButton } from '../common/OpaqueButton';
import { RateDisplay } from '../common/RateDisplay';
import { ReserveComponentProps } from '../common/ReserveComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { Skeleton } from '../common/Skeleton';

export const AssetBorrowInfo: React.FC<ReserveComponentProps> = ({ poolId, assetId }) => {
  const theme = useTheme();

  const { data: poolMeta } = usePoolMeta(poolId);
  const { data: pool } = usePool(poolMeta);
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop(poolMeta?.version);
  const oraclePrice = poolOracle?.getPriceFloat(assetId);
  const reserve = pool?.reserves.get(assetId);
  const { data: tokenMetadata } = useTokenMetadata(assetId);
  const emissionsPerAsset =
    reserve && reserve.borrowEmissions !== undefined
      ? reserve.borrowEmissions.emissionsPerYearPerToken(
          reserve.totalLiabilities(),
          reserve.config.decimals
        )
      : 0;
  const emissionApr =
    backstop && emissionsPerAsset && emissionsPerAsset > 0 && oraclePrice
      ? estimateEmissionsApr(emissionsPerAsset, backstop.backstopToken, oraclePrice)
      : undefined;

  if (!pool || !reserve || !oraclePrice) {
    return <Skeleton />;
  }

  const tokenSymbol = tokenMetadata?.symbol ?? toCompactAddress(assetId);

  return (
    <Section
      width={SectionSize.FULL}
      sx={{ padding: '6px', display: 'flex', flexDirection: 'column' }}
    >
      <Row sx={{ padding: '6px' }}>
        <Typography
          sx={{
            padding: '6px',
            display: 'flex',
            gap: '4px',
            alignItems: 'center',
          }}
          variant="body2"
          color={theme.palette.text.primary}
        >
          <Circle fontSize="inherit" sx={{ width: '8px', color: theme.palette.borrow.main }} />
          Borrow Info
        </Typography>
      </Row>
      <Row>
        <Box
          sx={{
            width: '100%',
            padding: '6px',
            margin: '6px',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'space-between',
            background: theme.palette.background.default,
          }}
        >
          <Typography sx={{ padding: '6px' }}>APY</Typography>
          <RateDisplay
            assetSymbol={tokenSymbol}
            assetRate={reserve.estBorrowApy}
            emissionSymbol={'BLND'}
            emissionApr={emissionApr}
            rateType={'charged'}
            direction={'horizontal'}
          />
        </Box>
      </Row>
      <Row>
        <Box
          sx={{
            width: '100%',
            padding: '6px',
            margin: '6px',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'space-between',
            background: theme.palette.background.default,
          }}
        >
          <Typography sx={{ padding: '6px' }}>Total Borrowed</Typography>
          <Typography sx={{ padding: '6px', color: theme.palette.borrow.main }}>
            {toBalance(reserve.totalLiabilitiesFloat())}
          </Typography>
        </Box>
      </Row>
      <Row>
        <Box
          sx={{
            width: '100%',
            padding: '6px',
            margin: '6px',
            borderRadius: '5px',
            display: 'flex',
            justifyContent: 'space-between',
            background: theme.palette.background.default,
          }}
        >
          <Typography sx={{ padding: '6px' }}>Liability Factor</Typography>
          <Typography sx={{ padding: '6px' }}>
            {toPercentage(reserve.getLiabilityFactor())}
          </Typography>
        </Box>
      </Row>
      <LinkBox
        sx={{ width: '100%' }}
        to={{ pathname: '/borrow', query: { poolId: poolId, assetId: reserve.assetId } }}
      >
        <Row>
          <OpaqueButton
            palette={theme.palette.borrow}
            sx={{
              display: 'flex',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'space-between',
              margin: '6px',
              padding: '12px',
            }}
          >
            Borrow
            <ArrowForwardIcon fontSize="inherit" />
          </OpaqueButton>
        </Row>
      </LinkBox>
    </Section>
  );
};
