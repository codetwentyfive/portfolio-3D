import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import { getImpressumMissingFields, legalConfig } from "../legal/config";

const pageCopy = {
  de: {
    kicker: "Rechtliche Angaben",
    title: "Impressum",
    intro:
      "Dieses Impressum ist auf eine beruflich ausgerichtete Portfolio-Website in Deutschland zugeschnitten und orientiert sich an den typischen Angaben für § 5 DDG sowie an den im Einzelfall zusätzlich nötigen Pflichtinformationen.",
    reviewLabel: "Stand",
    missingTitle: "Vor der Veröffentlichung noch ausfüllen",
    missingIntro:
      "Die folgenden Kerndaten fehlen noch für ein belastbares Impressum. Vor dem Livegang sollten diese Angaben mit den echten Betreiberdaten ersetzt werden:",
    sections: {
      provider: "Angaben gemäß § 5 DDG",
      business: "Tätigkeitsprofil",
      register: "Registereintrag",
      vat: "Umsatzsteuer",
      supervisoryAuthority: "Aufsichtsbehörde",
      regulatedProfession: "Berufsrechtliche Angaben",
      editorialResponsibility:
        "Verantwortlich für journalistisch-redaktionelle Inhalte",
      disputeResolution: "Verbraucherstreitbeilegung",
      notes: "Weitere Hinweise",
    },
    labels: {
      name: "Name",
      address: "Anschrift",
      email: "E-Mail",
      phone: "Telefon",
      website: "Website",
      contactForm: "Kontaktformular",
      activity: "Tätigkeit",
      registerCourt: "Registergericht",
      registerNumber: "Registernummer",
      vatId: "Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG",
      economicId: "Wirtschafts-Identifikationsnummer",
      chamber: "Kammer",
      professionalTitle: "Berufsbezeichnung",
      titleGrantedIn: "Verliehen in",
      professionalRules: "Berufsrechtliche Regelungen",
    },
    contactFormCta: "Zum Kontaktformular",
    odrNotice:
      "Die frühere EU-Online-Streitbeilegungsplattform wurde durch die Verordnung (EU) 2024/3228 mit Wirkung zum 20. Juli 2025 eingestellt und wird deshalb hier nicht mehr verlinkt.",
    additionalNotice:
      "Weitere Angaben wie Handelsregister, Umsatzsteuer-ID, Aufsichtsbehörde, Kammer oder eine verantwortliche Person nach § 18 Abs. 2 MStV müssen ergänzt werden, sobald sie auf dieses Angebot zutreffen.",
    privacyNotice:
      "Neben diesem Impressum wird für Kontaktformular, Hosting, Browser-Speicher und sonstige Datenverarbeitung in der Regel auch eine separate Datenschutzerklärung benötigt.",
  },
  en: {
    kicker: "Legal information",
    title: "Impressum / Legal Notice",
    intro:
      "This legal notice is structured for a Germany-based professional portfolio website and follows the usual disclosure pattern for Section 5 DDG together with other conditional disclosures that may become necessary in individual cases.",
    reviewLabel: "Last reviewed",
    missingTitle: "Fill these details before publishing",
    missingIntro:
      "The following core data is still missing for a reliable legal notice. Replace these placeholders with the real operator details before going live:",
    sections: {
      provider: "Provider information under Section 5 DDG",
      business: "Business profile",
      register: "Commercial register",
      vat: "VAT information",
      supervisoryAuthority: "Supervisory authority",
      regulatedProfession: "Professional regulation",
      editorialResponsibility: "Responsible for editorial content",
      disputeResolution: "Consumer dispute resolution",
      notes: "Additional notes",
    },
    labels: {
      name: "Name",
      address: "Address",
      email: "Email",
      phone: "Phone",
      website: "Website",
      contactForm: "Contact form",
      activity: "Activity",
      registerCourt: "Register court",
      registerNumber: "Register number",
      vatId: "VAT ID according to Section 27a German VAT Act",
      economicId: "Economic identification number",
      chamber: "Professional chamber",
      professionalTitle: "Professional title",
      titleGrantedIn: "Granted in",
      professionalRules: "Professional rules",
    },
    contactFormCta: "Open contact form",
    odrNotice:
      "The former EU online dispute resolution platform was discontinued with effect from July 20, 2025 by Regulation (EU) 2024/3228, so it is intentionally not linked here.",
    additionalNotice:
      "Further disclosures such as a commercial register entry, VAT ID, supervisory authority, chamber details, or an editorially responsible person under Section 18(2) MStV must be added as soon as they apply to this website.",
    privacyNotice:
      "Separate privacy information is typically still required for the contact form, hosting, browser storage, and any other personal-data processing.",
  },
};

const formatReviewDate = (lang) =>
  new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-US", {
    dateStyle: "long",
  }).format(new Date(legalConfig.lastReviewed));

const getText = (value, lang) => {
  if (!value) return "";
  if (typeof value === "string") return value;

  return value[lang] || value.en || "";
};

const renderAddressLines = (...lines) =>
  lines.filter(Boolean).map((line) => (
    <span className="block" key={line}>
      {line}
    </span>
  ));

const InfoRow = ({ label, children }) => (
  <div className="grid gap-2 border-t border-slate-200 py-4 first:border-t-0 first:pt-0 md:grid-cols-[220px,1fr]">
    <dt className="font-semibold text-slate-900">{label}</dt>
    <dd className="text-slate-600">{children}</dd>
  </div>
);

const SectionCard = ({ title, children, isDefinitionList = true }) => (
  <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
    <div className="mt-5">{isDefinitionList ? <dl>{children}</dl> : children}</div>
  </article>
);

const Impressum = ({ embedded = false }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "de";
  const copy = pageCopy[lang];
  const missingFields = getImpressumMissingFields();
  const HeadingTag = embedded ? "h2" : "h1";

  const postalCodeAndCity = [legalConfig.operator.postalCode, legalConfig.operator.city]
    .filter(Boolean)
    .join(" ");

  const registerEntry = legalConfig.registerEntry.isApplicable;
  const vat = legalConfig.vat.isApplicable;
  const supervisoryAuthority = legalConfig.supervisoryAuthority.isApplicable;
  const regulatedProfession = legalConfig.regulatedProfession.isApplicable;
  const editorialResponsibility = legalConfig.editorialResponsibility.isApplicable;

  return (
    <section className={embedded ? "scroll-mt-32" : "max-container"} id={embedded ? "impressum" : undefined}>
      {!embedded ? <SEO page="impressum" /> : null}

      <div className="max-w-4xl">
        {!embedded ? (
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">
            {copy.kicker}
          </p>
        ) : null}
        <HeadingTag className="mt-3 head-text">{copy.title}</HeadingTag>
        <p className="mt-5 text-base leading-7 text-slate-600">{copy.intro}</p>
        {!embedded ? (
          <p className="mt-4 text-sm text-slate-500">
            {copy.reviewLabel}: {formatReviewDate(lang)}
          </p>
        ) : null}
      </div>

      {missingFields.length > 0 ? (
        <div className="mt-8 rounded-3xl border border-amber-200 bg-amber-50 p-6 text-slate-700 shadow-sm">
          <h2 className="text-xl font-semibold text-amber-900">
            {copy.missingTitle}
          </h2>
          <p className="mt-3 leading-7">{copy.missingIntro}</p>
          <ul className="mt-4 list-disc space-y-2 pl-5">
            {missingFields.map(({ label }) => (
              <li key={label.en}>{label[lang]}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="mt-10 grid gap-6">
        <SectionCard title={copy.sections.provider}>
          <InfoRow label={copy.labels.name}>
            {legalConfig.operator.legalName || legalConfig.operator.name}
          </InfoRow>
          <InfoRow label={copy.labels.address}>
            <address className="not-italic">
              {renderAddressLines(
                legalConfig.operator.streetAddress,
                postalCodeAndCity,
                legalConfig.operator.country
              )}
            </address>
          </InfoRow>
          <InfoRow label={copy.labels.email}>
            <a
              className="text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
              href={`mailto:${legalConfig.operator.email}`}
            >
              {legalConfig.operator.email}
            </a>
          </InfoRow>
          {legalConfig.operator.phone ? (
            <InfoRow label={copy.labels.phone}>
              <a
                className="text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                href={`tel:${legalConfig.operator.phone}`}
              >
                {legalConfig.operator.phone}
              </a>
            </InfoRow>
          ) : null}
          <InfoRow label={copy.labels.website}>
            <a
              className="text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
              href={legalConfig.operator.website}
              rel="noreferrer"
              target="_blank"
            >
              {legalConfig.operator.website}
            </a>
          </InfoRow>
          <InfoRow label={copy.labels.contactForm}>
            <Link
              className="text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
              to={legalConfig.operator.contactPagePath}
            >
              {copy.contactFormCta}
            </Link>
          </InfoRow>
        </SectionCard>

        <SectionCard title={copy.sections.business}>
          <InfoRow label={copy.labels.activity}>
            {getText(legalConfig.operator.businessDescription, lang)}
          </InfoRow>
        </SectionCard>

        {registerEntry ? (
          <SectionCard title={copy.sections.register}>
            <InfoRow label={copy.labels.registerCourt}>
              {legalConfig.registerEntry.court}
            </InfoRow>
            <InfoRow label={copy.labels.registerNumber}>
              {legalConfig.registerEntry.number}
            </InfoRow>
          </SectionCard>
        ) : null}

        {vat ? (
          <SectionCard title={copy.sections.vat}>
            {legalConfig.vat.vatId ? (
              <InfoRow label={copy.labels.vatId}>{legalConfig.vat.vatId}</InfoRow>
            ) : null}
            {legalConfig.vat.economicId ? (
              <InfoRow label={copy.labels.economicId}>
                {legalConfig.vat.economicId}
              </InfoRow>
            ) : null}
          </SectionCard>
        ) : null}

        {supervisoryAuthority ? (
          <SectionCard title={copy.sections.supervisoryAuthority}>
            <InfoRow label={copy.sections.supervisoryAuthority}>
              <div>
                {renderAddressLines(
                  legalConfig.supervisoryAuthority.name,
                  ...legalConfig.supervisoryAuthority.addressLines
                )}
                {legalConfig.supervisoryAuthority.website ? (
                  <a
                    className="mt-2 inline-block text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                    href={legalConfig.supervisoryAuthority.website}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {legalConfig.supervisoryAuthority.website}
                  </a>
                ) : null}
              </div>
            </InfoRow>
          </SectionCard>
        ) : null}

        {regulatedProfession ? (
          <SectionCard title={copy.sections.regulatedProfession}>
            <InfoRow label={copy.labels.chamber}>
              {legalConfig.regulatedProfession.chamber}
            </InfoRow>
            <InfoRow label={copy.labels.professionalTitle}>
              {legalConfig.regulatedProfession.professionalTitle}
            </InfoRow>
            <InfoRow label={copy.labels.titleGrantedIn}>
              {legalConfig.regulatedProfession.titleGrantedIn}
            </InfoRow>
            {legalConfig.regulatedProfession.professionalRules.length ? (
              <InfoRow label={copy.labels.professionalRules}>
                <ul className="list-disc space-y-2 pl-5">
                  {legalConfig.regulatedProfession.professionalRules.map((rule) => (
                    <li key={rule}>{rule}</li>
                  ))}
                </ul>
                {legalConfig.regulatedProfession.rulesLink ? (
                  <a
                    className="mt-2 inline-block text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                    href={legalConfig.regulatedProfession.rulesLink}
                    rel="noreferrer"
                    target="_blank"
                  >
                    {legalConfig.regulatedProfession.rulesLink}
                  </a>
                ) : null}
              </InfoRow>
            ) : null}
          </SectionCard>
        ) : null}

        {editorialResponsibility ? (
          <SectionCard title={copy.sections.editorialResponsibility}>
            <InfoRow label={copy.labels.name}>
              {legalConfig.editorialResponsibility.name}
            </InfoRow>
            <InfoRow label={copy.labels.address}>
              <address className="not-italic">
                {renderAddressLines(
                  ...legalConfig.editorialResponsibility.addressLines
                )}
              </address>
            </InfoRow>
          </SectionCard>
        ) : null}

        <SectionCard title={copy.sections.disputeResolution} isDefinitionList={false}>
          <p className="leading-7 text-slate-600">
            {getText(legalConfig.consumerDisputeResolution.statement, lang)}
          </p>
          <p className="mt-4 text-sm leading-6 text-slate-500">
            {copy.odrNotice}
          </p>
        </SectionCard>

        <SectionCard title={copy.sections.notes} isDefinitionList={false}>
          <p className="leading-7 text-slate-600">{copy.additionalNotice}</p>
          <p className="mt-4 leading-7 text-slate-600">{copy.privacyNotice}</p>
        </SectionCard>
      </div>
    </section>
  );
};

export default Impressum;
