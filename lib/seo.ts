import type { Post } from "./content";
import { SITE_URL, categoryLabel } from "./content";
import { SITE, AUTHOR } from "./site";

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
    url: absoluteUrl("/about/"),
    worksFor: { "@type": "Organization", name: SITE.name, url: SITE_URL },
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
