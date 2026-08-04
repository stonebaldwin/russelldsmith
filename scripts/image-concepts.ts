/**
 * Stock-image concept classifier.
 *
 * Maps each migrated blog post to a curated, on-topic image search query.
 * Used by scripts/fetch-stock-images.ts. NO network / API key needed to run —
 * run `tsx scripts/preview-image-queries.ts` to review the assignment before
 * fetching anything.
 *
 * Design goals:
 *  1. Relevance — every post gets a query that visually matches its topic.
 *  2. Variety — big concepts (VA, USDA, credit…) carry several sub-queries so
 *     posts in the same bucket don't all resolve to the same photo. The fetcher
 *     also globally de-dupes by photo id, so uniqueness is guaranteed.
 *  3. Local flavor — NC/SC place-specific posts prefer regional scenery.
 */

export interface PostLike {
  slug: string;
  title: string;
  categories?: string[];
  tags?: string[];
}

export interface Concept {
  key: string;
  /** ordered: first match wins. Tested against the normalized haystack. */
  match: RegExp;
  /** one is chosen per-post (rotated by slug) then others used as fallback. */
  queries: string[];
  orientation?: "landscape" | "portrait" | "squarish";
}

/**
 * Hand-tuned overrides for branded / awkward posts where keyword rules would
 * misfire. Checked before the ordered concept list.
 */
export const SLUG_OVERRIDES: Record<string, string[]> = {
  zillow: ["real estate agent laptop leads", "realtor working computer office"],
  "we-are-experts-at-so-many-types-of-mortgage-loans-that-we-are-the-swiss-army-knife-of-mortgages":
    ["mortgage broker helping couple", "friendly loan officer handshake"],
  "we-are-hiring-loan-officers-join-team-move-to-build-your-own-success-story":
    ["business team office success", "professional team meeting handshake"],
  "team-move-ovm-hosts-c21-the-real-estate-center-2016-awards-breakfast": [
    "business awards event people",
    "corporate breakfast meeting professionals",
  ],
  "team-move-offers-financing-dreams-realtor-continuing-education-class": [
    "professional training class seminar",
    "real estate education classroom",
  ],
  "century-21-lumberton-nc": ["real estate agents team office", "realtor office professionals"],
  "owr-carolina-patriot-program-veteran-discounts": [
    "veteran military family home",
    "american flag house patriotic",
  ],
  "how-to-have-perfect-walk-on-water-qualifies-for-the-best-rate-there-is-credit":
    ["excellent credit score gauge", "perfect credit report finance"],
  "credit-score-tips": ["credit score dial gauge finance", "checking credit score phone"],
  "best-mortgage-articles": ["reading blog laptop coffee", "person writing blog desk"],
  "mortgage-blog-top-articles-2015": ["reading blog laptop coffee", "laptop desk writing"],
  "grow-your-business-how-to-share-helpful-articles-that-provide-valuable-information":
    ["sharing content laptop social media", "business marketing laptop desk"],
  "realtor-builder-marketing-tip-facebook-lists": [
    "social media marketing phone",
    "facebook marketing laptop",
  ],
  "uncw-wilmington-nc": ["university campus students", "college campus buildings"],
  "how-our-communication-and-updates-help-buyers-and-realtors": [
    "loan officer phone call client",
    "customer service professional phone",
  ],
  "which-mortgage-lender": ["mortgage lender meeting couple", "loan officer desk handshake"],
  "first-time-home-buyer-loan": ["couple online mortgage laptop", "young couple computer home loan"],
  "biweekly-mortgage": ["mortgage payment calendar calculator", "paying mortgage online laptop"],
  "cash-buyer-alternatives": ["stack of cash money house", "cash offer home model"],
  "cash-deposits-mortgages": ["counting cash money hands", "cash deposit bank envelope"],
  "mortgage-points": ["mortgage calculator money house model", "discount points paperwork calculator"],
  "ways-to-pay-off-a-mortgage-early": ["paying off mortgage money house", "couple celebrating mortgage paid home"],
  "top-3-reasons-buyers-are-moving-to-south-carolina": ["south carolina scenic landscape", "charleston south carolina skyline"],
  "there-are-a-million-reasons-not-to-buy-a-first-home-but-they-are-wrong": ["happy young couple first home", "couple buying first house keys"],
};

/**
 * Ordered concept list. SPECIFIC topics come before generic loan-program
 * buckets so e.g. "va-well-water-test" matches WELL WATER, not VA.
 */
export const CONCEPTS: Concept[] = [
  // ---- Strong regional / place identity (checked early) ---------------------
  {
    key: "loc-myrtle-beach",
    match: /myrtle[- ]?beach|horry/,
    queries: [
      "myrtle beach south carolina oceanfront",
      "myrtle beach coast aerial",
      "grand strand beach south carolina",
    ],
  },
  {
    key: "loc-charleston",
    match: /charleston/,
    queries: [
      "charleston south carolina historic homes",
      "charleston south carolina rainbow row",
      "charleston south carolina waterfront",
    ],
  },
  {
    key: "loc-coastal-nc",
    match: /wilmington|topsail|sunset[- ]?beach|carolina[- ]?beach|oak[- ]?island|surf[- ]?city|waterway|sellars[- ]?cove|coastal|intracoastal|new[- ]?hanover/,
    queries: [
      "wilmington north carolina waterfront",
      "coastal north carolina beach house",
      "intracoastal waterway homes",
      "carolina coast pier ocean",
    ],
  },
  {
    key: "loc-brunswick",
    match: /brunswick|leland|st[- ]?james|southport|calabash/,
    queries: [
      "coastal carolina golf community",
      "southport north carolina waterfront",
      "coastal neighborhood palm trees",
    ],
  },
  {
    key: "loc-lake",
    match: /lake[- ]?waccamaw|lakefront|\blake\b/,
    queries: ["lakefront home dock", "small lake town", "lake house waterfront"],
  },
  {
    key: "loc-raleigh",
    match: /raleigh|wake[- ]?county/,
    queries: ["raleigh north carolina skyline", "raleigh north carolina neighborhood"],
  },
  {
    key: "loc-fayetteville-bragg",
    match: /fayetteville|cumberland|fort[- ]?bragg|pope[- ]?afb/,
    queries: ["fort bragg military base", "fayetteville north carolina", "army soldiers american flag"],
  },
  {
    key: "loc-jacksonville-lejeune",
    match: /jacksonville[- ]?nc|camp[- ]?lejeune|onslow/,
    queries: ["marine corps family home", "coastal military town north carolina", "american flag suburban home"],
  },
  {
    key: "loc-greenville-sc",
    match: /greenville[- ]?sc/,
    queries: ["greenville south carolina downtown", "greenville south carolina falls park"],
  },
  {
    key: "loc-spartanburg",
    match: /spartanburg/,
    queries: ["spartanburg south carolina", "south carolina small town main street"],
  },
  {
    key: "loc-columbia-sc",
    match: /columbia[- ]?sc/,
    queries: ["columbia south carolina downtown", "south carolina state house"],
  },
  {
    key: "loc-sanford-moore",
    match: /sanford[- ]?nc|moore[- ]?county|pinehurst/,
    queries: ["pinehurst golf course north carolina", "north carolina small town", "golf course community homes"],
  },
  {
    key: "loc-small-town-nc",
    match: /whiteville|columbus[- ]?county|robeson|lumberton|century[- ]?21/,
    queries: ["small town main street north carolina", "rural north carolina town", "southern small town street"],
  },
  {
    key: "loc-nc-move",
    match: /ranks[- ]?high|top[- ]?place[- ]?move|influx.*north[- ]?carolina|moving[- ]?to[- ]?north[- ]?carolina|relocation|movers[- ]?study|north[- ]?carolina[- ]?ranks/,
    queries: [
      "blue ridge mountains north carolina",
      "north carolina landscape scenic",
      "moving boxes new home couple",
    ],
  },

  // ---- Very specific property / inspection topics ---------------------------
  {
    key: "reverse-mortgage-seniors",
    match: /reverse[- ]?mortgage|senior|retire|retirement|elderly/,
    queries: [
      "happy senior couple home",
      "retired couple front porch",
      "senior homeowners smiling house",
      "older couple relaxing patio",
    ],
  },
  {
    key: "well-water",
    match: /well[- ]?water|water[- ]?test|private[- ]?well|public[- ]?water|water[- ]?connection/,
    queries: ["rural water well property", "clean water glass tap", "well water pump countryside"],
  },
  {
    key: "crawl-space-foundation",
    match: /crawl[- ]?space|encapsulation|foundation[- ]?inspection|foundation[- ]?certification|permanent[- ]?foundation/,
    queries: ["house foundation construction", "home crawl space", "concrete house foundation"],
  },
  {
    key: "hvac-heat",
    match: /hvac|heat[- ]?source|heating|air[- ]?conditioning/,
    queries: ["hvac air conditioner unit home", "home heating system", "technician hvac repair"],
  },
  {
    key: "pest-inspection",
    match: /pest|termite|wdir|wood[- ]?destroying|insect/,
    queries: ["pest control inspection home", "home inspector house exterior", "termite inspection house"],
  },
  {
    key: "appraisal",
    match: /appraisal|appraiser|tidewater|inspection[- ]?waiver|property[- ]?inspection/,
    queries: ["home appraiser clipboard house", "real estate appraisal inspection", "house valuation inspector"],
  },
  {
    key: "kitchen",
    match: /kitchen/,
    queries: ["modern renovated kitchen interior", "bright kitchen home", "kitchen remodel new"],
  },
  {
    key: "renovation",
    match: /renovation|fixer|rehab|remodel|flipping|flip/,
    queries: ["home renovation tools", "house remodel construction interior", "renovating home paint"],
  },
  {
    key: "smart-home-maintenance",
    match: /smart[- ]?home|home[- ]?security|home[- ]?maintenance|maintenance[- ]?tips/,
    queries: ["smart home thermostat device", "homeowner home maintenance tools", "home security smart device"],
  },
  {
    key: "construction",
    match: /construction|build[- ]?a[- ]?house|building[- ]?a[- ]?home|framing|new[- ]?construction|constuction/,
    queries: [
      "house under construction framing",
      "new home construction site",
      "home building wood frame",
      "residential construction blueprint",
    ],
  },
  {
    key: "modular-manufactured",
    match: /modular|manufactured|doublewide|double[- ]?wide|on[- ]?frame|off[- ]?frame/,
    queries: ["modular home exterior new", "manufactured home", "new prefab home exterior"],
  },

  // ---- Credit & finance ------------------------------------------------------
  {
    key: "credit",
    match: /credit[- ]?scor|credit[- ]?report|credit[- ]?repair|credit[- ]?dispute|credit[- ]?inquir|equifax|charge[- ]?off|trended[- ]?data|credit[- ]?limit|credit[- ]?card|\bfico\b|limited[- ]?credit|credit[- ]?experience|credit[- ]?requirements|no[- ]?credit|1[- ]?credit[- ]?score|charge-off|credit[- ]?mistakes|credit[- ]?tricks/,
    queries: [
      "credit score report gauge",
      "checking credit score laptop",
      "credit cards finance close up",
      "credit report document pen",
    ],
  },
  {
    key: "student-loans",
    match: /student[- ]?loan/,
    queries: ["college graduation cap diploma", "student loan debt calculator", "graduate university campus"],
  },
  {
    key: "pmi-insurance-cost",
    match: /\bpmi\b|mortgage[- ]?insurance|lender[- ]?paid/,
    queries: ["mortgage documents calculator house", "home finance paperwork desk", "mortgage payment calculation"],
  },
  {
    key: "down-payment-gift-savings",
    match: /down[- ]?payment|downpayment|gift[- ]?funds|gift[- ]?letter|gift[- ]?of[- ]?equity|assistance|save.*down|piggy[- ]?bank|earnest[- ]?money|tax[- ]?refund/,
    queries: [
      "piggy bank savings coins home",
      "saving money for house jar",
      "handing over house keys gift",
      "couple saving money budget",
    ],
  },
  {
    key: "refinance-rates",
    match: /refinance|irrrl|recast|refi|mortgage[- ]?rate|rates[- ]?trend|fed[- ]?rate|interest[- ]?rate|streamline/,
    queries: [
      "mortgage refinance documents home",
      "declining interest rate chart",
      "calculator money model house",
      "home loan interest rates concept",
    ],
  },
  {
    key: "taxes",
    match: /property[- ]?tax|tax[- ]?rate|tax[- ]?exemption|homestead|capital[- ]?gains|interest[- ]?deduction|tax[- ]?credit|\bmcc\b|income[- ]?tax|tax[- ]?deduction|tax[- ]?bomb|tax[- ]?return|non[- ]?taxable/,
    queries: ["tax documents calculator home", "property tax paperwork house", "tax forms pen desk"],
  },

  // ---- Process / closing / people -------------------------------------------
  {
    key: "closing-keys",
    match: /closing|keys|funding|certified[- ]?funds|escrow|settlement|first[- ]?mortgage[- ]?payment|closing[- ]?checklist|seller[- ]?paid|seller[- ]?concession|concession|seller[- ]?costs/,
    queries: [
      "couple receiving new house keys",
      "signing home closing documents",
      "real estate closing handshake keys",
      "new homeowners keys front door",
    ],
  },
  {
    key: "loan-process-docs",
    match: /loan[- ]?process|mortgage[- ]?process|checklist|prequal|pre[- ]?qual|prequalification|roadmap|dos[- ]?and[- ]?donts|do's|electronic[- ]?signature|\btrid\b|regulation|cosigner|application/,
    queries: [
      "mortgage application paperwork signing",
      "loan officer meeting couple desk",
      "home loan documents calculator",
      "signing mortgage contract pen",
    ],
  },
  {
    key: "self-employed-income",
    // NB: no bare \bincome\b — it stole USDA "income limits" posts. Match only
    // income-*type* topics (self-employment, commission, overtime, etc.).
    match: /self[- ]?employed|commission[- ]?income|\bcommission\b|overtime|bank[- ]?statement|employment[- ]?history|unreimbursed|business[- ]?owner|non[- ]?taxable|1099|social[- ]?security|disability|retired[- ]?borrower/,
    queries: [
      "self employed home office laptop",
      "small business owner working",
      "person working from home desk",
      "entrepreneur laptop paperwork",
    ],
  },
  {
    key: "rental-investment",
    match: /rental|landlord|investment[- ]?property|multifamily|multi[- ]?family|dscr|debt[- ]?service|cash[- ]?flow|rent[- ]?to[- ]?own|real[- ]?estate[- ]?investing|how[- ]?to[- ]?get[- ]?into[- ]?real[- ]?estate/,
    queries: [
      "rental property houses row",
      "for rent sign house",
      "investment property keys money",
      "duplex rental home exterior",
    ],
  },
  {
    key: "selling-fsbo",
    match: /sell[- ]?your[- ]?house|\bfsbo\b|for[- ]?sale[- ]?by[- ]?owner|open[- ]?house|selling|sold[- ]?sign|home[- ]?prices[- ]?surge|purchase[- ]?contract|offer[- ]?to[- ]?purchase|seller[- ]?deed/,
    queries: ["sold real estate sign yard", "for sale sign front house", "open house sign home"],
  },
  {
    key: "realtor-marketing",
    match: /realtor|real[- ]?estate[- ]?agent|\bagent\b|marketing|\bseo\b|reviews|facebook|leads|continuing[- ]?education|awards[- ]?breakfast|become[- ]?a[- ]?realtor|buyers[- ]?agent/,
    queries: [
      "real estate agent with clients",
      "realtor showing home to couple",
      "real estate professional handshake",
      "agent giving house tour",
    ],
  },
  {
    key: "insurance",
    match: /insurance|flood/,
    queries: ["home insurance protection concept", "house model umbrella protection", "flood insurance home water"],
  },
  {
    key: "divorce",
    match: /divorce|separation|separated/,
    queries: ["divorce paperwork house keys", "couple separation home", "splitting assets house"],
  },
  {
    key: "clergy",
    match: /clergy|pastor|minister|pastoral|housing[- ]?allowance/,
    queries: ["church steeple building", "pastor at church", "small church exterior"],
  },
  {
    key: "family-buy",
    match: /green[- ]?card|\bitin\b|disabled[- ]?adult|parents|family|cosign|buying[- ]?home[- ]?for/,
    queries: ["diverse family new home keys", "family in front of house", "multigenerational family home"],
  },
  {
    key: "hurricane",
    match: /hurricane|storm/,
    queries: ["hurricane approaching coast", "storm clouds over house", "coastal home before storm"],
  },
  {
    key: "roads-acreage-farm",
    match: /all[- ]?weather[- ]?road|dirt|gravel|private[- ]?road|horse[- ]?farm|acreage|\bfarm\b|country/,
    queries: ["rural gravel country road", "acreage farm property home", "country home wide land"],
  },
  {
    key: "market-data",
    match: /jobs[- ]?report|economy|home[- ]?prices|market[- ]?update|\btrend\b|\bdata\b|november[- ]?jobs|december/,
    queries: ["housing market growth chart", "real estate market graph", "economy financial chart rising"],
  },
  {
    key: "condos-townhouse",
    match: /condo|townhouse|townhome/,
    queries: ["modern condominium building", "townhouse row exterior", "condo apartment balcony"],
  },
  {
    key: "foreclosure-shortsale",
    match: /foreclosure|short[- ]?sale|underwater|hardship/,
    queries: ["house financial hardship", "foreclosure home sign yard", "distressed home for sale"],
  },

  // ---- Loan-program generics (after specific topics) ------------------------
  {
    key: "va-jumbo-luxury",
    match: /jumbo|luxury|va[- ]?jumbo/,
    queries: ["luxury home exterior large", "upscale modern house", "large custom home twilight"],
  },
  {
    key: "va-military",
    match: /veteran|\bva[- ]?loan|va[- ]?home|va[- ]?construction|va[- ]?refinance|va[- ]?cash|va[- ]?bonus|va[- ]?entitlement|certificate[- ]?of[- ]?eligibility|\bcoe\b|statement[- ]?of[- ]?service|dd214|award[- ]?letter|\bbah\b|\bpcs\b|\bets\b|military|marine|active[- ]?duty|soldier|servicemember|\bva\b/,
    queries: [
      "military family in front of home",
      "soldier returning home family",
      "american flag house front porch",
      "veteran couple new house keys",
      "military homecoming embrace",
    ],
  },
  {
    key: "usda-rural",
    match: /usda|rural|no[- ]?money[- ]?down|household[- ]?income|eligibility[- ]?map|guarantee[- ]?fee|funding[- ]?fee|income[- ]?limits/,
    queries: [
      "rural country home porch",
      "countryside farmhouse field",
      "country house green landscape",
      "rural home wraparound porch",
    ],
  },
  {
    key: "fha",
    match: /\bfha\b/,
    queries: ["suburban family home exterior", "new american suburban house", "cozy first home exterior"],
  },
  {
    key: "conforming-limits",
    match: /conforming|loan[- ]?limit|fannie[- ]?mae|freddie[- ]?mac|homeready|home[- ]?ready|nc[- ]?home[- ]?advantage|hud[- ]?home/,
    queries: ["suburban house neighborhood", "two story home exterior", "american home blue sky"],
  },

  // ---- First-time / general buyer (broad default-ish) -----------------------
  {
    key: "first-time-buyer",
    match: /first[- ]?time|first[- ]?home|buy[- ]?a[- ]?house|buy[- ]?a[- ]?home|buying[- ]?a[- ]?home|renting|move.*parents|second[- ]?home|move[- ]?up|budget|homebuyer|homeownership|no[- ]?down[- ]?payment/,
    queries: [
      "happy couple first home keys",
      "young family moving into house",
      "couple in front of new home",
      "excited homeowners new house",
    ],
  },
];

const FALLBACK: string[] = [
  "modern house exterior blue sky",
  "welcome home new house keys",
  "beautiful home front yard",
];

export function classify(post: PostLike): { concept: string; queries: string[] } {
  if (SLUG_OVERRIDES[post.slug]) {
    return { concept: "override", queries: SLUG_OVERRIDES[post.slug] };
  }
  // Classify on slug + title ONLY. The migrated WordPress `tags` are boilerplate
  // noise — every post carries a dozen realtor-association tags (e.g.
  // "pinehurst-southern-pines-association-of-realtors", "wrar",
  // "wrightsville-beach-nc") whose place names would wreck location matching.
  const hay = [post.slug.replace(/-/g, " "), post.title]
    .join(" ")
    .toLowerCase();

  for (const c of CONCEPTS) {
    if (c.match.test(hay)) return { concept: c.key, queries: c.queries };
  }
  return { concept: "fallback", queries: FALLBACK };
}

/** Deterministic small hash so the same slug always picks the same primary query. */
export function slugHash(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}
