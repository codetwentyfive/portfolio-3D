"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/src/i18n/navigation";
import LanguageSwitcher from "./LanguageSwitcher";

const navItems = [
  { href: "/about", key: "about" },
  { href: "/projects", key: "projects" },
  { href: "/services", key: "services" },
  { href: "/blog", key: "blog" },
  { href: "/contact", key: "contact" },
] as const;

export default function Navbar() {
  const t = useTranslations();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (
        event.target instanceof Node &&
        !header.current?.contains(event.target)
      )
        setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        toggle.current?.focus();
      }
    };
    document.addEventListener("pointerdown", dismiss);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", dismiss);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  return (
    <header ref={header} className="site-header" data-open={open}>
      <Link
        href="/"
        className="editorial-wordmark"
        aria-label={t("navigation.home")}
      >
        <span aria-hidden="true">
          <span className="wordmark-condensed">c</span>
          <b>h</b>
          <span className="wordmark-condensed">i</span>
          <span className="wordmark-long">ngis</span>
          <span className="wordmark-slash">/</span>
        </span>
      </Link>
      <button
        ref={toggle}
        type="button"
        className="menu-toggle refractive-glass"
        aria-expanded={open}
        aria-controls="editorial-navigation"
        aria-label={t(open ? "navigation.close" : "navigation.open")}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
      </button>
      <nav
        id="editorial-navigation"
        className="editorial-navigation refractive-glass"
        aria-label={t("navigation.main")}
      >
        {navItems.map(({ href, key }, index) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          const label = t(key);
          return (
            <Link
              key={key}
              href={href}
              className={`editorial-tab editorial-tab-${index}`}
              aria-label={label}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <span className="tab-initial" aria-hidden="true">
                {label.slice(0, 1)}
              </span>
              <span className="tab-rest" aria-hidden="true">
                <span>{label.slice(1)}</span>
              </span>
              <span className="tab-marker" aria-hidden="true" />
            </Link>
          );
        })}
        <LanguageSwitcher />
      </nav>
    </header>
  );
}
