import { expect, test } from '@playwright/test';
import { answerSchema, getSourceParts, isIncomplete, type Citation, type SourceDocument } from '../src/answer';
import { askQuestion } from '../src/mock';

test('optional and null fields normalize without losing zero confidence', () => {
  const answer = answerSchema.parse({ answer: null, confidence: 0, citations: null, suggestions: null });
  expect(answer.answer).toBe('');
  expect(answer.confidence).toBe(0);
  expect(answer.citations).toEqual([]);
  expect(answer.suggestions).toEqual([]);
  expect(answerSchema.parse({}).citations).toEqual([]);
});

test('invalid contract data is rejected at the boundary', () => {
  for (const raw of [{ answer: 123 }, { confidence: -1 }, { confidence: 1.1 }, { confidence: NaN }, { citations: [{ id: 'x' }] }]) {
    expect(answerSchema.safeParse(raw).success).toBe(false);
  }
});

test('confidence never overrides completeness', () => {
  expect(isIncomplete(answerSchema.parse({ answer: 'Partial answer', confidence: 0.99, missing_info: true }))).toBe(true);
  expect(isIncomplete(answerSchema.parse({ answer: ' \n ', missing_info: false }))).toBe(true);
  expect(isIncomplete(answerSchema.parse({ answer: 'An answer', confidence: 0.1, missing_info: false }))).toBe(false);
});

const source: SourceDocument = { id: 'doc', title: 'Document', collection: 'Test', updated: '2026-01-01', body: 'First. Exact passage. Last.' };
const citation: Citation = { id: 'citation', docId: 'doc', snippet: 'Exact passage.', sourceOffset: 7 };

test('source highlighting uses the exact supplied offset', () => {
  expect(getSourceParts(source, citation)).toEqual(['First. ', 'Exact passage.', ' Last.']);
  expect(getSourceParts(source, { ...citation, snippet: 'First.', sourceOffset: 0 })).toEqual(['', 'First.', ' Exact passage. Last.']);
});

test('invalid, absent, and mismatched offsets preserve the excerpt without guessing a highlight', () => {
  for (const sourceOffset of [-1, 9999, 8, null, undefined]) {
    expect(getSourceParts(source, { ...citation, sourceOffset })).toBeNull();
  }
  expect(getSourceParts(source, { ...citation, snippet: '' })).toBeNull();
});

test('mock requests can be cancelled before or during the delay', async () => {
  const cancelled = new AbortController();
  cancelled.abort();
  await expect(askQuestion('Annual leave', cancelled.signal)).rejects.toMatchObject({ name: 'AbortError' });
  const pending = new AbortController();
  const promise = askQuestion('Annual leave', pending.signal, 'slow');
  pending.abort();
  await expect(promise).rejects.toMatchObject({ name: 'AbortError' });
});

test('arbitrary questions do not receive an unrelated policy answer', async () => {
  const answer = await askQuestion('Who owns the moon?', new AbortController().signal);
  expect(isIncomplete(answer)).toBe(true);
  expect(answer.answer).toBe('');
  expect(answer.note).not.toContain('parental');
});
