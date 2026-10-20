export const site = {
  "slug": "fieldwork-landscapes",
  "brand": "Fieldwork",
  "suffix": "LANDSCAPE STUDIO",
  "theme": "landscape",
  "city": "Portland",
  "state": "OR",
  "phone": "(503) 555-0186",
  "tel": "+15035550186",
  "eyebrow": "LANDSCAPES FOR EVERYDAY LIVING.",
  "headline": "A little closer\nto the outside.",
  "intro": "A quiet morning, a long table, a garden that changes with the seasons. Let’s make a place you will actually use.",
  "cta": "Tell us about your garden",
  "accent": "#c7c69c",
  "dark": "#243c2d",
  "hero": "photo-1416879595882-3373a0480b5b",
  "alt": "Landscaped garden with lawn and planting",
  "scene": "plant",
  "services": [
    [
      "garden-design",
      "Garden design",
      "Start with how you live.",
      "A considered concept for planting, paths and the way you use your outdoor space.",
      350
    ],
    [
      "seasonal-care",
      "Seasonal garden care",
      "A garden, well looked after.",
      "A seasonal maintenance scope shaped around your site and priorities.",
      165
    ],
    [
      "outdoor-living",
      "Outdoor living spaces",
      "Make space for the good days.",
      "Plan useful gathering areas, simple circulation and a more inviting garden.",
      450
    ]
  ],
  "areas": [
    "Sellwood",
    "Alberta",
    "Laurelhurst",
    "St. Johns"
  ],
  "steps": [
    "Walk us through your space",
    "Explore a considered concept",
    "Agree on the project scope"
  ],
  "promise": "Designed around the way you spend your days.",
  "question": "What helps prepare for a landscape consultation?",
  "answer": "Share a few photos, rough dimensions and how you want to use the space. Mention access, existing planting and a realistic budget range. A site review is needed before a final design or installation quote.",
  "article": "plan-a-portland-garden",
  "articleTitle": "Planning a Portland garden: begin with how you want to live.",
  "articleBody": [
    "List the activities that matter: a morning coffee, children playing, growing food or a place to sit with friends.",
    "Observe your space at different times of day. Record light, access and areas that need special attention.",
    "Bring reference photos and a budget range to the consultation. The final scope depends on an individual site assessment."
  ],
  "quote": "The best room might be outside.",
  "section": "Good places grow from good conversations.",
  "about": "Fieldwork is a landscape studio concept rooted in useful outdoor spaces. It begins with the life a garden needs to support, then gives visitors a clear path to a consultation."
};
export const demoMode = process.env.DEMO_MODE !== "false";
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
