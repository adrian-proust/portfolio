export type ProjectCategory = 'Professional' | 'Student' | 'Personal';

export type DesignShowcaseItem = {
  projectId: string;
  title: string;
  description: string;
} & (
  | { image: string; imageAlt: string; presentation?: never }
  | { presentation: true; image?: never; imageAlt?: never }
);

export type Presentation = { title: string; embedUrl: string; url: string; description?: string };

export type Project = {
  id: string; // unique slug e.g. "bastos"
  title: string;
  duration: string; // e.g. "8 months (Oct 2024 - May 2025)"
  role: string; // e.g. "Intern / Freelance"
  tags: string[]; // e.g. ["Game Design", "Multiplayer"]
  category: ProjectCategory;
  hidden?: boolean;
  description: string;
  image: string; // path under public/, e.g. "/projects/tidebound.svg"
  imageAlt: string;
  longDescription?: string[];
  overviewVideo?: { title: string; src: string; description: string };
  highlights?: string[];
  medium?: string;
  presentations?: Presentation[];
  presentationsAfterContext?: boolean;
  trailer?: { title: string; src: string; poster: string; featured?: boolean; autoplayMuted?: boolean };
  context?: string;
  sections?: { title: string; items: { title: string; paragraphs: string[] }[] }[];
  team?: { name: string; role: string; url?: string }[];
  credits?: string;
  links?: { label: string; url: string; featuredVideo?: boolean }[];
  showResources?: boolean;
  media?: { type: 'image' | 'video'; src: string; alt: string; caption?: string; poster?: string; permanentlyMuted?: boolean }[];
  linkUrl?: string;
  linkLabel?: string;
};

export type Experience = {
  title: string; // e.g. "Game Design Intern"
  company: string;
  duration: string;
  project?: string;
  bullets: string[];
};

export type Education = {
  degree: string;
  school: string;
  duration: string;
  detail: string;
};

export type Skill = {
  name: string;
  detail: string;
};

export type SectionId = 'Home' | 'Projects' | 'AboutMe';

export type NavSection = {
  id: SectionId;
  label: string;
};

export type SocialLink = {
  label: string;
  url: string;
  icon: 'linkedin' | 'artstation';
};
