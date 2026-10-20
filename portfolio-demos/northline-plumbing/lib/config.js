export const site = {
  "slug": "northline-plumbing",
  "brand": "Northline",
  "suffix": "PLUMBING CO.",
  "theme": "plumbing",
  "city": "Chicago",
  "state": "IL",
  "phone": "(312) 555-0142",
  "tel": "+13125550142",
  "eyebrow": "CHICAGO HOMES. FLOWING AGAIN.",
  "headline": "Good plumbing.\nBetter peace of mind.",
  "intro": "From a stubborn drain to a hidden leak, get a clear plan before the work begins. Practical solutions for the home you love.",
  "cta": "Find my plumbing solution",
  "accent": "#c5ef42",
  "dark": "#092f48",
  "hero": "photo-1505798577917-a65157d3320a",
  "alt": "Plumbing fixtures in a modern bathroom",
  "scene": "pipe",
  "services": [
    [
      "drain-cleaning",
      "Drain cleaning",
      "A clear path forward.",
      "Slow sinks, recurring clogs and backed-up drains, assessed before treatment.",
      149
    ],
    [
      "leak-repair",
      "Leak detection & repair",
      "Find the source. Fix the cause.",
      "Careful fault finding for drips, damp spots and unexpected water use.",
      185
    ],
    [
      "water-heaters",
      "Water heater service",
      "Bring back the hot water.",
      "Repair and replacement planning for the hot-water system your home needs.",
      225
    ]
  ],
  "areas": [
    "Lincoln Park",
    "Lakeview",
    "Logan Square",
    "Wicker Park"
  ],
  "steps": [
    "Tell us what you are seeing",
    "Review the scope and estimate",
    "Choose your next step"
  ],
  "promise": "Know the plan before we pick up a wrench.",
  "question": "What should I do when a sink drains slowly?",
  "answer": "Stop adding water if the sink is backing up. Remove visible debris from the strainer without dismantling the drain. If the problem keeps returning, request an assessment rather than repeatedly adding drain chemicals.",
  "article": "slow-drain-next-steps",
  "articleTitle": "Slow drain in Chicago? Start with these simple checks.",
  "articleBody": [
    "Notice whether one fixture or several are affected. This helps describe the problem when you request service.",
    "Check the removable strainer for visible debris. Avoid mixing chemical products or forcing tools into an unfamiliar drain.",
    "If water backs up, stop using the fixture and arrange professional assessment. Share photos and explain when the problem started."
  ],
  "quote": "A home works better when the essentials do.",
  "section": "Small issue or a bigger project. Start here.",
  "about": "Northline pairs a practical service process with straightforward communication. Tell us what is happening, choose a useful appointment window and keep every detail in one place."
};
export const demoMode = process.env.DEMO_MODE !== "false";
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
