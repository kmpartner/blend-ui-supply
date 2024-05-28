import '/public/fonts/dm-sans.css';

import CssBaseline from '@mui/material/CssBaseline';
import { ThemeProvider } from '@mui/material/styles';
import { AppProps } from 'next/app';
import Head from 'next/head';
import { SettingsProvider } from '../contexts';
import { WalletProvider } from '../contexts/wallet';
import DefaultLayout from '../layouts/DefaultLayout';
import theme from '../theme';

export default function MyApp(props: AppProps) {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <meta name="viewport" content="initial-scale=1, width=device-width" />

        <link rel="shortcut icon" href="/favicon.ico" />

        <title>Interest Earn Lending Pools</title>
        <meta
          name="description"
          content="user can provide assets to lending pools and receive interest in return" 
        />
      </Head>
      <ThemeProvider theme={theme}>
        <SettingsProvider>
          <WalletProvider>
            <CssBaseline />
            <DefaultLayout>
              <Component {...pageProps} />
            </DefaultLayout>
          </WalletProvider>
        </SettingsProvider>
      </ThemeProvider>
    </>
  );
}
