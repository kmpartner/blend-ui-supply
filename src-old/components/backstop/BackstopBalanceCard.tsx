import { Box, Typography, useTheme } from '@mui/material';
import { useStore } from '../../store/store';
import { toBalance } from '../../utils/formatter';
import { LinkBox } from '../common/LinkBox';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { TokenIcon } from '../common/TokenIcon';

export interface BackstopBalanceCard extends PoolComponentProps {
  type: 'deposit' | 'wallet';
}

export const BackstopBalanceCard: React.FC<BackstopBalanceCard> = ({ type, poolId, sx }) => {
  const theme = useTheme();

  const backstopUserData = useStore((state) => state.backstopUserData);

  const headerText = type == 'deposit' ? 'Backstop deposit balance' : 'Wallet balance';
  const linkText = type == 'deposit' ? 'Queue for withdrawal' : 'Deposit';
  const linkPathname = type == 'deposit' ? '/backstop-q4w' : '/backstop-deposit';
  const linkPalette = type == 'deposit' ? theme.palette.primary : theme.palette.backstop;

  const balance =
    type == 'deposit' ? backstopUserData?.balances?.get(poolId)?.shares : backstopUserData?.tokens;

  return (
    <Section
      width={SectionSize.FULL}
      sx={{
        flexDirection: 'column',
        paddingTop: '12px',
        backgroundColor: theme.palette.background.paper,
        ...sx,
      }}
    >
      <Typography variant="body2" sx={{ margin: '6px' }}>
        {headerText}
      </Typography>
      <Row>
        <Box
          sx={{
            width: '100%',
            margin: '6px',
            padding: '12px',
            color: theme.palette.text.primary,
            backgroundColor: theme.palette.background.default,
            borderRadius: '5px',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
            <TokenIcon symbol="blndusdclp" sx={{ marginRight: '12px' }}></TokenIcon>
            <Box sx={{ display: 'flex', flexDirection: 'row' }}>
              <Typography variant="h4" sx={{ marginRight: '6px' }}>
                {toBalance(balance, 7)}
              </Typography>
              <Typography variant="body1" sx={{ color: theme.palette.text.secondary }}>
                BLND-USDC LP
              </Typography>
            </Box>
          </Box>
        </Box>
      </Row>
      <LinkBox
        sx={{ width: '100%', paddingRight: '12px' }}
        to={{ pathname: linkPathname, query: { poolId: poolId } }}
      >
        <OpaqueButton palette={linkPalette} sx={{ width: '100%', margin: '6px', padding: '6px' }}>
          {linkText}
        </OpaqueButton>
      </LinkBox>
    </Section>
  );
};
