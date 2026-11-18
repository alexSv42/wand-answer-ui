import { useEffect, useRef, useState } from 'react';
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, Check, ChevronDown, CircleAlert, FlaskConical, Globe2, HeartHandshake, LoaderCircle, Plane, Search, ShieldCheck, Sparkles } from 'lucide-react';
import { AnswerView } from './AnswerView';
import { askQuestion, edgeCases, examples, type Scenario } from './mock';
import type { Answer } from './answer';

type RequestState =
  | { status: 'idle' }
  | { status: 'loading'; question: string }
  | { status: 'success'; question: string; answer: Answer }
  | { status: 'error'; question: string; message: string };

const exampleIcons = [CalendarDays, Globe2, HeartHandshake, Plane];

export function App() {
  const [query, setQuery] = useState('');
  const [request, setRequest] = useState<RequestState>({ status: 'idle' });
  const activeRequest = useRef<AbortController | null>(null);
  const resultHeading = useRef<HTMLHeadingElement>(null);
  const scenarioMenu = useRef<HTMLDetailsElement>(null);

  useEffect(() => () => activeRequest.current?.abort(), []);
  useEffect(() => {
    if (request.status === 'success' || request.status === 'error') {
      resultHeading.current?.focus({ preventScroll: true });
    }
  }, [request]);

  async function submit(question: string, scenario?: Scenario) {
    const trimmed = question.trim();
    if (!trimmed) return;
    activeRequest.current?.abort();
    const controller = new AbortController();
    activeRequest.current = controller;
    setQuery(trimmed);
    setRequest({ status: 'loading', question: trimmed });
    if (scenarioMenu.current) scenarioMenu.current.open = false;
    try {
      const answer = await askQuestion(trimmed, controller.signal, scenario);
      if (!controller.signal.aborted) setRequest({ status: 'success', question: trimmed, answer });
    } catch (error) {
      if (!controller.signal.aborted) {
        setRequest({ status: 'error', question: trimmed, message: error instanceof Error ? error.message : 'Something went wrong. Please try again.' });
      }
    }
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <a className="brand" href="/" aria-label="Wand Knowledge home">
          <img src="/favicon.svg" width="32" height="32" alt="" />
          <span className="wordmark">wand</span><span className="brand-divider" /><span className="brand-product">Knowledge</span>
        </a>
        <span className="workspace-badge"><span className="status-dot" />Sample workspace</span>
      </header>

      <main id="main" className={`workspace ${request.status !== 'idle' ? 'has-result' : ''}`}>
        <section className="intro" aria-labelledby="page-title">
          <div className="eyebrow"><span className="eyebrow-line" /> LESS SEARCHING. MORE KNOWING.</div>
          <h1 id="page-title">Good questions.{' '}<br /><span>Grounded answers.</span></h1>
          <p>Your company knowledge, with the sources to back it up.<br className="desktop-break" /> Ask a question. See the evidence. Know what’s missing.</p>
        </section>

        <form className="question-form" onSubmit={(event) => { event.preventDefault(); void submit(query); }}>
          <label htmlFor="question" className="sr-only">Your question</label>
          <div className="question-input-row">
            <Search size={22} aria-hidden="true" />
            <textarea
              id="question"
              name="question"
              placeholder="What would you like to know?"
              value={query}
              maxLength={1000}
              rows={2}
              required
              aria-describedby="question-hint"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
                  event.preventDefault();
                  void submit(query);
                }
              }}
            />
          </div>
          <div className="question-footer">
            <span id="question-hint" className="input-hint">{query.length > 900 ? `${query.length} / 1,000 characters` : <><kbd>↵</kbd> to ask <span className="hint-divider">·</span> Shift + Enter for a new line</>}</span>
            <button className="button button-primary" type="submit" disabled={!query.trim()}>
              Ask question {request.status === 'loading' ? <LoaderCircle size={17} className="spin" aria-hidden="true" /> : <ArrowUpRight size={17} aria-hidden="true" />}
            </button>
          </div>
        </form>

        {request.status === 'idle' ? (
          <section className="examples" aria-labelledby="examples-title">
            <div className="section-label-row"><h2 id="examples-title">A good place to start</h2><span>Try an example</span></div>
            <div className="example-grid">
              {examples.map((example, index) => {
                const Icon = exampleIcons[index];
                return <button className="example-card" key={example.id} onClick={() => void submit(example.query, example.id)}>
                  <span className={`example-icon example-icon-${index}`}><Icon size={19} aria-hidden="true" /></span>
                  <span><span className="example-category">{example.category}</span><span className="example-question">{example.query}</span></span>
                  <ArrowRight size={16} className="example-arrow" aria-hidden="true" />
                </button>;
              })}
            </div>
          </section>
        ) : (
          <section className="result-region" aria-labelledby="result-title" aria-busy={request.status === 'loading'}>
            <div className="section-label-row result-label"><h2 id="result-title" tabIndex={-1} ref={resultHeading}>{request.status === 'error' ? 'Let’s try that again' : 'Your answer'}</h2><span><BookOpen size={14} aria-hidden="true" /> Knowledge workspace</span></div>
            <p className="submitted-question">{request.question}</p>
            {request.status === 'loading' && <div className="loading-card" role="status">
              <span className="loading-icon"><Sparkles size={22} aria-hidden="true" /></span>
              <p>Loading your answer<span className="loading-dots">…</span></p>
              <span className="skeleton" /><span className="skeleton" /><span className="skeleton skeleton-short" />
              <button className="text-button cancel-button" onClick={() => { activeRequest.current?.abort(); setRequest({ status: 'idle' }); }}>Cancel request</button>
            </div>}
            {request.status === 'error' && <div className="error-card" role="alert">
              <CircleAlert size={24} aria-hidden="true" /><div><h3>We couldn’t load this answer</h3><p>{request.message}</p><button className="button button-secondary" onClick={() => void submit(request.question)}>Try again <ArrowRight size={16} aria-hidden="true" /></button></div>
            </div>}
            {request.status === 'success' && <AnswerView answer={request.answer} />}
            {request.status !== 'loading' && <button className="text-button start-over" onClick={() => { activeRequest.current?.abort(); setQuery(''); setRequest({ status: 'idle' }); document.getElementById('question')?.focus(); }}>Explore another question <ArrowUpRight size={15} aria-hidden="true" /></button>}
          </section>
        )}

        <section className="trust-strip" aria-label="How this workspace works">
          <div><BookOpen size={18} aria-hidden="true" /><span>Sources you can inspect</span></div>
          <div><ShieldCheck size={18} aria-hidden="true" /><span>Uncertainty made clear</span></div>
          <div><Check size={18} aria-hidden="true" /><span>You stay in the loop</span></div>
        </section>

        <footer className="page-footer">
          <p>Demo workspace <span>·</span> Prewritten answers. No live AI or connected services.</p>
          <details className="scenario-menu" ref={scenarioMenu}>
            <summary><FlaskConical size={14} aria-hidden="true" /> Explore demo scenarios <ChevronDown size={14} aria-hidden="true" /></summary>
            <div className="scenario-content">
              <p>Check how the interface handles incomplete data and failures. Everything stays in this browser.</p>
              <div className="scenario-buttons">
                {[...examples.map((example) => ({ ...example, label: example.category })), ...edgeCases].map((scenario) => <button key={scenario.id} onClick={() => void submit(scenario.query, scenario.id)}>{scenario.label}<ArrowUpRight size={13} aria-hidden="true" /></button>)}
              </div>
            </div>
          </details>
        </footer>
      </main>
      <div className="sr-only" role="status" aria-live="polite">{request.status === 'success' ? 'Answer ready. Review the answer and its sources below.' : request.status === 'error' ? 'The answer could not be loaded.' : ''}</div>
    </>
  );
}
