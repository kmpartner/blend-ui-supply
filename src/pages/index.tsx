import type { NextPage } from 'next';
import { useState } from 'react';
import { useSettings } from '../contexts';
import { useBackstop } from '../hooks/api';

const Markets: NextPage = () => {
  const { data: backstop } = useBackstop();

  const [currentIndex, setCurrentIndex] = useState(0);
  const { blockedPools } = useSettings();

  const rewardZone = [...(backstop?.config?.rewardZone ?? [])].reverse();

  const safeRewardZone = rewardZone.filter((poolId) => !blockedPools.includes(poolId));

  function handlePoolLoaded(index: number) {
    if (index >= currentIndex) {
      setCurrentIndex(Math.min(currentIndex + 1, safeRewardZone.length));
    }
  }

  return (
    <>
      {/* <Row>
        <SectionBase type="alt" sx={{ margin: '6px', padding: '6px' }}>
          Markets
        </SectionBase>
      </Row>
      <Divider />
      {safeRewardZone.slice(0, currentIndex + 1).map((poolId, index) => {
        return (
          <MarketCard
            key={poolId}
            poolId={poolId}
            index={index}
            onLoaded={handlePoolLoaded}
          ></MarketCard>
        );
      })} */}
    </>
  );
};

export default Markets;
