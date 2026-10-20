export const site = {
  "slug": "aster-dental",
  "brand": "aster",
  "suffix": "DENTAL STUDIO",
  "theme": "dental",
  "city": "Seattle",
  "state": "WA",
  "phone": "(206) 555-0124",
  "tel": "+12065550124",
  "eyebrow": "A LITTLE MORE COMFORT. A LOT MORE YOU.",
  "headline": "Room to relax.\nReasons to smile.",
  "intro": "Thoughtful dental visits start with a conversation. Share what matters to you, ask your questions and take the next step at your own pace.",
  "cta": "Request a first visit",
  "accent": "#b9a6e6",
  "dark": "#33332e",
  "hero": "photo-1629909613654-28e377c37b09",
  "alt": "Bright modern dental treatment room",
  "scene": "tooth",
  "services": [
    [
      "first-visit",
      "Your first visit",
      "Let’s get to know you.",
      "A conversation about your goals and an examination plan discussed with you.",
      150
    ],
    [
      "preventive-care",
      "Preventive care",
      "Make room for everyday care.",
      "Examinations and cleaning appointments planned around individual needs.",
      120
    ],
    [
      "smile-consultation",
      "Smile consultation",
      "Explore the possibilities.",
      "Discuss appearance goals, suitable options and the questions you want answered.",
      95
    ]
  ],
  "areas": [
    "Capitol Hill",
    "Queen Anne",
    "Ballard",
    "Fremont"
  ],
  "steps": [
    "Share your goals and questions",
    "Meet and discuss a care plan",
    "Decide what feels right for you"
  ],
  "promise": "Space for your questions. Time for your comfort.",
  "question": "Can I tell the team I feel nervous about a visit?",
  "answer": "Yes. Include your preferences when requesting an appointment. You can ask about breaks, explanations and the planned visit. This form is for appointment requests, not urgent care or medical advice.",
  "article": "first-dental-visit",
  "articleTitle": "Your first Seattle dental visit: questions worth bringing.",
  "articleBody": [
    "Write down what you want to discuss: comfort, routine care, appearance or a concern you have noticed.",
    "Bring relevant records if the practice requests them, and ask how the proposed examination and costs will be explained.",
    "Ask what happens next and how to contact the practice with follow-up questions. Online information cannot replace an individual assessment."
  ],
  "quote": "Care that leaves a little more room for you.",
  "section": "Every smile has a starting point.",
  "about": "Aster is a calm dental studio concept. Its visitor journey makes room for questions, comfort preferences and a first-visit request without presenting online content as a diagnosis."
};
export const demoMode = process.env.DEMO_MODE !== "false";
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
