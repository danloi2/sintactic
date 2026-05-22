/**
 * Language-specific syntactic rules for Spanish.
 * 
 * Rule 1 (Auto-correction): If the user selects "Sujeto", a Nominal Phrase (SN) is assumed.
 * Rule 2 (Auto-correction): If the user selects "Predicado", a Verbal Phrase (SV) is assumed.
 */
export function applyPedagogicalRules(tagId: string, functionTagId?: string) {
  let finalTagId = tagId;
  let finalFunctionTagId = functionTagId;

  if (tagId === "sujeto" || functionTagId === "sujeto") {
    finalTagId = "sn";
    finalFunctionTagId = "sujeto";
  } else if (tagId === "predicado" || functionTagId === "predicado") {
    finalTagId = "sv";
    finalFunctionTagId = "predicado";
  }

  return { finalTagId, finalFunctionTagId };
}
