import rawContent from "@/content/portfolio.json";
import { pickSections, validateExperience } from "./content-schema";
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
  sectionNumber: number;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  content: string;
}

export interface SkillsContent {
  type: "skills";
  sectionNumber: number;
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
  sectionNumber: number;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  content: ExperienceEntry[];
}

export interface ProjectsContent {
  type: "projects";
  sectionNumber: number;
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
  sectionNumber: number;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  sectionDescription: string;
  sectionDescriptionStyles: TextStyle;
  email: string;
  links: ContactLink[];
}

export interface PortfolioContent {
  title: string;
  hero: HeroContent;
  about: AboutContent;
  skills: SkillsContent;
  experience: ExperienceContent;
  projects: ProjectsContent;
  contact: ContactContent;
}

// Sections are resolved by their `type` key, not array position; a bad JSON throws at build.
const sections = pickSections(rawContent.sections);
const hero = sections.hero as HeroContent;
const about = sections.about as AboutContent;
const skills = sections.skills as SkillsContent;
const experience = validateExperience(sections.experience);
const projects = sections.projects as ProjectsContent;
const contact = sections.contact as ContactContent;

export function getPortfolioContent(): PortfolioContent {
  return {
    title: rawContent.title,
    hero,
    about,
    skills,
    experience,
    projects,
    contact,
  };
}
