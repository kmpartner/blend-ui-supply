import { useTheme } from '@mui/material';
import { useSettings, ViewType } from '../../contexts';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { PoolMenu } from './PoolMenu';

export const PoolExploreBar: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();
  const theme = useTheme();

  return (
    <Row>
      {viewType === ViewType.REGULAR && (
        <>
          <Section width={SectionSize.LARGE}>
            <PoolMenu poolId={poolId} />
          </Section>
          {/* <Section width={SectionSize.SMALL} sx={{ alignItems: 'center' }}>
            <LinkBox sx={{ width: '100%', height: '100%' }} to={{ pathname: '/' }}>
              <OpaqueButton
                palette={theme.palette.primary}
                sx={{ width: '100%', height: '100%', justifyContent: 'space-between' }}
              >
                Explore Pools
                <ArrowForwardIcon fontSize="inherit" />
              </OpaqueButton>
            </LinkBox>
          </Section> */}
        </>
      )}
      {viewType !== ViewType.REGULAR && (
        <Section width={SectionSize.FULL}>
          <PoolMenu poolId={poolId} />
        </Section>
      )}
    </Row>
  );
};
