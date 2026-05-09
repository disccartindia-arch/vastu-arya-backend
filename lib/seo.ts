// lib/seo.ts — Fix #5: GSC verification token made env-driven
import type { Metadata } from 'next';

const SITE_URL  = 'https://www.vastuarya.com';
const SITE_NAME = 'Vastu Arya';
const LOGO_URL  = 'https://www.vastuarya.com/logo.jpg';
const TWITTER   = '@VastuArya';

const DEFAULT_TITLE       = 'Vastu Arya - IVAF Certified Vastu and Astrology Consultancy | Dr. PPS Tomar';
const DEFAULT_DESCRIPTION = "India's premier Vastu Shastra, Astrology and Numerology platform by Dr. PPS Tomar - IVAF Certified Expert. 45,000+ happy clients. Book a consultation from just Rs.11.";

export interface PageSeoProps {
  title?:       string;
  description?: string;
  path?:        string;
  imageUrl?:    string;
  keywords?:    string[];
  noIndex?:     boolean;
}

export function buildMetadata({
  title,
  description = DEFAULT_DESCRIPTION,
  path        = '/',
  imageUrl    = LOGO_URL,
  keywords    = ['vastu shastra', 'vastu expert India', 'vastu arya', 'Dr PPS Tomar', 'IVAF certified vastu consultant', 'astrology consultation', 'numerology expert', 'online vastu consultation', 'home vastu', 'business vastu', 'vastu remedies', 'gemstone guidance', 'rudraksha consultation', 'vastu new delhi'],
  noIndex     = false,
}: PageSeoProps = {}): Metadata {
  const fullTitle    = title ? (title + ' | ' + SITE_NAME) : DEFAULT_TITLE;
  const canonicalUrl = SITE_URL + path;
  return {
    title:       fullTitle,
    description,
    keywords:    keywords.join(', '),
    alternates:  { canonical: canonicalUrl },
    openGraph: {
      title:    fullTitle,
      description,
      url:      canonicalUrl,
      siteName: SITE_NAME,
      locale:   'en_IN',
      type:     'website',
      images:   [{ url: imageUrl, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       fullTitle,
      description,
      images:      [imageUrl],
      creator:     TWITTER,
      site:        TWITTER,
    },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    // Fix #5 — env-driven GSC token; add NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION in Vercel env vars
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    },
  };
}

export const vastuAryaJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': ['LocalBusiness', 'ProfessionalService'],
      '@id':   SITE_URL + '/#business',
      name:        'Vastu Arya',
      url:         SITE_URL,
      logo:        LOGO_URL,
      image:       LOGO_URL,
      telephone:   '+91-7000343804',
      email:       'info@vastuarya.com',
      description: "India's premier Vastu Shastra and Astrology consultancy by IVAF Certified Expert Dr. PPS Tomar.",
      priceRange:  'Rs.Rs.',
      address: {
        '@type':          'PostalAddress',
        addressLocality:  'New Delhi',
        addressRegion:    'Delhi',
        postalCode:       '110001',
        addressCountry:   'IN',
      },
      geo: { '@type': 'GeoCoordinates', latitude: 28.6139, longitude: 77.2090 },
      aggregateRating: {
        '@type':       'AggregateRating',
        ratingValue:   '4.9',
        bestRating:    '5',
        reviewCount:   '45000',
      },
      openingHoursSpecification: [
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'], opens: '09:00', closes: '20:00' },
        { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday'], opens: '10:00', closes: '17:00' },
      ],
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name:    'Vastu and Astrology Services',
        itemListElement: [
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vastu Shastra Consultancy' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Home Energy Analysis' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Business Vastu Consultation' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mobile Numerology' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Gemstone Guidance' } },
          { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Vastu Check' } },
        ],
      },
      sameAs: ['https://www.facebook.com/vastuarya','https://www.instagram.com/vastuarya','https://www.youtube.com/@vastuarya'],
    },
    {
      '@type':         'Person',
      '@id':           SITE_URL + '/#drppstomar',
      name:            'Dr. PPS Tomar',
      honorificPrefix: 'Dr.',
      jobTitle:        'IVAF Certified Vastu Shastra Expert and Astrologer',
      url:             SITE_URL + '/about',
      image:           LOGO_URL,
      telephone:       '+91-7000343804',
      worksFor:        { '@id': SITE_URL + '/#business' },
      address:         { '@type': 'PostalAddress', addressLocality: 'New Delhi', addressCountry: 'IN' },
      knowsAbout:      ['Vastu Shastra','Astrology','Numerology','Gemstone Therapy','Rudraksha','Business Vastu'],
      hasCredential: {
        '@type':              'EducationalOccupationalCredential',
        credentialCategory:   'Professional Certification',
        recognizedBy: { '@type': 'Organization', name: 'Indian Vastu Architects Federation (IVAF)' },
      },
    },
    {
      '@type':     'WebSite',
      '@id':       SITE_URL + '/#website',
      url:         SITE_URL,
      name:        SITE_NAME,
      description: DEFAULT_DESCRIPTION,
      publisher:   { '@id': SITE_URL + '/#business' },
      potentialAction: {
        '@type':  'SearchAction',
        target:   { '@type': 'EntryPoint', urlTemplate: SITE_URL + '/search?q={search_term_string}' },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
};

export const bookAppointmentJsonLd = {
  '@context':   'https://schema.org',
  '@type':      'Service',
  name:         'Book Vastu Consultation with Dr. PPS Tomar',
  description:  'Book a Vastu Shastra, Astrology, or Numerology consultation with IVAF Certified Expert Dr. PPS Tomar. Starting from Rs.11.',
  url:          SITE_URL + '/book-appointment',
  provider:     { '@id': SITE_URL + '/#business' },
  areaServed:   { '@type': 'Country', name: 'India' },
  offers: {
    '@type':        'Offer',
    price:          '11',
    priceCurrency:  'INR',
    availability:   'https://schema.org/InStock',
    url:            SITE_URL + '/book-appointment',
  },
};
