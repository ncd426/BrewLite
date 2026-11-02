import { INGREDIENTS, RECIPES } from './seed-data.mjs';

export async function seedIngredientRecipes(
  prisma,
  productsByName,
  { initializeEmptyStock = false } = {},
) {
  const ingredientsByCode = new Map();
  let ingredientsCreated = 0;
  let ingredientsInitialized = 0;
  let recipesCreated = 0;

  for (const fixture of INGREDIENTS) {
    let ingredient = await prisma.ingredient.findUnique({
      where: { code: fixture.code },
    });
    if (!ingredient) {
      ingredient = await prisma.ingredient.create({ data: fixture });
      ingredientsCreated++;
    } else if (initializeEmptyStock && ingredient.stockQuantity === 0) {
      ingredient = await prisma.ingredient.update({
        where: { id: ingredient.id },
        data: {
          stockQuantity: fixture.stockQuantity,
          minStock: fixture.minStock,
        },
      });
      ingredientsInitialized++;
    }
    ingredientsByCode.set(fixture.code, ingredient);
  }

  for (const fixture of RECIPES) {
    const product = productsByName.get(fixture.productName);
    const ingredient = ingredientsByCode.get(fixture.ingredientCode);
    if (!product || !ingredient) continue;

    const existing = await prisma.productIngredient.findUnique({
      where: {
        productId_ingredientId: {
          productId: product.id,
          ingredientId: ingredient.id,
        },
      },
    });
    if (!existing) {
      await prisma.productIngredient.create({
        data: {
          productId: product.id,
          ingredientId: ingredient.id,
          quantity: fixture.quantity,
          isOptional: fixture.isOptional,
        },
      });
      recipesCreated++;
    }
  }

  return { ingredientsCreated, ingredientsInitialized, recipesCreated };
}