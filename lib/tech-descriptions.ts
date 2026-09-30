/** One-line "what is it" for each tech slug (Skills icon slugs and Experience slugs). */
const TECH_DESCRIPTIONS: Record<string, string> = {
  react: "Cross-platform framework for building native iOS and Android apps with React.",
  "react-native": "Cross-platform framework for building native iOS and Android apps with React.",
  reactjs: "JavaScript library for building component-based user interfaces.",
  java: "Object-oriented language widely used for Android and backend systems.",
  android: "Google's mobile OS; native apps are built with Kotlin or Java.",
  js: "The language of the web, running in browsers and on servers.",
  typescript: "JavaScript with static types for safer, more maintainable code.",
  nodejs: "JavaScript runtime for building servers, APIs and tooling.",
  firebase: "Google's app platform: auth, database, analytics and hosting.",
  nextjs: "React framework for server-rendered and static web apps.",
  expressjs: "Minimal web framework for building APIs on Node.js.",
  mysql: "Popular open-source relational database.",
  mongodb: "Document-oriented NoSQL database that stores JSON-like data.",
  aws: "Amazon's cloud platform for compute, storage and hosting.",
  git: "Distributed version control for tracking code changes.",
  trpc: "End-to-end typesafe APIs between TypeScript client and server.",
  laravel: "PHP web framework for building full-stack applications.",
  "firebase-crashlytics": "Real-time crash reporting for mobile apps.",
  "google-play": "Google's app store; where Android apps are published.",
  "google-analytics": "Web and app analytics for tracking user behaviour.",
  "rest-api": "HTTP-based API style for exchanging data between services.",
  agile: "Iterative way of working: small increments, fast feedback.",
  jira: "Issue and sprint tracking tool for software teams.",
  confluence: "Team wiki for documentation and knowledge sharing.",
  scrum: "Agile framework built on sprints, standups and retrospectives.",
  kanban: "Agile method that visualises work on a board to limit work in progress.",
};

export function getTechDescription(slug: string): string | undefined {
  return TECH_DESCRIPTIONS[slug];
}
