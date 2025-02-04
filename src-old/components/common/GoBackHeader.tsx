import { BoxProps } from '@mui/material';
import { PoolHeader } from '../pool/PoolHeader';
import { GoBackButton } from './GoBackButton';
import { Section, SectionSize } from './Section';

export interface GoBackHeaderProps extends BoxProps {
  name: string | undefined;
}

export const GoBackHeader: React.FC<GoBackHeaderProps> = ({ name }) => {
  return (
    <Section width={SectionSize.FULL} sx={{ padding: '12px' }}>
      <GoBackButton />
      <PoolHeader name={name ?? 'unknown'} />
    </Section>
  );
};
