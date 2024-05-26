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
        By supplying liquidity to the lending pool based on Stellar Blockchain, user will receive interest
        (if lended asset is in the reward zone, user can receive BLND token as well). 
      </Typography>

      <Typography variant="body2" sx={{ marginBottom: '12px', fontSize: "1rem" }}>
        Users can withdraw lended assets at any time.
        Users retain control of their assets. The protocol is decentralized, trust-free, and non-custodial. 
      </Typography>


      <Typography variant="body2" sx={{ marginBottom: '12px' }}>
        {/* When lenders withdraw their lent assets, they also withdraw any interest they have earned. */}
      </Typography>

    </Box>
  );
};
