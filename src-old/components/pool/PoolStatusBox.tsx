import AcUnitIcon from '@mui/icons-material/AcUnit';
import CheckIcon from '@mui/icons-material/Check';
import { Box, BoxProps, Typography, useTheme } from '@mui/material';
import React from 'react';

export interface PoolStatusBoxProps extends BoxProps {
  type?: 'normal' | 'large' | undefined;
  titleColor?: string | undefined;
  status?: 'Active' | 'On Ice' | 'Frozen' | undefined;
}

export const PoolStatusBox: React.FC<PoolStatusBoxProps> = ({
  type,
  titleColor,
  status,
  ...props
}) => {
  const theme = useTheme();
  const textType = type ? type : 'normal';
  const textVariant = textType == 'large' ? 'h2' : 'h4';
  const muiTitleColor = titleColor ? titleColor : 'text.secondary';
  const poolStatus = status ? status : 'Active';
  const statusTextColor = poolStatus == 'Active' ? 'backstop.main' : 'secondary.main';
  const statusBackColor = poolStatus == 'Active' ? 'backstop.opaque' : 'secondary.opaque';
  const statusIcon = poolStatus == 'Active' ? <CheckIcon /> : <AcUnitIcon />;
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '6px',
        ...props.sx,
      }}
    >
      <Box
        sx={{
          backgroundColor: theme.palette.background.default,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Typography variant="body2" color={muiTitleColor}>
          Pool Status
        </Typography>
        <Typography variant={textVariant} color={theme.palette.text.primary}>
          {poolStatus}
        </Typography>
      </Box>
      <Box sx={{ display: 'flex', flexDirection: 'row' }}>
        <Box
          sx={{
            backgroundColor: statusBackColor,
            color: statusTextColor,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '30px',
            height: '30px',
            borderRadius: '100px',
            padding: '4px',
          }}
        >
          {statusIcon}
        </Box>
      </Box>
    </Box>
  );
};
