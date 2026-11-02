import { BadRequestException } from '@nestjs/common';

const MAX_DATABASE_INT = 2147483647;

export type RecipeIngredient = {
  ingredientId: number;
  quantity: number;
  isOptional: boolean;
  ingredient: {
    name: string;
    stockQuantity: number;
  };
};

export type RecipeProduct = {
  id: number;
  productIngredients: RecipeIngredient[];
};

export type IngredientRequirement = {
  ingredientId: number;
  ingredientName: string;
  quantity: number;
  stockQuantity: number;
};

export function isRecipeInStock(recipeIngredients: RecipeIngredient[]) {
  const requiredIngredients = recipeIngredients.filter(
    (line) => !line.isOptional,
  );

  return (
    requiredIngredients.length > 0 &&
    requiredIngredients.every(
      (line) => line.ingredient.stockQuantity >= line.quantity,
    )
  );
}

export function buildIngredientRequirements(
  requestedQuantities: Map<number, number>,
  products: Map<number, RecipeProduct>,
): IngredientRequirement[] {
  const requirements = new Map<number, IngredientRequirement>();

  for (const [productId, productQuantity] of requestedQuantities) {
    const product = products.get(productId);
    const requiredIngredients = product?.productIngredients.filter(
      (line) => !line.isOptional,
    );

    if (!requiredIngredients?.length) {
      throw new BadRequestException(
        `Product ${productId} does not have a required recipe`,
      );
    }

    for (const line of requiredIngredients) {
      const quantity = line.quantity * productQuantity;
      const existing = requirements.get(line.ingredientId);
      const total = (existing?.quantity ?? 0) + quantity;

      if (
        !Number.isSafeInteger(total) ||
        total > MAX_DATABASE_INT
      ) {
        throw new BadRequestException(
          'Ingredient quantity exceeds supported range',
        );
      }

      requirements.set(line.ingredientId, {
        ingredientId: line.ingredientId,
        ingredientName: line.ingredient.name,
        quantity: total,
        stockQuantity: line.ingredient.stockQuantity,
      });
    }
  }

  return [...requirements.values()];
}

export function validateIngredientAvailability(
  requirements: IngredientRequirement[],
) {
  for (const requirement of requirements) {
    if (requirement.stockQuantity < requirement.quantity) {
      throw new BadRequestException(
        `Insufficient stock for ingredient ${requirement.ingredientName}`,
      );
    }
  }
}