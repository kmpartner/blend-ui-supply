import { HelpOutline } from '@mui/icons-material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { Box, Skeleton, Tooltip, useTheme } from '@mui/material';
import { ViewType, useSettings } from '../../contexts';
import { useStore } from '../../store/store';
import { toBalance } from '../../utils/formatter';
import { CustomButton } from '../common/CustomButton';
import { Icon } from '../common/Icon';
import { LinkBox } from '../common/LinkBox';
import { PoolComponentProps } from '../common/PoolComponentProps';
import { Row } from '../common/Row';
import { Section, SectionSize } from '../common/Section';
import { StackedText } from '../common/StackedText';
import { PoolStatusBox } from '../pool/PoolStatusBox';

export const BackstopPreviewBar: React.FC<PoolComponentProps> = ({ poolId }) => {
  const { viewType } = useSettings();
  const theme = useTheme();

  const backstopPoolData = useStore((state) => state.backstop?.pools.get(poolId));
  const backstopUserData = useStore((state) => state.backstopUserData?.estimates.get(poolId));

  if (backstopPoolData == undefined) {
    return (
      <Section width={SectionSize.FULL}>
        <Skeleton variant="rectangular" />
      </Section>
    );
  }

  return (
    <>
      {viewType === ViewType.REGULAR && (
        <Row sx={{ padding: '0px 12px' }}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              width: '50%',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.palette.background.default,
                borderRadius: '5px',
              }}
            >
              <PoolStatusBox titleColor="inherit" type="large" status="Active" />
            </Box>
            {/* <Tooltip
              title="The amount of capital insuring this pool."
              placement="top"
              enterTouchDelay={0}
              enterDelay={500}
              leaveTouchDelay={3000}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginLeft: 'auto',
                  marginRight: '23px',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <StackedText
                    title="Total Backstop Size"
                    titleColor="inherit"
                    text={`$${toBalance(backstopPoolData.estimates.totalSpotValue)}`}
                    textColor="inherit"
                    type="large"
                  />
                  <HelpOutline
                    sx={{
                      color: theme.palette.text.secondary,
                      width: '15px',
                      marginLeft: '4px',
                      marginTop: '-4px',
                    }}
                  />
                </Box>
                <Icon
                  src={'/icons/dashboard/bkstp_size.svg'}
                  alt={`backstop size icon`}
                  sx={{ marginLeft: '12px' }}
                />
              </Box>
            </Tooltip> */}
          </Box>
          {/* <LinkBox
            sx={{ width: '45%', display: 'flex' }}
            to={{ pathname: '/backstop', query: { poolId: poolId } }}
          >
            <CustomButton
              sx={{
                width: '100%',
                padding: '12px',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  color: theme.palette.backstop.main,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <Icon
                  src={'/icons/dashboard/emissions_icon.svg'}
                  alt={`emissions icon`}
                  sx={{ marginRight: '12px' }}
                />
                <StackedText
                  title="Your Backstop Balance"
                  titleColor="inherit"
                  text={backstopUserData ? `$${toBalance(backstopUserData.totalSpotValue)}` : '--'}
                  textColor="inherit"
                  type="large"
                />
              </Box>
              <ArrowForwardIcon fontSize="inherit" />
            </CustomButton>
          </LinkBox> */}
        </Row>
      )}
      {viewType !== ViewType.REGULAR && (
        <Row
          sx={{
            display: 'flex',
            flexDirection: 'column',
            padding: '0px 12px',
            gap: '12px',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-around',
            }}
          >
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: theme.palette.background.default,
                borderRadius: '5px',
              }}
            >
              <PoolStatusBox titleColor="inherit" type="large" status="Active" />
            </Box>
            <Tooltip
              title="The amount of capital insuring this pool."
              placement="top"
              enterTouchDelay={0}
              enterDelay={500}
              leaveTouchDelay={3000}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginRight: '23px',
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'row' }}>
                  <StackedText
                    title="Total Backstop Size"
                    titleColor="inherit"
                    text={`$${toBalance(backstopPoolData.estimates.totalSpotValue)}`}
                    textColor="inherit"
                    type="large"
                  />
                  <HelpOutline
                    sx={{
                      color: theme.palette.text.secondary,
                      width: '15px',
                      marginLeft: '4px',
                      marginTop: '-4px',
                    }}
                  />
                </Box>
                <Icon
                  src={'/icons/dashboard/bkstp_size.svg'}
                  alt={`backstop size icon`}
                  sx={{ marginLeft: '12px' }}
                />
              </Box>
            </Tooltip>
          </Box>
          <LinkBox
            sx={{ width: '100%' }}
            to={{ pathname: '/backstop-q4w', query: { poolId: 'poolId' } }}
          >
            <CustomButton
              sx={{
                width: '100%',
                padding: '12px',
                color: theme.palette.text.primary,
                backgroundColor: theme.palette.background.paper,
                '&:hover': {
                  color: theme.palette.backstop.main,
                },
              }}
            >
              <Box sx={{ display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                <Icon
                  src={'/icons/dashboard/emissions_icon.svg'}
                  alt={`emissions icon`}
                  sx={{ marginRight: '12px' }}
                />
                <StackedText
                  title="Your Backstop Balance"
                  titleColor="inherit"
                  text={backstopUserData ? `$${toBalance(backstopUserData.totalSpotValue)}` : '--'}
                  textColor="inherit"
                  type="large"
                />
              </Box>
              <ArrowForwardIcon fontSize="inherit" />
            </CustomButton>
          </LinkBox>
        </Row>
      )}
    </>
  );
};
