import { useEffect } from "react";

const navigationEvent = "powwow:before-workspace-navigation";
type NavigationState = { dirty: boolean; busy: boolean };

/** Active project editors contribute their state before the app changes views. */
export function useBuilderNavigationGuard(dirty: boolean, busy: boolean) {
  useEffect(() => {
    const contribute = (event: Event) => {
      const detail = (event as CustomEvent<NavigationState>).detail;
      if (!detail) return;
      detail.dirty = detail.dirty || dirty;
      detail.busy = detail.busy || busy;
    };
    window.addEventListener(navigationEvent, contribute);
    return () => window.removeEventListener(navigationEvent, contribute);
  }, [dirty, busy]);
}

/** Call only at a user-requested navigation boundary, before changing app state. */
export function canLeaveBuilder(): boolean {
  const detail: NavigationState = { dirty: false, busy: false };
  window.dispatchEvent(new CustomEvent(navigationEvent, { detail }));
  if (detail.busy) return false;
  return (
    !detail.dirty ||
    window.confirm(
      "You have unsaved changes. Leave this editor and discard them?",
    )
  );
}
