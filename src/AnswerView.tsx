import { useState } from 'react';
import { ArrowRight, ArrowUpRight, Check, ChevronDown, CircleAlert, CircleHelp, FileQuestion, FileText, Info, Plus, Sparkles } from 'lucide-react';
import { isIncomplete, type Answer } from './answer';
import { documents } from './mock';
import { SourceDrawer } from './SourceDrawer';

export function AnswerView({ answer }: { answer: Answer }) {
  const [selectedCitation, setSelectedCitation] = useState<number | null>(null);
  const [requested, setRequested] = useState<number[]>([]);
  const incomplete = isIncomplete(answer);
  const hasAnswer = Boolean(answer.answer.trim());
  const { confidence } = answer;
  const hasConfidence = confidence != null;
  const limitedConfidence = hasConfidence && confidence < 0.8;

  return <article className="answer-card">
    <div className="answer-header">
      <span className="answer-heading"><Sparkles size={19} aria-hidden="true" />{hasAnswer ? 'Answer' : 'A gap in the knowledge'}</span>
      <details className="confidence-details">
        <summary className={`confidence-badge ${hasConfidence ? limitedConfidence ? 'confidence-low' : 'confidence-high' : 'confidence-unknown'}`}>
          {hasConfidence ? limitedConfidence ? <CircleHelp size={14} aria-hidden="true" /> : <Check size={14} aria-hidden="true" /> : <Info size={14} aria-hidden="true" />}
          {hasConfidence ? `${Math.round(confidence * 100)}% confidence` : 'Confidence not supplied'}<ChevronDown size={12} aria-hidden="true" />
        </summary>
        <p>The supplied confidence score is an estimate, not a verified probability that the answer is correct. {hasConfidence ? 'Scores below 80% are shown with additional caution. ' : ''}Inspect the sources to judge the evidence.</p>
      </details>
    </div>

    {hasAnswer ? <>
      {incomplete ? <div className="notice notice-warning" role="note"><CircleAlert size={18} aria-hidden="true" /><div><strong>This answer is incomplete</strong><p>{answer.note || 'Some information is missing from the available knowledge. The answer may not cover all requirements or exceptions.'}</p></div></div>
        : limitedConfidence && <div className="notice notice-warning" role="note"><CircleHelp size={18} aria-hidden="true" /><div><strong>There’s some uncertainty here</strong><p>The supplied confidence is limited. Check the cited context before relying on this answer.</p></div></div>}
      <div className="answer-body">{answer.answer.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div>
      {!incomplete && answer.note && <p className="answer-note">{answer.note}</p>}
    </> : <div className="no-answer">
      <span className="no-answer-icon"><FileQuestion size={27} aria-hidden="true" /></span>
      <h3>We don’t have enough information yet</h3>
      <p>{answer.note || 'The available knowledge does not establish an answer to this question.'}</p>
    </div>}

    <section className="sources-section" aria-labelledby="sources-title">
      <div className="section-label-row"><h3 id="sources-title">Sources to review <span className="count-badge">{answer.citations.length}</span></h3>{answer.citations.length > 0 && <span>Open to inspect <ArrowUpRight size={13} aria-hidden="true" /></span>}</div>
      {answer.citations.length > 0 ? <>
        {(!hasAnswer || limitedConfidence) && <p className="sources-disclaimer">A retrieved source may not support an answer. Check its relevance in context.</p>}
        <div className="source-list">{answer.citations.map((citation, index) => {
          const source = documents.find((doc) => doc.id === citation.docId);
          return <button className="source-card" key={`${citation.id}-${index}`} onClick={(event) => { event.currentTarget.focus({ preventScroll: true }); setSelectedCitation(index); }} aria-label={`Open source ${index + 1}: ${source?.title ?? 'Unavailable document'}`}>
            <span className="source-number">{index + 1}</span>
            <span className="source-card-content"><span className="source-card-title">{source?.title ?? 'Unavailable document'}<span className="source-collection">{source?.collection ?? 'Document not found'}</span></span><span className="source-card-snippet">{citation.snippet || 'No excerpt supplied'}</span></span>
            <ArrowUpRight size={17} className="source-arrow" aria-hidden="true" />
          </button>;
        })}</div>
      </> : <div className="no-sources"><FileText size={18} aria-hidden="true" /><p>No sources supplied. {hasAnswer ? 'This answer cannot be verified against a source here.' : 'There are no citations to inspect for this question.'}</p></div>}
    </section>

    {incomplete && answer.suggestions.length > 0 && <section className="enrichment" aria-labelledby="enrichment-title">
      <div><span className="enrichment-icon"><Plus size={18} aria-hidden="true" /></span><div><h3 id="enrichment-title">Help fill the gap</h3><p>Bring in the missing knowledge for a more complete answer.</p></div></div>
      <div className="suggestion-list">{answer.suggestions.map((suggestion, index) => <button className="suggestion-button" key={`${suggestion.action}-${index}`} disabled={requested.includes(index)} onClick={() => setRequested((previous) => [...previous, index])}>{requested.includes(index) ? <><Check size={16} aria-hidden="true" /> Added to demo checklist</> : <>{suggestion.label}<ArrowRight size={15} aria-hidden="true" /></>}</button>)}</div>
      {requested.length > 0 && <p className="suggestion-feedback" role="status">Noted for this session. This is a demo; no request was sent and no files were uploaded.</p>}
    </section>}
    {selectedCitation !== null && <SourceDrawer citations={answer.citations} selected={selectedCitation} onSelect={setSelectedCitation} onClose={() => setSelectedCitation(null)} />}
  </article>;
}
