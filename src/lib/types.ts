export type Cta = { label: string; href: string };

export type HeroBlock = {
  type: "hero";
  eyebrow: string;
  title: string;
  highlight: string;
  titleAfter: string;
  description: string;
  image: string;
  imageAlt: string;
  caption: string;
};

export type FragmentBlock = {
  type: "fragment";
  name: string;
};

export type HeaderBlock = {
  type: "header";
  logo?: string;
  eyebrow: string;
  brand: string;
  cta: Cta;
  links: Array<{ label: string; href: string }>;
};

export type MassScheduleEntry = {
  day: string;
  time: string;
};

export type MassScheduleGroup = {
  name: string;
  entries: MassScheduleEntry[];
};

export type MassScheduleBlock = {
  type: "mass-schedule";
  title: string;
  description: string;
  note: string;
  groups: MassScheduleGroup[];
};

export type Block = FragmentBlock | HeaderBlock | HeroBlock | MassScheduleBlock;

export type Page = {
  title: string;
  description: string;
  blocks: Block[];
};
