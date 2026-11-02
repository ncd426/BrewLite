import { BadRequestException } from '@nestjs/common';
import {
  buildIngredientRequirements,
  isRecipeInStock,
  validateIngredientAvailability,
  type RecipeProduct,
} from './recipe-inventory';

const product = (
  id: number,
  ingredientId: number,
  quantity: number,
  stockQuantity: number,
  isOptional = false,
): RecipeProduct => ({
  id,
  productIngredients: [{
    ingredientId,
    quantity,
    isOptional,
    ingredient: { name: `Ingredient ${ingredientId}`, stockQuantity },
  }],
});

describe('recipe inventory calculations', () => {
  it('derives availability from required ingredients and ignores optional ingredients', () => {
    const recipe = [
      ...product(1, 1, 30, 30).productIngredients,
      ...product(1, 2, 5, 0, true).productIngredients,
    ];

    expect(isRecipeInStock(recipe)).toBe(true);
    expect(isRecipeInStock(product(1, 1, 30, 29).productIngredients)).toBe(false);
    expect(isRecipeInStock([])).toBe(false);
  });

  it('aggregates shared ingredients across all requested products and quantities', () => {
    const products = new Map([
      [1, product(1, 10, 30, 100)],
      [2, product(2, 10, 40, 100)],
    ]);
    const requirements = buildIngredientRequirements(
      new Map([[1, 2], [2, 1]]),
      products,
    );

    expect(requirements).toEqual([{
      ingredientId: 10,
      ingredientName: 'Ingredient 10',
      quantity: 100,
      stockQuantity: 100,
    }]);
    expect(() => validateIngredientAvailability(requirements)).not.toThrow();
  });

  it('rejects orders without a recipe or with insufficient ingredient stock', () => {
    expect(() => buildIngredientRequirements(
      new Map([[1, 1]]),
      new Map([[1, { id: 1, productIngredients: [] }]]),
    )).toThrow(BadRequestException);

    const requirements = buildIngredientRequirements(
      new Map([[1, 2]]),
      new Map([[1, product(1, 10, 30, 50)]]),
    );
    expect(() => validateIngredientAvailability(requirements)).toThrow(
      'Insufficient stock for ingredient Ingredient 10',
    );
  });
});