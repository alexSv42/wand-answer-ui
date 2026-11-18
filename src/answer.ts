import { z } from 'zod';

const citationSchema = z.object({
  id: z.string().min(1),
  docId: z.string().min(1),
  snippet: z.string(),
  sourceOffset: z.number().int().nullish(),
});

export const answerSchema = z.object({
  answer: z.string().nullish().transform((value) => value ?? ''),
  confidence: z.number().min(0).max(1).nullish(),
  citations: z.array(citationSchema).nullish().transform((value) => value ?? []),
  missing_info: z.boolean().nullish(),
  note: z.string().nullish(),
  suggestions: z.array(z.object({
    label: z.string().min(1),
    action: z.string().min(1),
  })).nullish().transform((value) => value ?? []),
});

export type Answer = z.infer<typeof answerSchema>;
export type Citation = z.infer<typeof citationSchema>;
export type SourceDocument = {
  id: string;
  title: string;
  collection: string;
  updated: string;
  body: string;
};

export function isIncomplete(answer: Answer) {
  return answer.missing_info === true || !answer.answer.trim();
}

export function getSourceParts(source: SourceDocument, citation: Citation) {
  const offset = citation.sourceOffset ?? -1;
  const end = offset + citation.snippet.length;
  if (offset < 0 || !citation.snippet || source.body.slice(offset, end) !== citation.snippet) {
    return null;
  }
  return [source.body.slice(0, offset), citation.snippet, source.body.slice(end)] as const;
}
