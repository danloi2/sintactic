import { Token } from "@/types";
import { v4 as uuidv4 } from "uuid";

/**
 * Converts a plain text phrase into an array of interactive Tokens.
 * Explicitly excludes whitespace to prevent students from selecting
 * "spaces" as grammatical elements, maintaining pedagogical consistency.
 * 
 * @param phrase The phrase entered by the user
 * @returns Array of tokens ready for analysis
 */
export function tokenize(phrase: string): Token[] {
  if (!phrase.trim()) {
    return [];
  }

  const tokens: Token[] = [];
  const rawWords = phrase.split(/\s+/).filter(w => w.length > 0);
  let currentIndex = 0;

  for (const word of rawWords) {
    // Find the real position in the original phrase to keep correct indices
    const actualIndex = phrase.indexOf(word, currentIndex);
    
    tokens.push({
      id: uuidv4(),
      text: word,
      startIndex: actualIndex,
      endIndex: actualIndex + word.length,
      line: 1,
      column: actualIndex,
    });

    currentIndex = actualIndex + word.length;
  }

  return tokens;
}

export function getTokenText(token: Token): string {
  return token.text;
}

export function getTokensAsText(tokens: Token[]): string {
  return tokens.map(getTokenText).join("");
}