import type { Metadata } from "next";
import { getRecipeForMetadata } from "@/lib/api/recipes-server";
import { getTranslatedName } from "@/lib/utils/translations";
import type { Locale } from "@/i18n/routing";
import RecipeDetailClient from "./RecipeDetailClient";

interface PageProps {
  params: Promise<{
    slug: string;
    locale: Locale;
  }>;
}

function extractIdFromSlug(slug: string): number {
  const match = slug.match(/^(\d+)-/);
  return match ? parseInt(match[1], 10) : NaN;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug, locale } = await params;
  const recipeId = extractIdFromSlug(slug);

  if (isNaN(recipeId)) {
    return {
      title: "Recipe not found",
    };
  }

  const recipe = await getRecipeForMetadata(recipeId);

  if (!recipe) {
    return {
      title: "Recipe not found",
    };
  }

  const recipeName = getTranslatedName(recipe.translations, recipe.name, locale);

  return {
    title: recipeName,
    description: `${recipeName} - ${recipe.base_servings} ${locale === "fr" ? "personnes" : "servings"}`,
    openGraph: {
      title: recipeName,
      description: `${recipeName} - ${recipe.base_servings} ${locale === "fr" ? "personnes" : "servings"}`,
      images: recipe.image_path ? [recipe.image_path] : undefined,
      type: "article",
    },
    twitter: {
      card: recipe.image_path ? "summary_large_image" : "summary",
      title: recipeName,
      description: `${recipeName} - ${recipe.base_servings} ${locale === "fr" ? "personnes" : "servings"}`,
      images: recipe.image_path ? [recipe.image_path] : undefined,
    },
  };
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const recipeId = extractIdFromSlug(slug);

  return <RecipeDetailClient recipeId={recipeId} />;
}
