import intl from 'react-intl-universal';
import { useAppIntlContext } from '@/components/AppIntlProvider';
import { Tab } from '@blueprintjs/core';
import { Tabs } from '@blueprintjs/core';
import { css } from '@emotion/css';
import { useState } from 'react';
import { CustomerFloatingActions } from './CustomerFloatingActions';
import { CustomerFormSections } from './CustomerFormFields';
import { Card, Group } from '@/components';

export function CustomerFormContent() {
  useAppIntlContext();
  const [selectedTabId, setSelectedTabId] = useState('primary');

  const handleTabChange = (tabId: string) => {
    const sectionId = String(tabId);
    setSelectedTabId(sectionId);

    const section = document.querySelector(`[data-section-id="${sectionId}"]`);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <Card
      className={css`
        padding-bottom: 0 !important;
      `}
    >
      <Group
        verticalAlign={'top'}
        alignItems={'flex-start'}
        flexWrap={'nowrap'}
      >
        <Tabs
          selectedTabId={selectedTabId}
          onChange={handleTabChange}
          className={css`
            position: sticky;
            top: 20px;
          `}
          vertical
        >
          <Tab id={'primary'} title={intl.get('basic')} />
          <Tab id={'financial'} title={intl.get('financial')} />
          <Tab id={'billingAddress'} title={intl.get('billing_address')} />
          <Tab id={'shippingAddress'} title={intl.get('shipping_address')} />
          <Tab id={'notes'} title={intl.get('notes')} />
        </Tabs>

        <CustomerFormSections />
      </Group>
      <CustomerFloatingActions />
    </Card>
  );
}
