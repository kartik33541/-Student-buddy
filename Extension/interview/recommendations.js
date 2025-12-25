// interview/recommendations.js

function shuffle(array) {
  return array
    .map(v => ({ v, r: Math.random() }))
    .sort((a, b) => a.r - b.r)
    .map(o => o.v);
}

const RECOMMENDATION_POOL = {
  "edge cases": [
    { id: 217, title: "Contains Duplicate", slug: "contains-duplicate" },
    { id: 268, title: "Missing Number", slug: "missing-number" },
    { id: 66, title: "Plus One", slug: "plus-one" },
    { id: 169, title: "Majority Element", slug: "majority-element" },
    { id: 136, title: "Single Number", slug: "single-number" },
    { id: 287, title: "Find the Duplicate Number", slug: "find-the-duplicate-number" },
    { id: 189, title: "Rotate Array", slug: "rotate-array" },
    { id: 485, title: "Max Consecutive Ones", slug: "max-consecutive-ones" }
  ],

  "time complexity": [
    { id: 1, title: "Two Sum", slug: "two-sum" },
    { id: 560, title: "Subarray Sum Equals K", slug: "subarray-sum-equals-k" },
    { id: 121, title: "Best Time to Buy and Sell Stock", slug: "best-time-to-buy-and-sell-stock" },
    { id: 53, title: "Maximum Subarray", slug: "maximum-subarray" },
    { id: 238, title: "Product of Array Except Self", slug: "product-of-array-except-self" },
    { id: 209, title: "Minimum Size Subarray Sum", slug: "minimum-size-subarray-sum" },
    { id: 704, title: "Binary Search", slug: "binary-search" }
  ],

  "space optimization": [
    { id: 238, title: "Product of Array Except Self", slug: "product-of-array-except-self" },
    { id: 448, title: "Find All Numbers Disappeared in an Array", slug: "find-all-numbers-disappeared-in-an-array" },
    { id: 287, title: "Find the Duplicate Number", slug: "find-the-duplicate-number" },
    { id: 75, title: "Sort Colors", slug: "sort-colors" },
    { id: 442, title: "Find All Duplicates in an Array", slug: "find-all-duplicates-in-an-array" }
  ],

  "communication": [
    { id: 78, title: "Subsets", slug: "subsets" },
    { id: 46, title: "Permutations", slug: "permutations" },
    { id: 39, title: "Combination Sum", slug: "combination-sum" },
    { id: 17, title: "Letter Combinations of a Phone Number", slug: "letter-combinations-of-a-phone-number" },
    { id: 22, title: "Generate Parentheses", slug: "generate-parentheses" }
  ],

  "problem understanding": [
    { id: 53, title: "Maximum Subarray", slug: "maximum-subarray" },
    { id: 152, title: "Maximum Product Subarray", slug: "maximum-product-subarray" },
    { id: 198, title: "House Robber", slug: "house-robber" },
    { id: 322, title: "Coin Change", slug: "coin-change" },
    { id: 70, title: "Climbing Stairs", slug: "climbing-stairs" }
  ]
};

export function generateRecommendations(focusAreas) {
  const collected = [];

  focusAreas.forEach(area => {
    Object.keys(RECOMMENDATION_POOL).forEach(key => {
      if (area.toLowerCase().includes(key)) {
        collected.push(...RECOMMENDATION_POOL[key]);
      }
    });
  });

  // fallback if nothing matched
  if (collected.length === 0) {
    collected.push(
      ...RECOMMENDATION_POOL["time complexity"],
      ...RECOMMENDATION_POOL["edge cases"]
    );
  }

  // Remove duplicates by problem id
  const unique = Array.from(
    new Map(collected.map(p => [p.id, p])).values()
  );

  // Shuffle and return 3
  return shuffle(unique).slice(0, 3);
}
