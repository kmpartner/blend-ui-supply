import { Icon, IconProps } from '@mui/material';
import Image from 'next/image';
import React, { useState } from 'react';

export interface PoolIconProps extends IconProps {
  name: string;
}

export const PoolIcon: React.FC<PoolIconProps> = ({ name, ...props }) => {
  const [imgSrc, setImgSrc] = useState<string>(`/icons/pools/${name.toLowerCase()}.svg`);
  const onError = () => setImgSrc(`/icons/pools/blend.svg`);

  return (
    <Icon sx={{ borderRadius: '50%', ...props.sx }} {...props}>
      <Image src={imgSrc} alt={`${name}`} onError={onError} width="100%" height="100%" />
    </Icon>
  );
};
