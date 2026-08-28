import React from 'react';
import Layout from '@theme/Layout';
import SectorMap from '@site/src/components/SectorMap';

export default function MapPage() {
  return (
    <Layout
      title="Карта Сектора"
      description="Интерактивная карта созвездий и систем">
      <main style={{ padding: '2rem 0', display: 'flex', justifyContent: 'center' }}>
        <SectorMap />
      </main>
    </Layout>
  );
}