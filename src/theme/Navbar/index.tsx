import React from 'react';
import Link from '@docusaurus/Link';
import {useThemeConfig, useColorMode} from '@docusaurus/theme-common';
import {
  useHideableNavbar,
  useNavbarMobileSidebar,
} from '@docusaurus/theme-common/internal';
import NavbarMobileSidebarToggle from '@theme/Navbar/MobileSidebar/Toggle';
import NavbarMobileSidebar from '@theme/Navbar/MobileSidebar';
import SearchBar from '@theme/SearchBar';
import clsx from 'clsx';
import styles from './styles.module.css';

function BrainboardIcon(): JSX.Element {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="24" height="24" rx="6" fill="var(--ifm-color-primary)" />
      <path d="M7 8.5h10M7 12h7M7 15.5h10" stroke="white" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function SunIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 18a6 6 0 1 1 0-12 6 6 0 0 1 0 12zm0-2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM11 1h2v3h-2V1zm0 19h2v3h-2v-3zM3.515 4.929l1.414-1.414L7.05 5.636 5.636 7.05 3.515 4.93zM16.95 18.364l1.414-1.414 2.121 2.121-1.414 1.414-2.121-2.121zm2.121-14.85l1.414 1.415-2.121 2.121-1.414-1.414 2.121-2.121zM5.636 16.95l1.414 1.414-2.121 2.121-1.414-1.414 2.121-2.121zM23 11v2h-3v-2h3zM4 11v2H1v-2h3z" />
    </svg>
  );
}

function MoonIcon(): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M11.38 2.019a7.5 7.5 0 1 0 10.6 10.6C21.83 17.963 17.315 22 12.002 22 6.477 22 2 17.523 2 12c0-5.314 4.038-9.827 9.38-10.28z" />
    </svg>
  );
}

function ThemeToggle(): JSX.Element {
  const {colorMode, setColorMode} = useColorMode();
  return (
    <button
      className={styles.themeToggle}
      onClick={() => setColorMode(colorMode === 'dark' ? 'light' : 'dark')}
      aria-label={colorMode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      title={colorMode === 'dark' ? 'Light' : 'Dark'}
    >
      {colorMode === 'dark' ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

function NavbarLogo(): JSX.Element {
  const {navbar} = useThemeConfig();
  return (
    <Link to="/" className={styles.brand}>
      {navbar.logo ? (
        <img
          src={navbar.logo.src}
          alt={navbar.logo.alt || navbar.title || ''}
          className={styles.brandLogo}
        />
      ) : (
        <BrainboardIcon />
      )}
      {navbar.title && (
        <span className={styles.brandTitle}>{navbar.title}</span>
      )}
    </Link>
  );
}

export default function Navbar(): JSX.Element {
  const {navbar: {hideOnScroll}} = useThemeConfig();
  const {navbarRef, isNavbarVisible} = useHideableNavbar(hideOnScroll);

  return (
    <>
      <nav
        ref={navbarRef}
        className={clsx('navbar', 'navbar--fixed-top', styles.navbar)}
        role="navigation"
        aria-label="Main"
      >
        <div className={styles.navbarInner}>
          {/* Left: mobile toggle + logo */}
          <div className={styles.navbarLeft}>
            <NavbarMobileSidebarToggle />
            <NavbarLogo />
          </div>

          {/* Center: search bar */}
          <div className={styles.navbarCenter}>
            <SearchBar />
          </div>

          {/* Right: nav links + theme toggle */}
          <div className={styles.navbarRight}>
            <Link to="/docs/README" className={styles.navLink}>Docs</Link>
            <Link to="/blog" className={styles.navLink}>Blog</Link>
            <ThemeToggle />
          </div>
        </div>
      </nav>
      <NavbarMobileSidebar />
    </>
  );
}
