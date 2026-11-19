import { Tab, Tabs } from '@blueprintjs/core';
import { useRef, useState, type ReactNode } from 'react';
import { Card, Group } from '@/components';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface MasterRecordFormLayoutProps {
  sections: ReadonlyArray<readonly [id: string, title: string]>;
  children: ReactNode;
  actions: ReactNode;
}

export function MasterRecordFormLayout({
  sections,
  children,
  actions,
}: MasterRecordFormLayoutProps) {
  const compact = useMediaQuery('(max-width: 767.98px)');
  const content = useRef<HTMLDivElement>(null);
  const [selectedTab, setSelectedTab] = useState(sections[0][0]);

  const goToSection = (id: string) => {
    setSelectedTab(id);
    content.current
      ?.querySelector(`[data-section-id="${id}"]`)
      ?.scrollIntoView({ block: 'start', behavior: 'smooth' });
  };

  return (
    <Card className="master-record-form">
      <Group align="flex-start" noWrap className="master-record-form__layout">
        <Tabs
          className="master-record-form__navigation"
          selectedTabId={selectedTab}
          onChange={goToSection}
          vertical={!compact}
          animate={false}
        >
          {sections.map(([id, title]) => (
            <Tab key={id} id={id} title={title} />
          ))}
        </Tabs>
        <div className="master-record-form__fields" ref={content}>
          {children}
        </div>
      </Group>
      {actions}
    </Card>
  );
}
