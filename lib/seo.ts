import type { Post } from "./content";
import { SITE_URL, categoryLabel } from "./content";
import { SITE, AUTHOR, CONTACT, SOCIAL, COMPLIANCE } from "./site";
import { RATING, TESTIMONIALS } from "./reviews";

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return SITE_URL + (path.startsWith("/") ? path : "/" + path);
}

export interface Crumb {
  name: string;
  url: string;
}

export function breadcrumbJsonLd(crumbs: Crumb[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: absoluteUrl(c.url),
    })),
  };
}

export function articleJsonLd(post: Post) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.updated || post.date,
    ...(post.hero ? { image: [absoluteUrl(post.hero)] } : {}),
    author: {
      "@type": "Person",
      name: AUTHOR.name,
      jobTitle: AUTHOR.role,
      url: absoluteUrl("/about/"),
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      url: SITE_URL,
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": absoluteUrl(post.url) },
    ...(post.categories[0] ? { articleSection: categoryLabel(post.categories[0]) } : {}),
  };
}

/** Loan-officer entity for the About page / site identity. */
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    name: AUTHOR.name,
    jobTitle: AUTHOR.role,
    description: AUTHOR.bio,
    image: absoluteUrl(AUTHOR.photo),
    url: absoluteUrl("/about/"),
    telephone: CONTACT.phone,
    email: CONTACT.email,
    identifier: `NMLS #${AUTHOR.nmls}`,
    areaServed: AUTHOR.servingArea,
    sameAs: [SOCIAL.facebook, SOCIAL.youtube],
    worksFor: {
      "@type": "Organization",
      name: COMPLIANCE.company,
      url: "https://alcova.com",
    },
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
  };
}

/** Loan-officer business entity with the Experience.com aggregate rating. */
export function localBusinessJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": ["FinancialService", "LocalBusiness"],
    name: `${AUTHOR.name} — ${COMPLIANCE.company}`,
    image: absoluteUrl(AUTHOR.photo),
    url: SITE_URL,
    telephone: CONTACT.phone,
    email: CONTACT.email,
    areaServed: AUTHOR.servingArea,
    priceRange: "$$",
    sameAs: [SOCIAL.facebook, SOCIAL.youtube, RATING.url],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: RATING.value,
      reviewCount: RATING.count,
      bestRating: RATING.max,
    },
    review: TESTIMONIALS.slice(0, 3).map((t) => ({
      "@type": "Review",
      reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
      author: { "@type": "Person", name: t.author },
      reviewBody: t.body,
    })),
  };
}
