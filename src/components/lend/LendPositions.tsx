import { useTheme } from '@mui/material';
import { useStore } from '../../store/store';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { LendBanner } from './LendBanner';
import { LendPositionList } from './LendPositionList';
export const LendPositions: React.FC<PoolComponentProps> = ({ poolId }) => {
  const theme = useTheme();

  const userPoolData = useStore((state) => state.userPoolData.get(poolId));

  if (!userPoolData || userPoolData.positionEstimates.totalSupplied == 0) {
    return <></>;
  }

  return (
    <Row>
      <Section
        type="alt"
        width={SectionSize.FULL}
        sx={{ flexDirection: 'column', paddingTop: '12px', padding: '0px', gap: '4px' }}
      >
        <Row>
          <LendBanner totalSupplied={userPoolData.positionEstimates.totalSupplied} />
        </Row>
        <LendPositionList poolId={poolId} />
      </Section>
    </Row>
  );
};
