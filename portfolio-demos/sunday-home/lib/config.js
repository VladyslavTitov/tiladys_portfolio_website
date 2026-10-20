export const site = {
  "slug": "sunday-home",
  "brand": "sunday",
  "suffix": "HOME CLEANING",
  "theme": "cleaning",
  "city": "Denver",
  "state": "CO",
  "phone": "(720) 555-0118",
  "tel": "+17205550118",
  "eyebrow": "MAKE ROOM FOR YOUR WEEKEND.",
  "headline": "A fresh home.\nA freer Sunday.",
  "intro": "Less time catching up. More time doing your thing. Build a cleaning request around your home, your priorities and your rhythm.",
  "cta": "Build my cleaning request",
  "accent": "#f4b7a2",
  "dark": "#25443c",
  "hero": "photo-1600585154340-be6161a56a0c",
  "alt": "Comfortable bright living room",
  "scene": "bubbles",
  "services": [
    [
      "routine-clean",
      "Routine home cleaning",
      "Keep the fresh feeling.",
      "Recurring cleaning requests for the rooms and priorities you choose.",
      120
    ],
    [
      "deep-clean",
      "A deeper clean",
      "Time for a fresh start.",
      "An expanded cleaning scope for the areas that need extra attention.",
      220
    ],
    [
      "move-clean",
      "Move-in / move-out",
      "Hello, next chapter.",
      "A cleaning plan for an empty home before keys change hands.",
      260
    ]
  ],
  "areas": [
    "Highlands",
    "Wash Park",
    "Capitol Hill",
    "Park Hill"
  ],
  "steps": [
    "Choose your clean and priorities",
    "Request a day that suits you",
    "Confirm the scope with the team"
  ],
  "promise": "A little less on your list. A little more life.",
  "question": "Is the online cleaning estimate a final quote?",
  "answer": "No. It is an illustrative starting estimate based on the selected service and home size. Final pricing depends on the agreed scope, condition and availability. Your request is saved for confirmation; it is not a confirmed booking.",
  "article": "choose-your-clean",
  "articleTitle": "Routine or deep cleaning in Denver? Plan your request.",
  "articleBody": [
    "Start with the areas that matter most to you. List the rooms, surfaces and priorities you want included.",
    "A routine visit focuses on an agreed recurring scope. A deeper clean allows for additional tasks that should be confirmed before work starts.",
    "Mention the home size, pets, access arrangements and preferred dates. Avoid entering door codes or other sensitive details into a public form."
  ],
  "quote": "Your home, ready for real life.",
  "section": "Find your kind of fresh.",
  "about": "Sunday is a home-cleaning concept with a friendly, practical booking journey. Visitors can explore service scopes, adjust an estimate and send a request for the team to confirm."
};
export const demoMode = process.env.DEMO_MODE !== "false";
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
