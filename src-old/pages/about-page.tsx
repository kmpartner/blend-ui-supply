import { Box, Typography } from '@mui/material';
import { NextPage } from 'next';
import { Divider } from '../components/common/Divider';
import { Row } from '../components/common/Row';
import { AboutContent } from '../components/aboutContent/AboutContent';

const TermsOfService: NextPage = () => {
  return (
    <>
      <>
        <Row sx={{ margin: '12px', padding: '12px' }}>
          {/* <Typography variant="h1">About page content</Typography> */}
        </Row>
        <Divider />
        <Box sx={{ margin: '12px', padding: '12px' }}>
          <AboutContent />
        </Box>
      </>
    </>
  );
};

export default TermsOfService;
