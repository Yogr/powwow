import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export type MenuItem = {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  checked?: boolean;
  selected?: boolean;
  disabled?: boolean;
  separator?: boolean;
  onSelect: () => void;
};

/** Shared keyboard-operable action menu for the composer and account area. */
export function PopoverMenu({
  label,
  trigger,
  items,
  className = "",
  placement = "above",
  disabled = false,
}: {
  label: string;
  trigger: ReactNode;
  items: MenuItem[];
  className?: string;
  placement?: "above" | "below";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({
    left: 12,
    top: 0,
    above: true,
    height: 400,
  });
  const id = useId();
  const close = (restore = false) => {
    setOpen(false);
    if (restore) button.current?.focus();
  };
  useEffect(() => {
    if (!open) return;
    panel.current
      ?.querySelector<HTMLButtonElement>("button:not(:disabled)")
      ?.focus();
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !panel.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener("pointerdown", outside);
    return () => document.removeEventListener("pointerdown", outside);
  }, [open]);
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = button.current?.getBoundingClientRect();
      if (!rect) return;
      const above =
        placement === "above"
          ? rect.top > 170
          : window.innerHeight - rect.bottom < 180;
      setPosition({
        left: Math.max(12, Math.min(rect.left, window.innerWidth - 312)),
        top: above ? rect.top - 8 : rect.bottom + 8,
        above,
        height: Math.max(
          100,
          (above ? rect.top : window.innerHeight - rect.bottom) - 24,
        ),
      });
    };
    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, placement]);
  return (
    <div
      ref={root}
      className={`pw-menu ${className}`}
      onBlur={(event) => {
        if (
          event.relatedTarget &&
          !event.currentTarget.contains(event.relatedTarget) &&
          !panel.current?.contains(event.relatedTarget)
        )
          setOpen(false);
      }}
    >
      <button
        type="button"
        ref={button}
        className="pw-menu-trigger"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        {trigger}
      </button>
      {open &&
        createPortal(
          <div
            ref={panel}
            id={id}
            className="pw-menu-panel"
            role="menu"
            aria-label={label}
            style={{
              left: position.left,
              top: position.top,
              maxHeight: position.height,
              transform: position.above ? "translateY(-100%)" : undefined,
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                event.stopPropagation();
                close(true);
              }
              if (event.key === "Tab") close(true);
              if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
                event.preventDefault();
                const options = [
                  ...(panel.current?.querySelectorAll<HTMLButtonElement>(
                    "button:not(:disabled)",
                  ) || []),
                ];
                const current = options.indexOf(
                  document.activeElement as HTMLButtonElement,
                );
                const next =
                  event.key === "Home"
                    ? 0
                    : event.key === "End"
                      ? options.length - 1
                      : (current +
                          (event.key === "ArrowUp" ? -1 : 1) +
                          options.length) %
                        options.length;
                options[next]?.focus();
              }
            }}
          >
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                tabIndex={-1}
                role={
                  item.checked !== undefined
                    ? "menuitemcheckbox"
                    : item.selected !== undefined
                      ? "menuitemradio"
                      : "menuitem"
                }
                aria-checked={item.checked ?? item.selected}
                disabled={item.disabled}
                className={item.separator ? "pw-menu-separated" : undefined}
                onClick={() => {
                  close(true);
                  item.onSelect();
                }}
              >
                {item.icon}
                <span>
                  <strong>{item.label}</strong>
                  {item.description && <small>{item.description}</small>}
                </span>
                {(item.checked || item.selected) && (
                  <Check className="pw-menu-check" size={15} />
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}
