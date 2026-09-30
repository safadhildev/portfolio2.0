import rawContent from "@/content/portfolio.json";
import { parsePortfolio } from "./content-schema";
import type { SectionType } from "./content-schema";

export type { SectionType };

export interface TextStyle {
  fontWeight: string;
  fontSize: string;
  color: string;
  fontFamily: string;
}

export interface HeroLink {
  title: string;
  url: string;
}

export interface HeroContent {
  type: "hero";
  visible: boolean;
  comments: string[];
  title: string;
  description: string;
  links: HeroLink[];
}

export interface Skill {
  label: string;
  title: string;
  icon: string;
  style: {
    backgroundColor: string;
    color: string;
  };
}

export interface AboutContent {
  type: "about";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  content: string;
}

export interface SkillsContent {
  type: "skills";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  skills: Skill[];
}

export interface ProjectLink {
  type: string;
  icon: string;
  link: string;
}

export interface Project {
  number: string;
  year: string;
  filename: string;
  title: string;
  description: string;
  skills: string[];
  links: ProjectLink[];
  windowStyles: {
    backgroundColor: string;
  };
}

export interface ExperienceEntry {
  start: string;
  end: string | null;
  title: string;
  company: string;
  filename: string;
  description?: string;
  responsibilities: string[];
  skills: string[];
  windowStyles?: { backgroundColor: string };
}

export interface ExperienceContent {
  type: "experience";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  content: ExperienceEntry[];
}

export interface ProjectsContent {
  type: "projects";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  content: Project[];
}

export interface ContactLink {
  label: string;
  url: string;
  style: {
    backgroundColor: string;
    dropShadowColor: string;
  };
}

export interface ContactContent {
  type: "contact";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  sectionDescription: string;
  sectionDescriptionStyles: TextStyle;
  email: string;
  links: ContactLink[];
}

export interface DetailsContent {
  type: "details";
  visible: boolean;
  content: {
    name: string;
    position: string;
    email: string;
    location: string;
    portfolioLink: string;
  };
}

export interface EducationEntry {
  start: string;
  end: string | null;
  title: string;
  subtitle: string;
  details: string[];
}

export interface EducationContent {
  type: "education";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles?: TextStyle;
  content: EducationEntry[];
}

export interface QualificationContent {
  type: "qualification";
  visible: boolean;
  sectionName: string;
  sectionTitle: string;
  content: string[];
}

export interface PortfolioContent {
  title: string;
  details: DetailsContent;
  hero: HeroContent;
  about: AboutContent;
  skills: SkillsContent;
  experience: ExperienceContent;
  education: EducationContent;
  qualification: QualificationContent;
  projects: ProjectsContent;
  contact: ContactContent;
}

// Sections are resolved by their `type` key, not array position; a bad JSON throws at build.
const portfolio = parsePortfolio(rawContent);

export function getPortfolioContent(): PortfolioContent {
  return portfolio;
}
