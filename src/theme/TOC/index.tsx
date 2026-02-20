import React from 'react';
import OriginalTOC from '@theme-original/TOC';
import styles from './styles.module.css';
import {useColorModeDom} from '../useColorModeDom';

type Props = React.ComponentProps<typeof OriginalTOC>;

function SunIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z" />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
      <path d="M11.38 2.019a7.5 7.5 0 1 0 10.6 10.6C21.83 17.963 17.315 22 12.002 22 6.477 22 2 17.523 2 12c0-5.314 4.038-9.827 9.38-10.28z" />
    </svg>
  );
}

function ThemeToggleFooter(): JSX.Element {
  const {colorMode, setColorMode} = useColorModeDom();

  return (
    <div className={styles.tocFooter}>
      <div className={styles.themeGroup} role="group" aria-label="Theme">
        <button
          className={`${styles.themeBtn} ${colorMode === 'light' ? styles.themeBtnActive : ''}`}
          onClick={() => setColorMode('light')}
          aria-label="Light theme"
          title="Light"
        >
          <SunIcon />
        </button>
        <button
          className={`${styles.themeBtn} ${colorMode === 'dark' ? styles.themeBtnActive : ''}`}
          onClick={() => setColorMode('dark')}
          aria-label="Dark theme"
          title="Dark"
        >
          <MoonIcon />
        </button>
      </div>
    </div>
  );
}

export default function TOC(props: Props): JSX.Element {
  return (
    <div className={styles.tocWrapper}>
      <OriginalTOC {...props} />
      <ThemeToggleFooter />
    </div>
  );
}
