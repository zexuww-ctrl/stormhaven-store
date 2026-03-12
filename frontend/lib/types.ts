export type Product = {
  _id: string;
  name: string;
  category: 'rank' | 'crate' | 'bundle';
  description: string;
  price: number;
  image: string;
  commands: string[];
  perks?: string[];
};

export type Purchase = {
  _id: string;
  playerName: string;
  productName: string;
  total: number;
  createdAt: string;
};
