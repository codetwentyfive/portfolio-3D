import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SEO from "../components/SEO";
import { legalConfig } from "../legal/config";

const pageCopy = {
  de: {
    kicker: "Datenschutz",
    title: "Datenschutzerklärung",
    intro:
      "Diese Datenschutzerklärung gilt für diese Website unter " +
      legalConfig.operator.website +
      ". Sie ist auf die aktuell eingesetzte technische Konfiguration zugeschnitten: Hosting über Vercel, keine eingebundene Web-Analytics, Speicherung der Sprachwahl im Local Storage und eine freiwillige Kontaktaufnahme über das Formular mit EmailJS.",
    updatedLabel: "Stand",
    sections: {
      controller: "Verantwortlicher",
      hosting: "Hosting über Vercel",
      cookies: "Cookies, Local Storage und Einwilligungen",
      soundcloud: "Audio-Player über SoundCloud",
      language: "Sprachspeicher im Browser",
      contact: "Kontaktformular mit EmailJS",
      retention: "Speicherdauer",
      rights: "Ihre Rechte",
    },
    labels: {
      name: "Name",
      website: "Website",
      email: "E-Mail",
      address: "Anschrift",
      provider: "Anbieter",
      purpose: "Zweck",
      data: "Verarbeitete Daten",
      legalBasis: "Rechtsgrundlage",
      recipients: "Empfänger",
      storagePeriod: "Speicherdauer",
      note: "Hinweis",
    },
    controllerAddressNote:
      "Die vollständige Anbieteranschrift finden Sie im Impressum.",
    hostingPurpose:
      "Bereitstellung der Website, Auslieferung von Inhalten sowie Aufrechterhaltung von Stabilität und Sicherheit.",
    hostingData:
      "Beim Aufruf der Website können technisch erforderliche Verbindungs- und Request-Metadaten verarbeitet werden, etwa IP-Adresse, aufgerufene URL, Datum und Uhrzeit, Referrer sowie Angaben zum Browser und Betriebssystem.",
    hostingBasis:
      "Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in einem sicheren und funktionsfähigen Betrieb der Website.",
    hostingRecipients:
      "Vercel Inc. als Hosting- und Delivery-Anbieter. Weitere Informationen: Vercel Privacy Policy.",
    cookieNote:
      "Diese Website lädt derzeit keine Analyse-, Marketing- oder sonstigen nicht erforderlichen Drittinhalte automatisch beim Seitenaufruf. Der optionale SoundCloud-Audio-Player bleibt standardmäßig blockiert und wird erst nach Ihrer ausdrücklichen Auswahl geladen. Daher wird derzeit kein allgemeines Cookie-Banner eingesetzt.",
    soundcloudPurpose:
      "Bereitstellung des optionalen Audio-Players und Wiedergabe der von Ihnen ausgewählten SoundCloud-Inhalte.",
    soundcloudData:
      "Erst nach Ihrer aktiven Freigabe wird eine Verbindung zu SoundCloud aufgebaut. Dabei können insbesondere Ihre IP-Adresse, Browser- und Geräteinformationen, Referrer-Daten, Nutzungsdaten sowie von SoundCloud gesetzte Cookies oder ähnliche Kennungen verarbeitet werden.",
    soundcloudBasis:
      "Art. 6 Abs. 1 lit. a DSGVO sowie § 25 Abs. 1 TDDDG. Die Einbindung erfolgt erst nach Ihrer ausdrücklichen Einwilligung durch Klick auf die Aktivierungsfläche im Player.",
    soundcloudRecipients:
      "SoundCloud Global Limited & Co. KG bzw. verbundene SoundCloud-Unternehmen als Anbieter des Audio-Dienstes.",
    soundcloudTransfer:
      "Je nach technischer Ausgestaltung kann dabei auch eine Übermittlung personenbezogener Daten in Drittländer, insbesondere in die USA, nicht ausgeschlossen werden. Maßgeblich sind die Datenschutzinformationen von SoundCloud.",
    languagePurpose:
      "Speicherung der von Ihnen gewählten Sprache, damit die Seite bei späteren Besuchen direkt in der gewünschten Sprache angezeigt werden kann.",
    languageData:
      "Im Browser wird ausschließlich der Eintrag `language` im Local Storage gespeichert.",
    languageBasis:
      "§ 25 Abs. 2 TDDDG sowie Art. 6 Abs. 1 lit. f DSGVO.",
    languageRecipients:
      "Keine Weitergabe an Dritte durch diesen Speichervorgang.",
    languageStorage:
      "Bis Sie den Eintrag im Browser löschen, die Sprache ändern oder den Browser-Speicher zurücksetzen.",
    contactPurpose:
      "Bearbeitung und Beantwortung Ihrer Anfrage.",
    contactData:
      "Die von Ihnen eingegebenen Angaben aus dem Formular, insbesondere Name, E-Mail-Adresse und Nachricht.",
    contactBasis:
      "Art. 6 Abs. 1 lit. b DSGVO, soweit Ihre Anfrage auf eine vorvertragliche Kommunikation gerichtet ist, im Übrigen Art. 6 Abs. 1 lit. f DSGVO.",
    contactRecipients:
      "EmailJS Pte. Ltd. für die technische Übermittlung der Formularnachricht sowie der von Ihnen gewählte E-Mail-Dienst auf Empfängerseite.",
    contactTransfer:
      "Nach der aktuellen EmailJS Privacy Policy werden Daten auf Servern in den USA verarbeitet; für Übermittlungen aus Europa verweist EmailJS auf Angemessenheitsbeschlüsse oder Standardvertragsklauseln.",
    retentionText:
      "Local-Storage-Daten zur Sprache bleiben gespeichert, bis Sie sie selbst löschen oder ändern. Nachrichten aus dem Kontaktformular werden nur so lange aufbewahrt, wie dies für die Bearbeitung der Anfrage erforderlich ist und keine gesetzlichen Aufbewahrungspflichten oder berechtigten Interessen entgegenstehen.",
    rightsText:
      "Sie haben nach Maßgabe der DSGVO insbesondere das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung, Datenübertragbarkeit sowie Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen. Sofern eine Verarbeitung auf Ihrer Einwilligung beruhen sollte, können Sie diese jederzeit mit Wirkung für die Zukunft widerrufen. Zudem haben Sie das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.",
    impressumLink: "Zum Impressum",
    vercelLink: "Vercel Privacy Policy",
    emailjsLink: "EmailJS Privacy Policy",
    soundcloudLink: "SoundCloud Privacy Policy",
  },
  en: {
    kicker: "Privacy",
    title: "Privacy Policy",
    intro:
      "This privacy policy applies to this website at " +
      legalConfig.operator.website +
      ". It is tailored to the site's current setup: hosting on Vercel, no embedded web analytics, storage of the language preference in local storage, and an optional contact form powered by EmailJS.",
    updatedLabel: "Last reviewed",
    sections: {
      controller: "Controller",
      hosting: "Hosting via Vercel",
      cookies: "Cookies, local storage, and consent",
      soundcloud: "Audio player via SoundCloud",
      language: "Language preference in the browser",
      contact: "Contact form via EmailJS",
      retention: "Storage duration",
      rights: "Your rights",
    },
    labels: {
      name: "Name",
      website: "Website",
      email: "Email",
      address: "Address",
      provider: "Provider",
      purpose: "Purpose",
      data: "Processed data",
      legalBasis: "Legal basis",
      recipients: "Recipients",
      storagePeriod: "Storage period",
      note: "Note",
    },
    controllerAddressNote:
      "The full provider address is listed in the Impressum.",
    hostingPurpose:
      "Providing the website, delivering content, and maintaining stability and security.",
    hostingData:
      "When the website is accessed, technically necessary connection and request metadata may be processed, such as IP address, requested URL, date and time, referrer, and information about browser and operating system.",
    hostingBasis:
      "Art. 6(1)(f) GDPR. Our legitimate interest is the secure and reliable operation of the website.",
    hostingRecipients:
      "Vercel Inc. as hosting and delivery provider. Further information is available in the Vercel Privacy Policy.",
    cookieNote:
      "This website currently does not automatically load analytics, marketing, or other non-essential third-party content when the page opens. The optional SoundCloud audio player stays blocked by default and is loaded only after your explicit choice. For that reason, the site currently does not use a general cookie banner.",
    soundcloudPurpose:
      "Providing the optional audio player and playing the SoundCloud content you choose.",
    soundcloudData:
      "Only after your active approval is a connection to SoundCloud established. In that process, SoundCloud may process in particular your IP address, browser and device information, referrer data, usage data, and cookies or similar identifiers set by SoundCloud.",
    soundcloudBasis:
      "Art. 6(1)(a) GDPR and Section 25 para. 1 TDDDG. The integration is activated only after your explicit consent by clicking the enable control in the player.",
    soundcloudRecipients:
      "SoundCloud Global Limited & Co. KG and affiliated SoundCloud companies as the provider of the audio service.",
    soundcloudTransfer:
      "Depending on the technical setup, transfers of personal data to third countries, in particular the United States, cannot be ruled out. The controlling details are set out in SoundCloud's privacy information.",
    languagePurpose:
      "Saving your chosen language so the website can be shown in that language on later visits.",
    languageData:
      "Only the `language` entry is stored in the browser's local storage.",
    languageBasis:
      "Section 25 para. 2 TDDDG and Art. 6(1)(f) GDPR.",
    languageRecipients:
      "No third-party disclosure takes place through this storage action itself.",
    languageStorage:
      "Until you delete the browser entry, change the language, or reset browser storage.",
    contactPurpose:
      "Handling and responding to your inquiry.",
    contactData:
      "The information you enter into the form, especially name, email address, and message.",
    contactBasis:
      "Art. 6(1)(b) GDPR where your request concerns pre-contractual communication; otherwise Art. 6(1)(f) GDPR.",
    contactRecipients:
      "EmailJS Pte. Ltd. for the technical transmission of the form message and the email provider used on the recipient side.",
    contactTransfer:
      "According to the current EmailJS Privacy Policy, data is processed on servers in the United States; for transfers from Europe, EmailJS refers to adequacy decisions or Standard Contractual Clauses.",
    retentionText:
      "Language local-storage data remains until you delete or change it yourself. Contact-form messages are retained only as long as needed to handle the request unless statutory retention duties or overriding legitimate interests require longer storage.",
    rightsText:
      "Under the GDPR, you generally have the right to access, rectification, erasure, restriction of processing, data portability, and objection to processing based on legitimate interests. If processing is based on consent, you may withdraw that consent at any time for the future. You also have the right to lodge a complaint with a supervisory authority.",
    impressumLink: "Open Impressum",
    vercelLink: "Vercel Privacy Policy",
    emailjsLink: "EmailJS Privacy Policy",
    soundcloudLink: "SoundCloud Privacy Policy",
  },
};

const formatReviewDate = (lang) =>
  new Intl.DateTimeFormat(lang === "de" ? "de-DE" : "en-US", {
    dateStyle: "long",
  }).format(new Date(legalConfig.lastReviewed));

const SectionCard = ({ title, children }) => (
  <article className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur">
    <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
    <div className="mt-5">{children}</div>
  </article>
);

const InfoRow = ({ label, children }) => (
  <div className="grid gap-2 border-t border-slate-200 py-4 first:border-t-0 first:pt-0 md:grid-cols-[220px,1fr]">
    <dt className="font-semibold text-slate-900">{label}</dt>
    <dd className="text-slate-600">{children}</dd>
  </div>
);

const Privacy = ({ embedded = false, impressumHref = "/impressum" }) => {
  const { i18n } = useTranslation();
  const lang = i18n.language === "en" ? "en" : "de";
  const copy = pageCopy[lang];
  const HeadingTag = embedded ? "h2" : "h1";

  return (
    <section className={embedded ? "scroll-mt-32" : "max-container"} id={embedded ? "datenschutz" : undefined}>
      {!embedded ? <SEO page="privacy" /> : null}

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
            {copy.updatedLabel}: {formatReviewDate(lang)}
          </p>
        ) : null}
      </div>

      <div className="mt-10 grid gap-6">
        <SectionCard title={copy.sections.controller}>
          <dl>
            <InfoRow label={copy.labels.name}>{legalConfig.operator.legalName}</InfoRow>
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
            <InfoRow label={copy.labels.email}>
              <a
                className="text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                href={`mailto:${legalConfig.operator.email}`}
              >
                {legalConfig.operator.email}
              </a>
            </InfoRow>
            <InfoRow label={copy.labels.address}>
              <div>
                <p>{copy.controllerAddressNote}</p>
                <Link
                  className="mt-2 inline-block text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                  to={impressumHref}
                >
                  {copy.impressumLink}
                </Link>
              </div>
            </InfoRow>
          </dl>
        </SectionCard>

        <SectionCard title={copy.sections.hosting}>
          <dl>
            <InfoRow label={copy.labels.provider}>Vercel Inc.</InfoRow>
            <InfoRow label={copy.labels.purpose}>{copy.hostingPurpose}</InfoRow>
            <InfoRow label={copy.labels.data}>{copy.hostingData}</InfoRow>
            <InfoRow label={copy.labels.legalBasis}>{copy.hostingBasis}</InfoRow>
            <InfoRow label={copy.labels.recipients}>
              <div>
                <p>{copy.hostingRecipients}</p>
                <a
                  className="mt-2 inline-block text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                  href="https://vercel.com/legal/privacy-policy"
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.vercelLink}
                </a>
              </div>
            </InfoRow>
          </dl>
        </SectionCard>

        <SectionCard title={copy.sections.cookies}>
          <dl>
            <InfoRow label={copy.labels.note}>{copy.cookieNote}</InfoRow>
          </dl>
        </SectionCard>

        <SectionCard title={copy.sections.soundcloud}>
          <dl>
            <InfoRow label={copy.labels.provider}>SoundCloud</InfoRow>
            <InfoRow label={copy.labels.purpose}>{copy.soundcloudPurpose}</InfoRow>
            <InfoRow label={copy.labels.data}>{copy.soundcloudData}</InfoRow>
            <InfoRow label={copy.labels.legalBasis}>{copy.soundcloudBasis}</InfoRow>
            <InfoRow label={copy.labels.recipients}>
              <div>
                <p>{copy.soundcloudRecipients}</p>
                <p className="mt-2">{copy.soundcloudTransfer}</p>
                <a
                  className="mt-2 inline-block text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                  href="https://soundcloud.com/pages/privacy"
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.soundcloudLink}
                </a>
              </div>
            </InfoRow>
          </dl>
        </SectionCard>

        <SectionCard title={copy.sections.language}>
          <dl>
            <InfoRow label={copy.labels.purpose}>{copy.languagePurpose}</InfoRow>
            <InfoRow label={copy.labels.data}>{copy.languageData}</InfoRow>
            <InfoRow label={copy.labels.legalBasis}>{copy.languageBasis}</InfoRow>
            <InfoRow label={copy.labels.recipients}>
              {copy.languageRecipients}
            </InfoRow>
            <InfoRow label={copy.labels.storagePeriod}>
              {copy.languageStorage}
            </InfoRow>
          </dl>
        </SectionCard>

        <SectionCard title={copy.sections.contact}>
          <dl>
            <InfoRow label={copy.labels.provider}>EmailJS Pte. Ltd.</InfoRow>
            <InfoRow label={copy.labels.purpose}>{copy.contactPurpose}</InfoRow>
            <InfoRow label={copy.labels.data}>{copy.contactData}</InfoRow>
            <InfoRow label={copy.labels.legalBasis}>{copy.contactBasis}</InfoRow>
            <InfoRow label={copy.labels.recipients}>
              <div>
                <p>{copy.contactRecipients}</p>
                <p className="mt-2">{copy.contactTransfer}</p>
                <a
                  className="mt-2 inline-block text-sky-700 underline decoration-slate-300 underline-offset-4 transition-colors hover:text-sky-900"
                  href="https://www.emailjs.com/legal/privacy-policy/"
                  rel="noreferrer"
                  target="_blank"
                >
                  {copy.emailjsLink}
                </a>
              </div>
            </InfoRow>
          </dl>
        </SectionCard>

        <SectionCard title={copy.sections.retention}>
          <p className="leading-7 text-slate-600">{copy.retentionText}</p>
        </SectionCard>

        <SectionCard title={copy.sections.rights}>
          <p className="leading-7 text-slate-600">{copy.rightsText}</p>
        </SectionCard>
      </div>
    </section>
  );
};

export default Privacy;
