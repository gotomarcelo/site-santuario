export type Cta = { label: string; href: string };

export type FragmentBlock = {
  type: "fragment";
  name: string;
};

export type HeaderBlock = {
  type: "header";
  eyebrow: string;
  brand: string;
  cta: Cta;
  links: Array<{ label: string; href: string }>;
};

export type Block = FragmentBlock | HeaderBlock;

export type Page = {
  title: string;
  description: string;
  blocks: Block[];
};
