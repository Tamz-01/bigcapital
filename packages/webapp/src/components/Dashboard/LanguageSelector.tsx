import React from 'react';
import { Intent, Spinner } from '@blueprintjs/core';
import intl from 'react-intl-universal';
import { useAppIntlContext } from '../AppIntlProvider';
import { AppToaster } from '../AppToaster';
import { SUPPORTED_LOCALES, isSupportedLocale } from '@/constants/locales';
import { useUpdateAccountLanguage } from '@/hooks/query/users/queries';

export function LanguageSelector() {
  const { currentLocale, setCurrentLocale, isChangingLocale } =
    useAppIntlContext();
  const { mutateAsync, isPending } = useUpdateAccountLanguage();
  const busy = isPending || isChangingLocale;

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const language = event.target.value;
    if (!isSupportedLocale(language)) return;
    try {
      await mutateAsync({ language });
      await setCurrentLocale(language);
    } catch {
      AppToaster.show({
        message: intl
          .get('language_selector.save_failed')
          .d('Could not change your language. Please try again.'),
        intent: Intent.DANGER,
      });
    }
  };

  return (
    <div
      className="dashboard-language-selector"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        marginInlineEnd: 12,
      }}
    >
      <label htmlFor="personal-language" style={{ margin: 0 }}>
        {intl.get('language').d('Language')}
      </label>
      <select
        id="personal-language"
        aria-label="Display language"
        title={intl
          .get('language_selector.personal')
          .d('Your personal display language')}
        value={currentLocale}
        disabled={busy}
        onChange={handleChange}
        style={{
          maxWidth: 110,
          height: 30,
          border: '1px solid #d3d8de',
          borderRadius: 4,
          background: 'white',
          color: '#182026',
          minWidth: 90,
          paddingInline: 6,
        }}
      >
        {SUPPORTED_LOCALES.map(({ name, value }) => (
          <option key={value} value={value}>
            {name}
          </option>
        ))}
      </select>
      {busy && <Spinner size={14} />}
    </div>
  );
}
