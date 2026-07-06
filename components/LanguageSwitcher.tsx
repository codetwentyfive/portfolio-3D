"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/src/i18n/navigation";
import type { Locale } from "@/src/i18n/routing";

const languageFlags: Record<Locale, JSX.Element> = {
  de: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 rounded-full" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#ffce00" />
      <path d="M0 0h24v8H0z" fill="#000" />
      <path d="M0 8h24v8H0z" fill="#dd0000" />
    </svg>
  ),
  en: (
    <svg viewBox="0 0 24 24" className="h-5 w-5 rounded-full" aria-hidden="true">
      <defs>
        <clipPath id="language-switcher-uk-flag">
          <circle cx="12" cy="12" r="12" />
        </clipPath>
      </defs>
      <g clipPath="url(#language-switcher-uk-flag)">
        <rect width="24" height="24" fill="#012169" />
        <path d="M0 0l24 24M24 0L0 24" stroke="#fff" strokeWidth="6" />
        <path d="M0 0l24 24M24 0L0 24" stroke="#c8102e" strokeWidth="3" />
        <path d="M12 0v24M0 12h24" stroke="#fff" strokeWidth="8" />
        <path d="M12 0v24M0 12h24" stroke="#c8102e" strokeWidth="4" />
      </g>
    </svg>
  ),
};

const languageLabels: Record<Locale, string> = {
  de: "German",
  en: "English",
};

function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();

  const nextLanguage: Locale = locale === "en" ? "de" : "en";

  const toggleLanguage = () => {
    // Re-render the current path under the other locale; the middleware
    // persists the choice in the NEXT_LOCALE cookie.
    router.replace(pathname, { locale: nextLanguage });
  };

  return (
    <div className="relative inline-block mx-2">
      <button
        type="button"
        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-white shadow-md"
        onClick={toggleLanguage}
        aria-label={`Current language: ${languageLabels[locale]}. Switch to ${languageLabels[nextLanguage]}.`}
      >
        {languageFlags[locale]}
      </button>
    </div>
  );
}

export default LanguageSwitcher;
