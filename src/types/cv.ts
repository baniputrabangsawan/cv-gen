export const SECTION_IDS = [
  "summary",
  "experience",
  "education",
  "skills",
  "awards",
  "certifications",
  "languages",
  "projects",
  "volunteer",
] as const;

export type SectionId = (typeof SECTION_IDS)[number];
export type TemplateId = "ats" | "professional" | "modern" | "minimal" | "creative" | "academic";
export type Locale = "id" | "en";
export type Density = "compact" | "normal" | "loose";
export type MarginPreset = 12 | 16 | 20;
export type FontFamily = "Helvetica" | "Times-Roman" | "Courier";

export interface PersonalInfo {
  fullName: string;
  role: string;
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  photo?: string;
}

export interface ExperienceItem {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
}

export interface EducationItem {
  id: string;
  degree: string;
  school: string;
  location: string;
  startDate: string;
  endDate: string;
  description: string;
}

export interface SkillCategory { id: string; name: string; items: string[] }
export interface LanguageItem { id: string; name: string; level: string }
export interface ProjectItem { id: string; name: string; url: string; description: string }
export interface AwardItem { id: string; title: string; issuer: string; date: string; description: string; url: string }
export interface CertificationItem { id: string; name: string; issuer: string; date: string; expiryDate: string; credentialId: string; url: string }
export interface VolunteerItem { id: string; organization: string; role: string; startDate: string; endDate: string; current: boolean; description: string }

export interface CVContent {
  personal: PersonalInfo;
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: SkillCategory[];
  awards: AwardItem[];
  languages: LanguageItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  volunteer: VolunteerItem[];
}

export interface DesignSettings {
  accentColor: string;
  textColor: string;
  borderColor: string;
  fontFamily: FontFamily;
  fontScale: number;
  marginPreset: MarginPreset;
  density: Density;
  showPhoto: boolean;
}

export interface CVDocument {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  schemaVersion: 2;
  templateId: TemplateId;
  content: CVContent;
  design: DesignSettings;
  sectionOrder: SectionId[];
  hiddenSections: SectionId[];
  sectionTitles: Record<SectionId, string>;
}

export interface BackupPayload {
  app: "CVKita";
  schemaVersion: 2;
  exportedAt: string;
  documents: CVDocument[];
}
