import { Icon as MuiIcon, IconProps as MuiIconProps } from '@mui/material';
import Image from 'next/image';

export interface IconProps extends MuiIconProps {
  src: string;
  alt: string;
  height?: string;
  width?: string;
  isCircle?: boolean; // defaults to true
}

export const Icon: React.FC<IconProps> = ({ src, alt, height, width, isCircle, sx, ...props }) => {
  const resolvedHeight = height != undefined ? height : '30px';
  const resolvedWidth = width != undefined ? width : '30px';
  const resolvedIsCircle = isCircle == undefined ? true : isCircle;
  return (
    <MuiIcon
      sx={{
        borderRadius: resolvedIsCircle ? '50%' : '5px',
        height: resolvedHeight,
        width: resolvedWidth,
        ...sx,
      }}
      {...props}
    >
      <Image src={src} alt={alt} width="100%" height="100%" />
    </MuiIcon>
  );
};
