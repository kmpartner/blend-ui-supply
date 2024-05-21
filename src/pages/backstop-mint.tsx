import { Box, Typography, useTheme } from '@mui/material';
import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { BackstopMintAnvil } from '../components/backstop/BackstopMintAnvil';
import { GoBackButton } from '../components/common/GoBackButton';
import { Row } from '../components/common/Row';
import { Section, SectionSize } from '../components/common/Section';
import { TokenIcon } from '../components/common/TokenIcon';
import { useStore } from '../store/store';
import { toBalance } from '../utils/formatter';

const BackstopMint: NextPage = () => {
  const theme = useTheme();

  const router = useRouter();

  const backstopData = useStore((state) => state.backstop);
  const [currentDepositToken, setCurrentDepositToken] = useState<{
    address: string | undefined;
    symbol: string;
  }>({ address: backstopData?.config.usdcTkn, symbol: 'USDC' });
  const balancesByAddress = useStore((state) => state.balances);

  return (
    <>
      <Row sx={{ margin: '12px' }}>
        <GoBackButton />
      </Row>
      <Row>
        <Section width={SectionSize.FULL} sx={{ marginTop: '12px', marginBottom: '12px' }}>
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              justifyContent: 'start',
              gap: '1rem',
              alignItems: 'center',
              padding: '12px',
            }}
          >
            <TokenIcon symbol="blndusdclp" />
            <Typography variant="h4">Mint BLND-USDC LP</Typography>
          </Box>
        </Section>
      </Row>
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
                Available
              </Typography>
              <Typography variant="h4" sx={{ color: theme.palette.backstop.main }}>
                {toBalance(balancesByAddress.get(currentDepositToken.address ?? ''), 7)}
              </Typography>
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: theme.palette.text.secondary }}>
                {currentDepositToken.symbol}
              </Typography>
            </Box>
          </Box>
        </Section>
      </Row>

      <BackstopMintAnvil
        currentDepositToken={currentDepositToken}
        setCurrentDepositToken={setCurrentDepositToken}
      />
    </>
  );
};

export default BackstopMint;
