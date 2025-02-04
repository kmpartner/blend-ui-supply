import { Box } from '@mui/material';

export interface BannerProps {
  children: React.ReactNode;
  sx?: object;
}

export function Banner({ children, sx }: BannerProps) {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'flex-start',
        width: '100%',
        height: '30px',
        borderRadius: '5px',
        padding: '6px',
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
