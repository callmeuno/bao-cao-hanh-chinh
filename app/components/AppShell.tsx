'use client';

import { useCallback, useEffect, useState, type MouseEvent, type ReactNode } from 'react';

type AppShellProps = {
  sidebar: ReactNode;
  topbarTitle: ReactNode;
  topbarUser: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, topbarTitle, topbarUser, children }: AppShellProps) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') close();
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, close]);

  function onSidebarClick(event: MouseEvent<HTMLDivElement>) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('.sidebar-item')) close();
  }

  return (
    <div className="app-shell">
      {open ? (
        <button
          type="button"
          className="sidebar-overlay"
          aria-label="Đóng menu"
          onClick={close}
        />
      ) : null}

      <aside className={open ? 'sidebar sidebar--open' : 'sidebar'}>
        <button
          type="button"
          className="sidebar-close"
          aria-label="Đóng menu"
          onClick={close}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.6" />
          </svg>
        </button>

        <div className="sidebar-body" onClick={onSidebarClick}>
          {sidebar}
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              type="button"
              className="btn-hamburger"
              aria-label="Mở menu"
              onClick={() => setOpen(true)}
            >
              <svg width="18" height="14" viewBox="0 0 18 14" fill="none" aria-hidden="true">
                <path
                  d="M1 1h16M1 7h16M1 13h16"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                />
              </svg>
            </button>

            {typeof topbarTitle === 'string' ? (
              <span className="topbar-title">{topbarTitle}</span>
            ) : (
              topbarTitle
            )}
          </div>

          <div className="topbar-user">{topbarUser}</div>
        </header>

        <main className="page-content">{children}</main>
      </div>
    </div>
  );
}
