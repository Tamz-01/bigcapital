import { ReactNode } from 'react';
import BodyClassName from 'react-body-classname';
import { Icon } from '@/components';
import { BigcapitalAlt } from '@/components/Icons/BigcapitalAlt';
import { useIsDarkMode } from '@/hooks/useDarkMode';
import '@/style/pages/Authentication/Auth.scss';

interface AuthContainerProps {
  children: ReactNode;
}

export function AuthContainer({ children }: AuthContainerProps) {
  const isDarkMode = useIsDarkMode();

  return (
    <BodyClassName className="authentication">
      <main className="auth-page">
        <div className="auth-page__inner">
          <div className="auth-page__logo">
            {isDarkMode ? (
              <BigcapitalAlt
                color="rgba(255, 255, 255, 0.6)"
                height={37}
                width={214}
              />
            ) : (
              <Icon icon="bigcapital" height={37} width={214} />
            )}
          </div>
          {children}
        </div>
      </main>
    </BodyClassName>
  );
}
