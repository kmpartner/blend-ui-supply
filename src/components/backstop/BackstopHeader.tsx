import { Box, BoxProps, Typography } from '@mui/material';
import { TokenIcon } from '../common/TokenIcon';

export interface BackstopHeaderProps extends BoxProps {
  type: 'deposit' | 'q4w';
}

export const BackstopHeader: React.FC<BackstopHeaderProps> = ({ type, sx, ...props }) => {
  const headerText =
    type === 'deposit' ? `Deposit BLND-USDC LP` : `Queue BLND-USDC LP for Withdrawal`;
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-start',
        alignItems: 'center',
        borderRadius: '5px',
        paddingLeft: '6px',
        ...sx,
      }}
      {...props}
    >
      <TokenIcon symbol={'blndusdclp'} sx={{ height: '30px', width: '30px' }} />
      <Typography variant="h3" sx={{ marginLeft: '12px' }}>
        {headerText}
      </Typography>
    </Box>
  );
};
