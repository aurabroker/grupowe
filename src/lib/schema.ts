/** Generatory JSON-LD (schema.org). Jedno miejsce – spójne dane na wszystkich stronach. */
import { SITE, COMPANY, SERVICES, type Service } from '../data/site';

export const ORG_ID = `${SITE.url}/#organization`;
export const WEBSITE_ID = `${SITE.url}/#website`;

export function organization() {
  return {
    '@type': ['InsuranceAgency', 'Organization'],
    '@id': ORG_ID,
    name: COMPANY.shortName,
    legalName: COMPANY.legalName,
    alternateName: 'grupowe.pro',
    url: SITE.url,
    logo: `${SITE.url}/logo.svg`,
    image: `${SITE.url}${SITE.ogImage}`,
    description: SITE.description,
    telephone: SITE.phone,
    email: SITE.email,
    foundingDate: String(COMPANY.foundingYear),
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.street,
      postalCode: COMPANY.postalCode,
      addressLocality: COMPANY.city,
      addressCountry: COMPANY.country,
    },
    areaServed: { '@type': 'Country', name: 'Polska' },
    sameAs: [SITE.instagram, COMPANY.website],
    identifier: [
      { '@type': 'PropertyValue', propertyID: 'KRS', value: COMPANY.krs },
      { '@type': 'PropertyValue', propertyID: 'REGON', value: COMPANY.regon },
      { '@type': 'PropertyValue', propertyID: 'Zezwolenie KNF', value: COMPANY.knfPermit },
      { '@type': 'PropertyValue', propertyID: 'Rejestr brokerów ubezpieczeniowych', value: COMPANY.brokerRegister },
    ],
    knowsAbout: ['ubezpieczenia grupowe', 'pakiety medyczne dla pracowników', 'ubezpieczenie na życie dla firm', 'benefity pracownicze', 'broker ubezpieczeniowy'],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Ubezpieczenia grupowe dla firm',
      itemListElement: SERVICES.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', '@id': `${SITE.url}/${s.slug}/#service`, name: s.name },
      })),
    },
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: SITE.phone,
      email: SITE.email,
      contactType: 'sales',
      availableLanguage: ['Polish'],
      areaServed: 'PL',
    },
  };
}

export function website() {
  return {
    '@type': 'WebSite',
    '@id': WEBSITE_ID,
    url: SITE.url,
    name: SITE.name,
    description: SITE.description,
    inLanguage: SITE.lang,
    publisher: { '@id': ORG_ID },
  };
}

export function breadcrumbs(items: { name: string; url: string }[]) {
  return {
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: `${SITE.url}${it.url}`,
    })),
  };
}

export function faqPage(items: { q: string; a: string }[]) {
  return {
    '@type': 'FAQPage',
    mainEntity: items.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };
}

export function service(s: Service) {
  return {
    '@type': 'Service',
    '@id': `${SITE.url}/${s.slug}/#service`,
    name: s.name,
    serviceType: s.schemaType,
    description: s.description,
    url: `${SITE.url}/${s.slug}/`,
    image: s.image.src,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Polska' },
    audience: { '@type': 'BusinessAudience', name: 'Pracodawcy i firmy zatrudniające pracowników' },
    offers: {
      '@type': 'Offer',
      description: 'Analiza rynku, porównanie ofert i wdrożenie programu – bezpłatnie dla firmy.',
      price: '0',
      priceCurrency: 'PLN',
    },
  };
}

export function graph(...nodes: object[]) {
  return { '@context': 'https://schema.org', '@graph': nodes };
}
