import assert from "node:assert/strict";
import test from "node:test";

// @ts-expect-error Node strip-types tests require the .ts extension.
import { applyPublicAllergenPolicy, bakeryAllergenDisclosure } from "./allergen-policy.ts";

test("published dietary claims are replaced with the shared-kitchen policy", () => {
  const input = [{ question: "Do you offer gluten-free macarons?", answer: "Yes, safe for everyone." }];
  const [result] = applyPublicAllergenPolicy(input);
  assert.equal(result.answer, bakeryAllergenDisclosure);
  assert.doesNotMatch(result.question, /gluten/i);
  assert.match(result.answer, /wheat, eggs, dairy, and nuts/);
  assert.match(result.answer, /not suitable for celiac disease or severe allergies/);
  assert.equal(input[0].answer, "Yes, safe for everyone.");
});

test("unrelated FAQs are preserved and a missing policy remains visible", () => {
  const ordering = { question: "When should I order?", answer: "Allow two weeks." };
  assert.deepEqual(applyPublicAllergenPolicy([ordering]), [ordering, {
    question: "What should I know about ingredients and allergens?",
    answer: bakeryAllergenDisclosure,
  }]);
});

test("dietary entries cannot duplicate or contradict the public policy", () => {
  const result = applyPublicAllergenPolicy([
    { question: "Ingredients?", answer: "Almond-flour-based and gluten free." },
    { question: "Dietary restrictions?", answer: "Ask about allergies." },
    { question: "Do you offer dairy-free or egg-free cakes?", answer: "Yes." },
    { question: "Free from nuts?", answer: "Yes." },
  ]);
  assert.equal(result.length, 1);
  assert.equal(result[0].answer, bakeryAllergenDisclosure);
  assert.deepEqual(applyPublicAllergenPolicy(result), result);
});
