/** Russell's rating + testimonials, harvested from Experience.com + his old site. */

export const RATING = {
  value: 4.97,
  count: 1638,
  max: 5,
  source: "Experience.com",
  url: "https://www.experience.com/reviews/russell-smith-210685",
} as const;

export interface Testimonial {
  author: string;
  role?: string;
  body: string;
}

// Real client + Realtor reviews (Experience.com and the prior teammovemortgage
// About page). Lightly trimmed for length; wording preserved.
export const TESTIMONIALS: Testimonial[] = [
  {
    author: "Angela D.",
    role: "Realtor, 23 years",
    body: "There is NO other lender that can possibly outdo Russell Smith and his team at ALCOVA! I have been a realtor for 23 years and have had the opportunity to work with many lenders. Hands down, there is no comparison.",
  },
  {
    author: "Kathleen B.",
    body: "Russell is one of the few professionals who I give a solid 5-star rating. The average but competent ones get 3 stars. The better than average get 4 stars. The few who get 5 stars are the elite performers in their field.",
  },
  {
    author: "Verified client",
    body: "Russell Smith and Amy Kurtyka are simply the best in the business. One week before closing, another bank denied our loan and we were crushed. In 6 days — start to finish — Russell got us approved and we closed on the original date. He pulled off the impossible.",
  },
  {
    author: "Real estate agent",
    body: "Russell is a dedicated mortgage professional with a high level of integrity who, since 2010, has assisted several of my buyers. He is honest, trustworthy, realistic about what it takes to close a loan, and does it in a timely manner. I highly recommend him.",
  },
  {
    author: "Verified client",
    body: "Russell was a huge asset to my husband and me when we purchased our home. He made the process incredibly seamless — everything went off without a hitch. My parents recommended him to us, and we hope to use him again.",
  },
  {
    author: "Verified client",
    body: "It has been such a pleasure working with Russell Smith. He is knowledgeable, professional, prompt, and goes out of his way to handle any issue that arises. He and his team took so much stress off of me during the entire process.",
  },
];
