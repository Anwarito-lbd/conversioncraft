// Stubbed service: replace with your production Gemini integration.
// For now it simulates an async analysis response.

export async function analyzeCompetitor(url: string) {
  if (!url || !url.startsWith("http")) {
    throw new Error("Please provide a valid URL starting with http(s)://");
  }

  // Simulate network / LLM latency
  await new Promise((r) => setTimeout(r, 900));

  // Return a mocked intelligence brief — replace with real Gemini call
  return {
    url,
    title: "Example Store — Mock Intelligence",
    riskScore: 68,
    insights: [
      "Heavy social ad spend on short-form video.",
      "Focuses on 4 primary hooks: convenience, social proof, scarcity, and pricing.",
      "Landing page uses bold copy + single product funnel pattern."
    ],
    plan: [
      "Launch 3 video creatives focusing on counter-hooks (value + utility).",
      "Test lookalike audiences from top-engaging posts.",
      "Introduce scarcity messaging with timed discounts on second week."
    ]
  };
}