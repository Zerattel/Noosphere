import React from 'react';
import Head from '@docusaurus/Head';
import {Redirect} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';

// Корень сайта (https://zerattel.github.io/Noosphere/) -> /main
export default function Home() {
  const target = useBaseUrl('/main');
  return (
    <>
      <Head>
        {/* запасной вариант без JS */}
        <meta httpEquiv="refresh" content={`0; url=${target}`} />
        <link rel="canonical" href={`https://zerattel.github.io${target}`} />
      </Head>
      <Redirect to="/main" />
    </>
  );
}
