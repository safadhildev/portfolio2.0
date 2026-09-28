import rawContent from "@/content/portfolio.json";

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
  sectionNumber: number;
  sectionName: string;
  sectionTitle: string;
  sectionTitleStyles: TextStyle;
  content: string;
}

export interface SkillsContent {
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

export interface ProjectsContent {
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
  projects: ProjectsContent;
  contact: ContactContent;
}

type RawSections = [HeroContent, AboutContent, SkillsContent, ProjectsContent, ContactContent];

const [hero, about, skills, projects, contact] = rawContent.sections as unknown as RawSections;

export function getPortfolioContent(): PortfolioContent {
  return {
    title: rawContent.title,
    hero,
    about,
    skills,
    projects,
    contact,
  };
}
