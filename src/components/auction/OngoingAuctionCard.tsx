import {
  Auction,
  AuctionType,
  parseResult,
  Pool,
  PoolContract,
  Positions,
  PositionsEstimate,
  RequestType,
  SubmitArgs,
} from '@blend-capital/blend-sdk';
import { Box, Typography, useTheme } from '@mui/material';
import { Asset, rpc } from '@stellar/stellar-sdk';
import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useWallet } from '../../contexts/wallet';
import { useBackstop, useHorizonAccount, usePoolOracle, usePoolUser } from '../../hooks/api';
import { calculateAuctionOracleProfit } from '../../utils/auction';
import { toBalance, toCompactAddress, toPercentage } from '../../utils/formatter';
import { requiresTrustline } from '../../utils/horizon';
import { getErrorFromSim, SubmitError } from '../../utils/txSim';
import { AnvilAlert } from '../common/AnvilAlert';
import { DividerSection } from '../common/DividerSection';
import { OpaqueButton } from '../common/OpaqueButton';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { StackedTextBox } from '../common/StackedTextBox';
import { TxOverview } from '../common/TxOverview';
import { Value } from '../common/Value';
import { ValueChange } from '../common/ValueChange';
import { BidBalanceChange } from './BidBalanceChange';
import { BidList } from './BidList';
import { LotBalanceChange } from './LotBalanceChange';
import { LotList } from './LotList';

export interface OngoingAuctionCardProps extends PoolComponentProps {
  pool: Pool;
  auction: Auction;
  currLedger: number;
  index: number;
}

export const OngoingAuctionCard: React.FC<OngoingAuctionCardProps> = ({
  pool,
  auction,
  sx,
  currLedger,
}) => {
  const theme = useTheme();
  const { walletAddress, connected, poolSubmit, createTrustlines, isLoading, txType } = useWallet();
  const { data: poolOracle } = usePoolOracle(pool);
  const { data: backstop } = useBackstop();
  const { data: horizonAccount } = useHorizonAccount();
  const { data: poolUser } = usePoolUser(pool);
  const [simResponse, setSimResponse] = useState<rpc.Api.SimulateTransactionResponse>();
  const [parsedSimResult, setParsedSimResult] = useState<Positions>();
  const [loadingEstimate, setLoadingEstimate] = useState<boolean>(false);

  const positionEstimate =
    poolOracle && poolUser && PositionsEstimate.build(pool, poolOracle, poolUser.positions);
  const { scaledAuction, auctionValue, newPositionEstimate, trustlinesToAdd, hasTokenTrustline } =
    useMemo(() => {
      const scaledAuction = auction.scale(currLedger + 1)[0];
      const auctionValue =
        poolOracle &&
        backstop &&
        calculateAuctionOracleProfit(
          scaledAuction.data,
          scaledAuction.type,
          pool,
          poolOracle,
          backstop.backstopToken
        );
      const newPositionEstimate =
        poolOracle && parsedSimResult && PositionsEstimate.build(pool, poolOracle, parsedSimResult);

      const trustlinesToAdd: Asset[] = [];
      let hasTokenTrustline = true;
      const auctionAssetSet = new Set(scaledAuction.data.lot.keys());
      for (const asset of Array.from(scaledAuction.data.bid.keys())) {
        auctionAssetSet.add(asset);
      }
      for (const asset of Array.from(auctionAssetSet)) {
        const reserve = pool.reserves.get(asset);
        if (requiresTrustline(horizonAccount, reserve?.tokenMetadata?.asset)) {
          hasTokenTrustline = false;
          if (reserve?.tokenMetadata?.asset) {
            trustlinesToAdd.push(reserve.tokenMetadata.asset);
          }
          break;
        }
      }
      return {
        scaledAuction,
        auctionValue,
        newPositionEstimate,
        trustlinesToAdd,
        hasTokenTrustline,
      };
    }, [auction, simResponse, currLedger, poolOracle, backstop, pool, parsedSimResult]);

  const handleAddAssetTrustline = async () => {
    if (connected && trustlinesToAdd.length > 0) {
      await createTrustlines(trustlinesToAdd);
    }
  };
  const AddTrustlineButton = (
    <OpaqueButton
      onClick={handleAddAssetTrustline}
      palette={theme.palette.warning}
      sx={{ margin: '6px', padding: '6px' }}
    >
      Add Trustlines
    </OpaqueButton>
  );
  const { reason, disabledType, extraContent, isError } = useMemo(() => {
    if (!hasTokenTrustline) {
      let submitError: SubmitError = {
        isSubmitDisabled: true,
        isError: true,
        isMaxDisabled: true,
        reason: 'Missing trustline for auction asset.',
        disabledType: 'warning',
        extraContent: AddTrustlineButton,
      };
      return submitError;
    } else {
      return getErrorFromSim('1', 0, isLoading, simResponse, undefined);
    }
  }, [hasTokenTrustline, isLoading, loadingEstimate, simResponse, theme.palette.warning]);

  const handleSubmitTransaction = async (sim: boolean) => {
    if (!connected) return;

    let requestType: RequestType;
    switch (auction.type) {
      case AuctionType.Interest:
        requestType = RequestType.FillInterestAuction;
        break;
      case AuctionType.BadDebt:
        requestType = RequestType.FillBadDebtAuction;
        break;
      case AuctionType.Liquidation:
        requestType = RequestType.FillUserLiquidationAuction;
        break;
    }

    const submitArgs: SubmitArgs = {
      from: walletAddress,
      to: walletAddress,
      spender: walletAddress,
      requests: [
        {
          amount: BigInt(100),
          address: auction.user,
          request_type: requestType,
        },
      ],
    };

    let response = await poolSubmit(pool.id, submitArgs, sim);
    if (response && sim) {
      setSimResponse(response);
      if (rpc.Api.isSimulationSuccess(response)) {
        setParsedSimResult(parseResult(response, PoolContract.parsers.submit));
      } else {
        console.error('Simulation failed', response);
      }
    }
    setLoadingEstimate(false);
    return response;
  };
  return (
    <Section width={SectionSize.FULL} sx={{ flexDirection: 'column', marginBottom: '12px', ...sx }}>
      <Box
        sx={{
          width: '100%',
        }}
      >
        <Row>
          <Typography variant="h3" sx={{ margin: '12px' }}>
            Auction {toCompactAddress(auction.user)}
          </Typography>
          <Box
            sx={{
              margin: '6px',
              padding: '6px',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                padding: '4px',
                color: theme.palette.positive.main,
                background: theme.palette.positive.opaque,
                borderRadius: '5px',
                lineHeight: '100%',
              }}
            >
              *{AuctionType[auction.type]}*
            </Box>
          </Box>
        </Row>
        <Row>
          <StackedTextBox
            name="Started"
            text={` ${auction.data.block} `}
            sx={{ width: '50%' }}
          ></StackedTextBox>
          {
            <StackedTextBox
              name="Current Block"
              text={`${currLedger}`}
              sx={{ width: '50%' }}
            ></StackedTextBox>
          }
        </Row>
      </Box>
      <LotList
        pool={pool}
        lot={scaledAuction.data.lot}
        type={
          auction.type === AuctionType.Interest || auction.type === AuctionType.BadDebt
            ? 'Underlying'
            : 'Collateral'
        }
      />
      <DividerSection />
      <BidList
        pool={pool}
        bid={scaledAuction.data.bid}
        type={auction.type === AuctionType.Interest ? 'Underlying' : 'Liability'}
      />

      <OpaqueButton
        palette={!parsedSimResult ? theme.palette.primary : theme.palette.positive}
        sx={{ margin: '6px', padding: '6px' }}
        onClick={() => handleSubmitTransaction(true)}
        disabled={parsedSimResult && simResponse && simResponse.latestLedger === currLedger}
      >
        {!parsedSimResult ? 'Simulate Bid' : 'Update'}
      </OpaqueButton>

      <DividerSection />
      {!isError && parsedSimResult && (
        <TxOverview>
          {auctionValue && (
            <Value
              title="Oracle estimated profit"
              value={`${toBalance(auctionValue.lot - auctionValue.bid, 3)}`}
            />
          )}
          <Value title="Block" value={simResponse?.latestLedger?.toString() ?? ''} />
          <Value
            title={
              <>
                <Image src="/icons/dashboard/gascan.svg" alt="blend" width={20} height={20} /> Gas
              </>
            }
            value={`${toBalance(BigInt((simResponse as any)?.minResourceFee ?? 0), 7)} XLM`}
          />
          {Array.from(scaledAuction.data.lot).map(([asset, amount]) => (
            <LotBalanceChange
              key={asset}
              pool={pool}
              auctionType={auction.type}
              assetId={asset}
              lotAmount={amount}
              newPosition={parsedSimResult}
            />
          ))}
          {Array.from(scaledAuction.data.bid).map(([asset, amount]) => (
            <BidBalanceChange
              key={asset}
              pool={pool}
              auctionType={auction.type}
              assetId={asset}
              bidAmount={amount}
              newPosition={parsedSimResult}
            />
          ))}
          {(auction.type === AuctionType.Liquidation || auction.type === AuctionType.BadDebt) && (
            <>
              <ValueChange
                title="Borrow capacity"
                curValue={`${toBalance(positionEstimate?.borrowCap)} USD`}
                newValue={`${toBalance(newPositionEstimate?.borrowCap)} USD`}
              />

              <ValueChange
                title="Borrow limit"
                curValue={`${toPercentage(positionEstimate?.borrowLimit)}`}
                newValue={`${toPercentage(newPositionEstimate?.borrowLimit)}`}
              />
            </>
          )}
        </TxOverview>
      )}
      {!isError && parsedSimResult && (
        <OpaqueButton
          palette={theme.palette.primary}
          sx={{ margin: '6px', padding: '6px' }}
          onClick={() => handleSubmitTransaction(false)}
        >
          Submit Bid
        </OpaqueButton>
      )}
      {isError && (
        <AnvilAlert severity={disabledType!} message={reason} extraContent={extraContent} />
      )}
    </Section>
  );
};
