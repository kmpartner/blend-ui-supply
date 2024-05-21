import { useTheme } from '@mui/material';
import { useStore } from '../../store/store';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { BorrowBanner } from './BorrowBanner';
import { BorrowPositionList } from './BorrowPositionList';

export const BorrowPositions: React.FC<PoolComponentProps> = ({ poolId }) => {
  const theme = useTheme();

  const userPoolData = useStore((state) => state.userPoolData.get(poolId));

  if (!userPoolData || userPoolData.positionEstimates.totalBorrowed == 0) {
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
          <BorrowBanner totalBorrowed={userPoolData.positionEstimates.totalBorrowed} />
        </Row>
        <BorrowPositionList poolId={poolId} />
      </Section>
    </Row>
  );
};
