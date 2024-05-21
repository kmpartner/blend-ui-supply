import { LoopOutlined } from '@mui/icons-material';
import { Box, BoxProps, Input, PaletteColor, Typography, useTheme } from '@mui/material';
import { ChangeEvent } from 'react';
import { CustomButton } from './CustomButton';

export interface InputBarProps extends BoxProps {
  symbol: string;
  value: string | undefined;
  onValueChange: (new_value: string) => void;
  onSetMax: () => void;
  palette: PaletteColor;
  isMaxDisabled?: boolean;
  type?: 'number' | 'text';
  showSwitch?: boolean;
  onSwitchClick?: () => void;
}

export const InputBar: React.FC<InputBarProps> = ({
  symbol,
  value,
  onValueChange,
  onSetMax,
  palette,
  sx,
  type = 'number',
  isMaxDisabled,
  showSwitch,
  onSwitchClick,
  ...props
}) => {
  const theme = useTheme();
  /**
   * sanitize input if type is number
   */
  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const newValue = event.target.value;

    if (type === 'number' && newValue !== '') {
      const sanitizedValue = newValue.replace(/[^0-9.\.]/g, '');
      onValueChange(sanitizedValue);
    } else {
      onValueChange(newValue);
    }
  }
  /**
   * sanitize on key down if type is number
   */
  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (type === 'number') {
      const inputHasDecimalPoint = value?.includes('.');
      if (inputHasDecimalPoint && event.key === '.') {
        event.preventDefault();
      }
    }
  }
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '3px',
        borderRadius: '5px',
        backgroundColor: theme.palette.accent.main,
        ...sx,
      }}
      {...props}
    >
      <Input
        value={value || ''}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="0"
        disableUnderline={true}
        sx={{ marginLeft: '12px', width: '50%' }}
      />
      <Box
        sx={{
          marginLeft: '12px',
          display: 'flex',
          justifyContent: 'end',
          alignItems: 'center',
          width: '40%',
          gap: '4px',
        }}
      >
        <Typography
          variant="h5"
          sx={{ minWidth: '113px', color: theme.palette.text.secondary, textAlign: 'right' }}
        >
          {symbol}
        </Typography>
        {showSwitch && (
          <Box
            sx={{
              color: palette.main,
              backgroundColor: palette.opaque,
              borderRadius: '20%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '4px',
              marginLeft: '6px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
            }}
            onClick={onSwitchClick}
          >
            <LoopOutlined />
          </Box>
        )}
        <CustomButton
          onClick={onSetMax}
          disabled={isMaxDisabled}
          sx={{
            color: palette.main,
            backgroundColor: palette.opaque,
            width: '60px',
            marginRight: '2px',
            marginLeft: '6px',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          MAX
        </CustomButton>
      </Box>
    </Box>
  );
};
