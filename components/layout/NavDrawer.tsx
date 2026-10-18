"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { X, Sparkles } from "lucide-react";
import { visibleDrawerGroups, isActive } from "@/lib/nav/config";
import { DURATION, EASE, SPRING, fadeIn, staggerDelay } from "@/lib/motion/tokens";
import { cn } from "@/lib/utils/cn";

type Props = {
  open: boolean;
  onClose: () => void;
  /** Current route (from the parent's `usePathname`) — SSR-safe active state. */
  pathname: string;
  /**
   * True when the horizontal navbar rail is on screen (wide viewport). The
   * drawer then hides its duplicate "Navigate" group so a rail destination is
   * never shown twice at once (see `visibleDrawerGroups`).
   */
  railVisible: boolean;
  /** The element that opened the drawer — focus returns here on close. */
  triggerRef: React.RefObject<HTMLButtonElement | null>;
};

/**
 * Slide-in navigation drawer — the companion surface to the navbar rail. It is
 * available at EVERY breakpoint (the hamburger is permanently visible), so it
 * is a modal on desktop too.
 *
 * Destination set comes from the single typed config (`lib/nav/config.ts`);
 * when the navbar rail is visible the drawer drops the duplicated rail links
 * and shows only complementary categories / utilities / info.
 *
 * Accessibility:
 *   · `role="dialog"` + `aria-modal`, labelled and id-targeted by the trigger.
 *   · Escape closes; backdrop click closes; an explicit close button.
 *   · Focus moves to the close button on open and is trapped inside.
 *   · Focus is restored to the trigger on close.
 *   · Background scroll is locked while open and always released on unmount,
 *     so the page can never get stuck un-scrollable.
 *   · Motion degrades under prefers-reduced-motion via MotionProvider.
 */
export function NavDrawer({ open, onClose, pathname, railVisible, triggerRef }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const groups = visibleDrawerGroups(railVisible);

  /* Escape to close. Bound only while open. */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Move focus into the drawer on open; restore it to the trigger on close. */
  useEffect(() => {
    if (!open) return;
    const trigger = triggerRef.current;
    const raf = requestAnimationFrame(() => closeButtonRef.current?.focus());
    return () => {
      cancelAnimationFrame(raf);
      trigger?.focus();
    };
  }, [open, triggerRef]);

  /* Focus trap: Tab cycles within the panel. */
  useEffect(() => {
    if (!open) return;
    const panel = panelRef.current;
    if (!panel) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusable = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", onKeyDown);
    return () => panel.removeEventListener("keydown", onKeyDown);
  }, [open]);

  /* Background scroll lock. Compensate for the removed scrollbar so the layout
     does not jump; the cleanup always restores both values. */
  useEffect(() => {
    if (!open) return;
    const { body } = document;
    const prevOverflow = body.style.overflow;
    const prevPad = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    return () => {
      body.style.overflow = prevOverflow;
      body.style.paddingRight = prevPad;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
          id="site-nav-drawer"
        >
          {/* Backdrop — restrained fade scrim; clicking it closes. */}
          <motion.button
            variants={fadeIn}
            initial="hidden"
            animate="show"
            exit="hidden"
            transition={{ duration: DURATION.base, ease: EASE.out }}
            className="absolute inset-0 cursor-default bg-base/60 backdrop-blur-sm"
            aria-label="Close navigation menu"
            onClick={onClose}
            tabIndex={-1}
          />

          {/* Panel — slides in from the left, full viewport height, internal
              scroll for the destination list so the header/footer stay pinned. */}
          <motion.div
            ref={panelRef}
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={SPRING.panel}
            className="glass absolute inset-y-0 left-0 flex h-full w-[86vw] max-w-xs flex-col border-r border-line/70 sm:max-w-sm"
            style={{
              paddingTop: "env(safe-area-inset-top)",
              paddingBottom: "env(safe-area-inset-bottom)",
            }}
          >
            {/* Header — brand + close */}
            <div className="flex items-center justify-between gap-3 border-b border-line/60 px-4 py-3">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
                aria-label="Shirayuki — Home"
              >
                <span className="relative h-8 w-8 shrink-0">
                  <Image src="/logos/shirayuki2.png" alt="" fill sizes="32px" className="object-contain" />
                </span>
                <span className="text-title font-semibold text-snow">Shirayuki</span>
              </Link>
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className="grid size-9 place-items-center rounded-sm border border-line/70 text-muted transition-colors hover:border-frost/50 hover:text-frost focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost"
                aria-label="Close navigation menu"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* Scrollable groups */}
            <nav className="min-h-0 flex-1 overflow-y-auto px-3 py-4 scroll-frost" aria-label="Site">
              {groups.map((group, gi) => (
                <div key={group.id} className={cn(gi > 0 && "mt-5")}>
                  <p className="text-label px-3 pb-1.5 uppercase tracking-wide text-faint">
                    {group.label}
                  </p>
                  <ul className="flex flex-col gap-0.5">
                    {group.items.map((item, i) => {
                      const active = isActive(pathname, item.href);
                      const Icon = item.icon;
                      return (
                        <motion.li
                          key={item.id}
                          variants={fadeIn}
                          initial="hidden"
                          animate="show"
                          transition={{
                            duration: DURATION.fast,
                            ease: EASE.out,
                            delay: staggerDelay(gi * 3 + i, 0.025),
                          }}
                        >
                          <Link
                            href={item.href}
                            onClick={onClose}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "group flex items-center gap-3 rounded-sm px-3 py-2.5 text-meta transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-frost",
                              active
                                ? "bg-frost-soft text-frost"
                                : "text-muted hover:bg-surface-2/70 hover:text-snow",
                            )}
                          >
                            <Icon
                              className={cn(
                                "size-4 shrink-0",
                                active ? "text-frost" : "text-faint group-hover:text-frost",
                              )}
                            />
                            <span className="min-w-0 flex-1 truncate">{item.label}</span>
                            {/* Active frost dot — restrained route indicator. */}
                            <span
                              aria-hidden
                              className={cn(
                                "size-1.5 shrink-0 rounded-full bg-frost transition-opacity duration-200",
                                active ? "opacity-100" : "opacity-0",
                              )}
                            />
                          </Link>
                        </motion.li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {/* Footer hint */}
            <div className="border-t border-line/60 px-4 py-3">
              <p className="text-caption flex items-center gap-2 text-faint">
                <Sparkles className="size-3.5 text-frost/70" />
                Stream in pure focus. No ads.
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
