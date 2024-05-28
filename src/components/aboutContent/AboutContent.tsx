import { Box, Typography } from '@mui/material';

export const AboutContent = () => {
  return (
    <Box>
      <Typography variant="body2" sx={{ marginBottom: '24px', fontSize: "1.5rem" }}>
        About Page
      </Typography>
      <Typography variant="body2" sx={{ marginBottom: '12px', fontSize: "1rem" }}>
        In this page, user can provide assets to lending pools and receive interest in return. 
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: '12px', fontSize: "1rem" }}>
        By supplying liquidity to the lending pools based on Stellar Blockchain, user will receive interest
        (if lent asset is in the reward zone, user can receive BLND token as well). 
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: '12px', fontSize: "1rem" }}>
        Users can withdraw lent assets at any time.
        Users retain control of their assets. The protocol is decentralized, trust-free, and non-custodial. 
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: '12px', fontSize: "1rem" }}>
        By using smart contracts in Stellar Network, this page allows users to access lending pools on the network.
        BLND is token for lending pools. It is issued to users of lending pools, and can be used for insuring lending pools.
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: '12px' }}>
        {/* When lenders withdraw their lent assets, they also withdraw any interest they have earned. */}
      </Typography>

    </Box>
  );
};
