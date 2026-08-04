/** Canonical category options for the editor (union of taxonomy + slugs in use). */
export const CATEGORY_OPTIONS: { slug: string; label: string }[] = [
  { slug: "1st-time-buyers", label: "1st Time Buyers" },
  { slug: "va-loans", label: "VA Loans" },
  { slug: "usda", label: "USDA" },
  { slug: "fha", label: "FHA" },
  { slug: "products", label: "Products" },
  { slug: "frequently-asked-questions", label: "Frequently Asked Questions" },
  { slug: "tips", label: "Tips" },
  { slug: "recent-changes", label: "Recent Changes" },
  { slug: "market-updates", label: "Market Updates" },
  { slug: "real-estate-professionals", label: "Real Estate Professionals" },
  { slug: "constuction-to-perm", label: "Construction to Perm" },
  { slug: "condos", label: "Condos" },
  { slug: "jumbo", label: "Jumbo" },
  { slug: "pmi", label: "PMI" },
  { slug: "reverse-mortgages-retirement-living", label: "Reverse Mortgages & Retirement Living" },
  { slug: "rehabrenovation", label: "Rehab & Renovation" },
  { slug: "success-stories", label: "Success Stories" },
  { slug: "market-updates", label: "Market Updates" },
  { slug: "data", label: "Data" },
  { slug: "general-info", label: "General Info" },
  { slug: "interesting", label: "Interesting" },
  { slug: "local-resources-best-places-to-live-in-nc-and-sc-including-subdivisions-schools-things-to-do", label: "Local Resources & Best Places" },
  { slug: "guest-blog-contribution", label: "Guest Blog Contribution" },
  { slug: "regulation", label: "Regulation" },
  { slug: "team-news", label: "Team News" },
  { slug: "training", label: "Training" },
].filter((v, i, a) => a.findIndex((x) => x.slug === v.slug) === i);

export function categoryLabel(slug: string): string {
  return (
    CATEGORY_OPTIONS.find((c) => c.slug === slug)?.label ??
    slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}
