// src/services/geminiService.ts

// If you deploy to the web later, change this URL to your live backend URL.
const API_URL = "http://localhost:3000/api/analyze";

export async function analyzeCompetitor(url: string) {
  if (!url || !url.startsWith("http")) {
    throw new Error("Please provide a valid URL starting with http(s)://");
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Analysis failed on the server.");
    }

    return data;

  } catch (error: any) {
    console.error("Service Error:", error);
    // Customize this message to help the user debug
    throw new Error(
      error.message === "Failed to fetch" 
      ? "Could not connect to server. Is 'node server.js' running?" 
      : error.message
    );
  }
}
