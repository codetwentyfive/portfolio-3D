const TODO_PREFIX = "TODO:";

const createTodo = (label: string): string => `${TODO_PREFIX} ${label}`;

export type LegalLocale = "de" | "en";

export type LocalizedLegalText = Record<LegalLocale, string>;

export interface LegalOperator {
  name: string;
  legalName: string;
  businessDescription: LocalizedLegalText;
  streetAddress: string;
  postalCode: string;
  city: string;
  country: string;
  email: string;
  phone: string;
  website: string;
  contactPagePath: string;
}

export interface RegisterEntry {
  isApplicable: boolean;
  court: string;
  number: string;
}

export interface VatInfo {
  isApplicable: boolean;
  vatId: string;
  economicId: string;
}

export interface SupervisoryAuthority {
  isApplicable: boolean;
  name: string;
  addressLines: string[];
  website: string;
}

export interface RegulatedProfession {
  isApplicable: boolean;
  chamber: string;
  professionalTitle: string;
  titleGrantedIn: string;
  professionalRules: string[];
  rulesLink: string;
}

export interface EditorialResponsibility {
  isApplicable: boolean;
  name: string;
  addressLines: string[];
}

export interface ConsumerDisputeResolution {
  statement: LocalizedLegalText;
  odrPlatformDiscontinuedOn: string;
}

export interface LegalConfig {
  lastReviewed: string;
  operator: LegalOperator;
  registerEntry: RegisterEntry;
  vat: VatInfo;
  supervisoryAuthority: SupervisoryAuthority;
  regulatedProfession: RegulatedProfession;
  editorialResponsibility: EditorialResponsibility;
  consumerDisputeResolution: ConsumerDisputeResolution;
}

export const legalConfig: LegalConfig = {
  lastReviewed: "2026-03-28",
  operator: {
    name: "Chingis Zwecker",
    legalName: "Chingis B. Zwecker E.",
    businessDescription: {
      de: "Beruflich ausgerichtete Portfolio- und Geschäftswebsite für Freelance-Softwareentwicklung, IT-Architektur und KI-Beratung.",
      en: "Professional portfolio and business website for freelance software engineering, IT architecture, and AI consulting.",
    },
    streetAddress: "Am Hagsfelder Brunnen 26",
    postalCode: "76139",
    city: "Karlsruhe",
    country: "Germany",
    email: "hello@chingis.dev",
    phone: "+49 15679 798849",
    website: "https://chingis.dev",
    contactPagePath: "/contact",
  },
  registerEntry: {
    isApplicable: false,
    court: "",
    number: "",
  },
  vat: {
    isApplicable: false,
    vatId: "",
    economicId: "",
  },
  supervisoryAuthority: {
    isApplicable: false,
    name: "",
    addressLines: [],
    website: "",
  },
  regulatedProfession: {
    isApplicable: false,
    chamber: "",
    professionalTitle: "",
    titleGrantedIn: "",
    professionalRules: [],
    rulesLink: "",
  },
  editorialResponsibility: {
    isApplicable: false,
    name: "",
    addressLines: [],
  },
  consumerDisputeResolution: {
    statement: {
      de: "Ich bin weder verpflichtet noch bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.",
      en: "I am neither obliged nor willing to participate in dispute resolution proceedings before a consumer arbitration board.",
    },
    odrPlatformDiscontinuedOn: "2025-07-20",
  },
};

export const hasPlaceholder = (value: unknown): boolean =>
  typeof value === "string" && value.trim().startsWith(TODO_PREFIX);

export interface ImpressumFieldCheck {
  label: LocalizedLegalText;
  value: string;
}

export const getImpressumMissingFields = (): ImpressumFieldCheck[] => {
  const checks: ImpressumFieldCheck[] = [
    {
      label: {
        de: "Straße und Hausnummer",
        en: "Street and house number",
      },
      value: legalConfig.operator.streetAddress,
    },
    {
      label: {
        de: "Postleitzahl",
        en: "Postal code",
      },
      value: legalConfig.operator.postalCode,
    },
  ];

  return checks.filter(({ value }) => !value || hasPlaceholder(value));
};
