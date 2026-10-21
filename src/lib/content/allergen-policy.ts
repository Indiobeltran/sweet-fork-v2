export const bakeryAllergenDisclosure =
  "All products are prepared in a home kitchen that processes wheat, eggs, dairy, and nuts, as well as soy and peanuts. Cross-contact is possible. Our products are not suitable for celiac disease or severe allergies.";

export const bakeryAllergenFaq = {
  question: "What should I know about ingredients and allergens?",
  answer: bakeryAllergenDisclosure,
};

type PublicFaq = { question: string; answer: string };

// Keep the owner's safety policy authoritative even when older managed FAQ
// copy promises dietary accommodations. Leave unrelated ordering answers alone.
export function applyPublicAllergenPolicy(items: readonly PublicFaq[]): PublicFaq[] {
  let included = false;
  const result: PublicFaq[] = [];
  for (const item of items) {
    if (/allerg|celiac|gluten|dietary|almond[ -]flour|\b(?:dairy|milk|eggs?|nuts?|wheat|soy|peanuts?)[ -]?free\b|\bfree[ -]from\b/i.test(`${item.question} ${item.answer}`)) {
      if (!included) result.push({ ...bakeryAllergenFaq });
      included = true;
    } else {
      result.push(item);
    }
  }
  if (!included) result.push({ ...bakeryAllergenFaq });
  return result;
}
