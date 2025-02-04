import type { NextPage } from 'next';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { SectionBase } from '../components/common/SectionBase';
import { MarketCard } from '../components/markets/MarketCard';
import { useStore } from '../store/store';

const Markets: NextPage = () => {
  const pools = useStore((state) => state.pools);

  return (
    <>
      <Row>
        <SectionBase type="alt" sx={{ margin: '6px', padding: '6px' }}>
          Markets
        </SectionBase>
      </Row>
      <Divider />
      {Array.from(pools.keys()).map((poolId) => (
        <MarketCard key={poolId} poolId={poolId}></MarketCard>
      ))}
    </>
  );
};

export default Markets;
