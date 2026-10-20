export const site = {
  "slug": "torque-motorworks",
  "brand": "TORQUE",
  "suffix": "MOTORWORKS / AUSTIN",
  "theme": "auto",
  "city": "Austin",
  "state": "TX",
  "phone": "(512) 555-0168",
  "tel": "+15125550168",
  "eyebrow": "MORE ROAD. LESS GUESSWORK.",
  "headline": "Built for\nthe long run.",
  "intro": "A better kind of garage. Understand the diagnosis, compare your options and get back to the miles that matter.",
  "cta": "Plan my service",
  "accent": "#ff703d",
  "dark": "#151918",
  "hero": "photo-1486262715619-67b85e0b08d3",
  "alt": "Vehicle engine and drive belt components",
  "scene": "wheel",
  "services": [
    [
      "diagnostics",
      "Vehicle diagnostics",
      "Find the why.",
      "Investigate warning lights and drivability concerns with a documented assessment.",
      125
    ],
    [
      "brakes",
      "Brake inspection & care",
      "Confidence at every stop.",
      "Inspection and repair planning for braking concerns and worn components.",
      95
    ],
    [
      "maintenance",
      "Scheduled maintenance",
      "Keep the good miles coming.",
      "A maintenance plan based on your vehicle, its mileage and how you drive.",
      85
    ]
  ],
  "areas": [
    "East Austin",
    "Mueller",
    "Hyde Park",
    "South Lamar"
  ],
  "steps": [
    "Describe your car and concern",
    "Review findings and options",
    "Approve only the work you choose"
  ],
  "promise": "Your car. Your call. A clear recommendation.",
  "question": "What should I include in a service request?",
  "answer": "Include the vehicle year, make, model and mileage, then describe the symptoms and when they happen. A request is not a diagnosis. If the car feels unsafe, avoid driving it and arrange suitable assistance.",
  "article": "prepare-for-diagnostics",
  "articleTitle": "Booking car diagnostics in Austin: what to tell your mechanic.",
  "articleBody": [
    "Note when the concern occurs: a cold start, braking, a turn or a longer journey. Describe what you see, hear or feel.",
    "Add the vehicle year, make, model, mileage and relevant service history. A clear description helps plan the initial inspection.",
    "An online request reserves no confirmed slot. Wait for the workshop to agree on the timing and assessment scope."
  ],
  "quote": "Keep the car. Love the drive.",
  "section": "The right work. For the road ahead.",
  "about": "Torque is an independent workshop concept built around informed decisions. The process gives the driver a place to describe concerns and review recommendations before authorizing work."
};
export const demoMode = process.env.DEMO_MODE !== "false";
export const siteUrl = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
