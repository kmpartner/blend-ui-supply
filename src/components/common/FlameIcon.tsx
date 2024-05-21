import { Box, Tooltip, useTheme } from '@mui/material';
import Image from 'next/image';

export function FlameIcon({
  width = 32,
  height = 32,
  title,
}: {
  width?: number;
  height?: number;
  title?: string;
}) {
  const theme = useTheme();
  return (
    <Tooltip
      disableHoverListener={!title}
      disableFocusListener={!title}
      disableTouchListener={!title}
      title={title || ''}
      placement="top"
      enterTouchDelay={0}
      enterDelay={500}
      leaveTouchDelay={3000}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.primary.opaque,
          color: theme.palette.primary.main,
          borderRadius: '50%',
          padding: '4px',
          margin: '6px',
          display: 'flex',
          width,
          height,
        }}
      >
        <Image src="/icons/dashboard/flame.svg" height={height} width={width} alt="emmission" />
      </Box>
    </Tooltip>
  );
}
