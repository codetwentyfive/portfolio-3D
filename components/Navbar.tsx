"use client";

import { useState } from "react";
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

const Navbar = () => {
  const t = useTranslations();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  return (
    <header className="header flex justify-between items-center p-4 z-50" role="banner">
      <Link
        href="/"
        className="w-10 h-10 rounded-lg bg-white items-center justify-center flex font-bold shadow-md"
        aria-label="Home"
      >
        <p className="gradient_text font-poppins text-sm tracking-[-0.05em]">Chi</p>
      </Link>
      <button
        className="md:hidden bg-white p-2 rounded-lg w-10 h-10 z-50 flex items-center justify-center"
        onClick={toggleMenu}
        aria-label="Toggle navigation menu"
        aria-expanded={isMenuOpen}
      >
        <span className="gradient_text font-bold">
          {isMenuOpen ? "✕" : "☰"}
        </span>
      </button>
      <nav
        className={`${isMenuOpen ? "flex" : "hidden"} md:flex flex-col md:flex-row text-lg gap-4 md:gap-7 absolute md:relative top-16 md:top-0 right-4 md:right-0 bg-white md:bg-transparent p-4 md:p-0 rounded-lg shadow-md md:shadow-none z-50`}
        role="navigation"
        aria-label="Main navigation"
      >
        {navItems.map(({ href, key }) => (
          <Link
            key={key}
            href={href}
            className={isActive(href) ? "nav-link gradient_text" : "nav-link"}
            onClick={() => setIsMenuOpen(false)}
            aria-label={t(key)}
          >
            {t(key)}
          </Link>
        ))}
        <LanguageSwitcher />
      </nav>
    </header>
  );
};

export default Navbar;
