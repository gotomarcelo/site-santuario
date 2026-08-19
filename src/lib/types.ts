export type Cta = { label: string; href: string };

export type HeroBlock = {
  type: 'hero';
  title: string;
  description: string;
  image: string;
  cta: Cta;
};

export type CardsBlock = {
  type: 'cards';
  title: string;
  items: Array<{ title: string; description: string; href: string }>;
};

export type FaqBlock = {
  type: 'faq';
  title: string;
  items: Array<{ question: string; answer: string }>;
};

export type Block = HeroBlock | CardsBlock | FaqBlock;

export type Page = {
  title: string;
  description: string;
  blocks: Block[];
};
