"use client";

import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/src/i18n/navigation";
import { planets } from "./planet-data";
import { ControlGlyph } from "./WorldGlyph";
import MobileWorldPager from "./MobileWorldPager";

export default function MobileWorldHUD({ selected, onSelect, busy }: {
  selected: number;
  onSelect: (index: number) => void;
  busy: boolean;
}) {
  const t = useTranslations("worlds");
  const a = useTranslations("archive");
  const locale = useLocale() === "de" ? "de" : "en";
  const planet = planets[selected];
  const external = Boolean(planet.link && planet.kind !== "portfolio");
  const visitLabel = `${external ? a("open") : t("details")}: ${planet.name[locale]}`;
  return (
    <div className="studio-mobile-hud">
      <div className="studio-mobile-actions">
        {planet.link && planet.kind !== "portfolio" ? (
          <a
            href={planet.link}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-mobile-open"
            aria-label={visitLabel}
          >
            <span>{a("open")}</span>
            <ControlGlyph name="enter" />
          </a>
        ) : (
          <Link
            href={planet.kind === "portfolio" ? "/about" : "/projects"}
            className="studio-mobile-open"
            aria-label={visitLabel}
          >
            <span>{t("details")}</span>
            <ControlGlyph name="enter" />
          </Link>
        )}
      </div>
      <MobileWorldPager selected={selected} onSelect={onSelect} busy={busy} />
    </div>
  );
}
