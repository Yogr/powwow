import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import type { KeyboardEvent, ReactNode } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import "./select-menu.css";

export type SelectMenuOption = {
  value: string;
  label: string;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
};
export type SelectMenuProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectMenuOption[];
  ariaLabel: string;
  disabled?: boolean;
  className?: string;
  id?: string;
  placeholder?: string;
};

/** A compact, keyboard-accessible select with a menu that escapes panel clipping. */
export function SelectMenu({
  value,
  onChange,
  options,
  ariaLabel,
  disabled,
  className = "",
  id,
  placeholder = "Choose an option",
}: SelectMenuProps) {
  const generatedId = useId();
  const listId = `${generatedId}-options`;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    width: 220,
    maxHeight: 300,
  });
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const search = useRef({ value: "", time: 0 });
  const selected = options.find((option) => option.value === value);
  const enabled = options
    .map((option, index) => ({ option, index }))
    .filter((item) => !item.option.disabled);
  const activeOption = options[active];

  function close(restoreFocus = false) {
    setOpen(false);
    if (restoreFocus) trigger.current?.focus();
  }
  function show() {
    if (disabled || !enabled.length) return;
    const current = options.findIndex(
      (option) => option.value === value && !option.disabled,
    );
    setActive(current >= 0 ? current : enabled[0].index);
    setOpen(true);
  }
  function choose(index: number) {
    if (!options[index] || options[index].disabled) return;
    onChange(options[index].value);
    close(true);
  }
  useLayoutEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = trigger.current?.getBoundingClientRect();
      if (!rect) return;
      const width = Math.min(Math.max(rect.width, 220), window.innerWidth - 20);
      const below = window.innerHeight - rect.bottom - 18;
      const above = rect.top - 18;
      const upwards =
        below < Math.min(240, options.length * 48) && above > below;
      const maxHeight = Math.max(80, Math.min(340, upwards ? above : below));
      const measured = Math.min(menu.current?.scrollHeight || 340, maxHeight);
      setPosition({
        width,
        maxHeight,
        left: Math.max(10, Math.min(rect.left, window.innerWidth - width - 10)),
        top: upwards ? Math.max(10, rect.top - measured - 7) : rect.bottom + 7,
      });
    };
    place();
    menu.current?.focus();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, options.length]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      const node = event.target as Node;
      if (!menu.current?.contains(node) && !trigger.current?.contains(node))
        close();
    };
    const focus = (event: FocusEvent) => {
      const node = event.target as Node;
      if (!menu.current?.contains(node) && !trigger.current?.contains(node))
        close();
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("focusin", focus);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("focusin", focus);
    };
  }, [open]);
  useEffect(() => {
    if (disabled) setOpen(false);
  }, [disabled]);
  useEffect(() => {
    if (open)
      menu.current
        ?.querySelector<HTMLElement>(`[data-option-index="${active}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [active, open]);

  function keydown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      close(true);
      return;
    }
    if (event.key === "Tab") {
      close(true);
      return;
    }
    if (["Enter", " "].includes(event.key)) {
      event.preventDefault();
      choose(active);
      return;
    }
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const index = enabled.findIndex((item) => item.index === active);
      const next =
        event.key === "Home"
          ? 0
          : event.key === "End"
            ? enabled.length - 1
            : (index + (event.key === "ArrowDown" ? 1 : -1) + enabled.length) %
              enabled.length;
      if (enabled[next]) setActive(enabled[next].index);
      return;
    }
    if (
      event.key.length === 1 &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey
    ) {
      event.preventDefault();
      const now = Date.now();
      const text =
        (now - search.current.time < 650 ? search.current.value : "") +
        event.key.toLocaleLowerCase();
      search.current = { value: text, time: now };
      const match = enabled.find((item) =>
        item.option.label.toLocaleLowerCase().startsWith(text),
      );
      if (match) setActive(match.index);
    }
  }

  return (
    <>
      <button
        id={id}
        ref={trigger}
        type="button"
        className={`select-menu-trigger ${className}`}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        disabled={disabled}
        onClick={() => (open ? close() : show())}
        onKeyDown={(event) => {
          if (["ArrowDown", "ArrowUp"].includes(event.key)) {
            event.preventDefault();
            show();
          }
        }}
      >
        {selected?.icon && (
          <span className="select-menu-icon">{selected.icon}</span>
        )}
        <span>{selected?.label || placeholder}</span>
        <ChevronDown size={14} />
      </button>
      {open &&
        createPortal(
          <div
            id={listId}
            ref={menu}
            className="select-menu-list"
            role="listbox"
            aria-label={ariaLabel}
            tabIndex={-1}
            aria-activedescendant={
              activeOption ? `${listId}-${active}` : undefined
            }
            style={position}
            onKeyDown={keydown}
          >
            {options.map((option, index) => (
              <div
                id={`${listId}-${index}`}
                key={option.value}
                role="option"
                aria-selected={option.value === value}
                aria-disabled={option.disabled || undefined}
                data-option-index={index}
                className={`select-menu-option ${active === index ? "is-active" : ""}`}
                onPointerMove={() => {
                  if (!option.disabled) setActive(index);
                }}
                onClick={() => choose(index)}
              >
                {option.icon && (
                  <span className="select-menu-icon">{option.icon}</span>
                )}
                <span>
                  <strong>{option.label}</strong>
                  {option.description && <small>{option.description}</small>}
                </span>
                {option.value === value && <Check size={14} />}
              </div>
            ))}
          </div>,
          trigger.current?.closest("dialog[open]") || document.body,
        )}
    </>
  );
}

export default SelectMenu;
