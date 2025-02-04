import { Box, BoxProps, Typography } from '@mui/material';
import theme from '../../theme';

export interface StackedAprProps extends BoxProps {
  aprLend: string;
  aprBorrow: string;
}

export const StackedApr: React.FC<StackedAprProps> = ({ aprLend, aprBorrow, sx, ...props }) => {
  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        ...sx,
      }}
      {...props}
    >
      <Box
        sx={{
          padding: '4px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          color: theme.palette.lend.main,
          background: theme.palette.lend.opaque,
          borderRadius: '5px',
        }}
      >
        <Typography variant="body2">{`${aprLend}`}</Typography>
        <Typography variant="body2">S</Typography>
      </Box>
      <Box
        sx={{
          marginTop: '6px',
          padding: '4px',
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          color: theme.palette.borrow.main,
          background: theme.palette.borrow.opaque,
          borderRadius: '5px',
        }}
      >
        <Typography variant="body2">{`${aprBorrow}`}</Typography>
        <Typography variant="body2">B</Typography>
      </Box>
    </Box>
  );
};
