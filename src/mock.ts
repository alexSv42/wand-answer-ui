import { answerSchema, type SourceDocument } from './answer';

export const documents: SourceDocument[] = [
  {
    id: 'people-handbook',
    title: 'People handbook',
    collection: 'People & culture',
    updated: '2026-09-02',
    body: 'Our approach to time off\n\nRest is part of doing good work. We encourage everyone to take their annual leave throughout the year.\n\nFull-time employees receive 25 days of paid annual leave per calendar year, in addition to local public holidays. Leave is prorated for employees joining partway through the year.\n\nUp to 5 unused days may be carried into the next calendar year and must be used by March 31. Any additional carryover requires written approval from People Operations.\n\nFor individual circumstances, speak with your People partner.',
  },
  {
    id: 'time-off',
    title: 'Booking time off',
    collection: 'People & culture',
    updated: '2026-08-14',
    body: 'Planning your time away\n\nDiscuss your plans with your team so there is enough cover while you are away.\n\nSubmit annual leave requests in the HR portal at least two weeks in advance. Your manager must approve the request before you make travel arrangements.\n\nIf you need to take leave at short notice, contact your manager directly.',
  },
  {
    id: 'remote-work',
    title: 'Remote work guidelines',
    collection: 'Ways of working',
    updated: '2026-07-20',
    body: 'Working well, wherever you are\n\nEmployees may work remotely within their country of employment, with their manager’s agreement. Keep your working hours visible and attend your team’s core collaboration hours.\n\nThese guidelines cover domestic remote work only. International working arrangements are not addressed in this document.',
  },
  {
    id: 'team-offsite',
    title: 'Team offsite notes',
    collection: 'Company updates',
    updated: '2026-06-10',
    body: 'A week together\n\nThe team met in Lisbon for our summer offsite. Sessions focused on product planning, cross-team collaboration, and celebrating the quarter’s work.\n\nThe travel team coordinated flights and hotels for the event. These notes do not define an employee travel or reimbursement policy.',
  },
];

function citation(id: string, docId: string, snippet: string) {
  return { id, docId, snippet, sourceOffset: documents.find((doc) => doc.id === docId)!.body.indexOf(snippet) };
}

const annualLeave = {
  answer: 'Full-time employees receive 25 days of paid annual leave per year, plus local public holidays. Your allowance is prorated if you join during the year.\n\nYou can carry over up to 5 unused days, to be taken by March 31. Submit leave requests in the HR portal at least two weeks ahead and wait for your manager’s approval before booking travel.',
  confidence: 0.94,
  citations: [
    citation('leave-allowance', 'people-handbook', 'Full-time employees receive 25 days of paid annual leave per calendar year, in addition to local public holidays. Leave is prorated for employees joining partway through the year.'),
    citation('leave-request', 'time-off', 'Submit annual leave requests in the HR portal at least two weeks in advance. Your manager must approve the request before you make travel arrangements.'),
    citation('leave-carryover', 'people-handbook', 'Up to 5 unused days may be carried into the next calendar year and must be used by March 31. Any additional carryover requires written approval from People Operations.'),
  ],
  missing_info: false,
  suggestions: [],
};

export const examples = [
  { id: 'high', category: 'Time off', query: 'What is our annual leave policy?' },
  { id: 'low', category: 'Remote work', query: 'Can I work from another country?' },
  { id: 'missing', category: 'Benefits', query: 'What is our parental leave policy?' },
  { id: 'irrelevant', category: 'Travel', query: 'What is our travel allowance?' },
] as const;

export const edgeCases = [
  { id: 'no-citations', label: 'No citations', query: 'What if an answer has no citations?' },
  { id: 'missing-source', label: 'Unavailable source', query: 'What if a source document is unavailable?' },
  { id: 'invalid-offset', label: 'Invalid source offset', query: 'What if a source highlight is unavailable?' },
  { id: 'empty-snippet', label: 'Empty source snippet', query: 'What if a citation has no excerpt?' },
  { id: 'zero', label: 'Zero confidence', query: 'What does zero confidence look like?' },
  { id: 'unknown-confidence', label: 'Unknown confidence', query: 'What if confidence is not supplied?' },
  { id: 'conflicting', label: 'High confidence, missing info', query: 'Can a confident answer still be incomplete?' },
  { id: 'optional-fields', label: 'Absent optional fields', query: 'What if optional fields are absent?' },
  { id: 'error', label: 'Service error', query: 'What is our annual leave policy?' },
  { id: 'invalid', label: 'Invalid response', query: 'What is our annual leave policy?' },
  { id: 'slow', label: 'Slow request', query: 'What is our annual leave policy?' },
] as const;

export type Scenario = typeof examples[number]['id'] | typeof edgeCases[number]['id'];

const fixtures: Record<Exclude<Scenario, 'error' | 'invalid'>, unknown> = {
  high: annualLeave,
  low: {
    answer: 'Domestic remote work is allowed with your manager’s agreement. The available guidelines do not establish whether you can work from another country, for how long, or which approvals you would need.',
    confidence: 0.42,
    citations: [citation('remote-scope', 'remote-work', 'These guidelines cover domestic remote work only. International working arrangements are not addressed in this document.')],
    missing_info: true,
    note: 'The international remote-work policy is missing. Confirm the requirements with People Operations before making plans.',
    suggestions: [{ label: 'Request international remote-work policy', action: 'request-remote-policy' }],
  },
  missing: {
    answer: '',
    confidence: null,
    citations: null,
    missing_info: true,
    note: 'There is no parental leave policy in this sample knowledge base. An allowance or eligibility rule cannot be established from the available documents.',
    suggestions: [{ label: 'Request parental leave policy', action: 'request-parental-policy' }],
  },
  irrelevant: {
    answer: '',
    confidence: 0.18,
    citations: [citation('offsite-travel', 'team-offsite', 'The travel team coordinated flights and hotels for the event. These notes do not define an employee travel or reimbursement policy.')],
    missing_info: true,
    note: 'The retrieved offsite notes mention travel, but do not specify an allowance or reimbursement rules. This source does not answer your question.',
    suggestions: [{ label: 'Request travel & expenses policy', action: 'request-travel-policy' }],
  },
  'no-citations': { ...annualLeave, citations: null },
  'missing-source': { ...annualLeave, citations: [{ ...annualLeave.citations[0], docId: 'unavailable-document' }] },
  'invalid-offset': { ...annualLeave, citations: [{ ...annualLeave.citations[0], sourceOffset: -12 }] },
  'empty-snippet': { ...annualLeave, citations: [{ ...annualLeave.citations[0], snippet: '' }] },
  zero: { answer: 'The available information does not establish an answer to this question.', confidence: 0, missing_info: true },
  'unknown-confidence': { ...annualLeave, confidence: null },
  conflicting: { ...annualLeave, missing_info: true, note: 'The general allowance is documented, but country-specific exceptions are missing.', suggestions: [{ label: 'Request local leave addendum', action: 'request-local-addendum' }] },
  'optional-fields': { answer: 'This is an answer with optional metadata omitted.' },
  slow: annualLeave,
};

function matchScenario(query: string): Scenario {
  if (/parent|maternity|paternity/i.test(query)) return 'missing';
  if (/remote|country|abroad|international/i.test(query)) return 'low';
  if (/travel|expense|reimburse/i.test(query)) return 'irrelevant';
  if (/annual|vacation|holiday|time off|pto/i.test(query)) return 'high';
  return 'missing';
}

export async function askQuestion(query: string, signal: AbortSignal, scenario?: Scenario) {
  const selected = scenario ?? matchScenario(query);
  await new Promise<void>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException('Request cancelled', 'AbortError'));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', abort);
      resolve();
    }, selected === 'slow' ? 5000 : 650);
    if (signal.aborted) abort();
    else signal.addEventListener('abort', abort, { once: true });
  });
  if (selected === 'error') throw new Error('The answer service is temporarily unavailable. Please try again.');
  const raw = selected === 'invalid' ? { answer: 123, confidence: 8 } : fixtures[selected];
  const parsed = answerSchema.safeParse(raw);
  if (!parsed.success) throw new Error('The answer service returned an unexpected response. Please try again.');
  if (!scenario && selected === 'missing' && !/parent|maternity|paternity/i.test(query)) {
    return answerSchema.parse({ answer: '', missing_info: true, note: 'This sample workspace has no information that answers your question. Try one of the example questions, or request the relevant documentation.', suggestions: [{ label: 'Request relevant documentation', action: 'request-documentation' }] });
  }
  return parsed.data;
}
