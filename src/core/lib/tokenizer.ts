import { Token, AppLanguage } from "../types";
import { v4 as uuidv4 } from "uuid";

/**
 * Converts a plain text phrase into an array of interactive Tokens.
 * Both ES and EU modes return one token per letter, with letters of the same word grouped by wordId.
 * Explicitly excludes whitespace to prevent students from selecting spaces.
 *
 * @param phrase The phrase entered by the user
 * @param lang   The active language mode (es or eu)
 * @returns Array of tokens ready for analysis
 */
export function tokenize(phrase: string, _lang: AppLanguage = "es"): Token[] {
  if (!phrase.trim()) {
    return [];
  }

  const tokens: Token[] = [];
  const rawWords = phrase.split(/\s+/).filter((w) => w.length > 0);
  let currentIndex = 0;

  for (const word of rawWords) {
    const actualIndex = phrase.indexOf(word, currentIndex);
    const wordId = uuidv4();

    // Both ES and EU: split into individual letters
    word.split("").forEach((char, i) => {
      tokens.push({
        id: uuidv4(),
        text: char,
        startIndex: actualIndex + i,
        endIndex: actualIndex + i + 1,
        line: 1,
        column: actualIndex + i,
        isLetter: true,
        wordId,
      });
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
