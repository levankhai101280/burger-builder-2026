
export type IngredientType = 'salad' | 'bacon' | 'cheese' | 'meat';

export interface Layer {
  type: IngredientType;
}

export interface BurgerOrder {
  id: number;
  layers: Layer[];
  price: number;
}