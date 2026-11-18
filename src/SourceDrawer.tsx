import { useEffect, useRef } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, FileText, Quote, X } from 'lucide-react';
import { getSourceParts, type Citation } from './answer';
import { documents } from './mock';

type Props = {
  citations: Citation[];
  selected: number;
  onSelect: (index: number) => void;
  onClose: () => void;
};

export function SourceDrawer({ citations, selected, onSelect, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const content = useRef<HTMLDivElement>(null);
  const citation = citations[selected];
  const source = documents.find((doc) => doc.id === citation.docId);
  const parts = source ? getSourceParts(source, citation) : null;

  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
  }, []);
  useEffect(() => { content.current?.scrollTo(0, 0); }, [selected]);

  function close() { dialog.current?.close(); }

  return (
    <dialog className="source-drawer" ref={dialog} aria-labelledby="source-title" aria-describedby="source-description" onClose={onClose}
      onClick={(event) => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={(event) => {
        if (event.key === 'ArrowLeft' && selected > 0) { event.preventDefault(); onSelect(selected - 1); }
        if (event.key === 'ArrowRight' && selected < citations.length - 1) { event.preventDefault(); onSelect(selected + 1); }
      }}>
      <div className="drawer-header">
        <span><BookOpen size={17} aria-hidden="true" /> Source {selected + 1} of {citations.length}</span>
        <button className="icon-button" onClick={close} aria-label="Close source" autoFocus><X size={20} aria-hidden="true" /></button>
      </div>
      <div className="drawer-content" ref={content} tabIndex={0} role="region" aria-labelledby="source-title">
        <span className="document-icon"><FileText size={24} aria-hidden="true" /></span>
        <p className="eyebrow drawer-eyebrow">{source?.collection ?? 'SOURCE UNAVAILABLE'}</p>
        <h2 id="source-title">{source?.title ?? 'Document not available'}</h2>
        <p id="source-description" className="document-meta">{source ? `Updated ${new Intl.DateTimeFormat('en', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' }).format(new Date(source.updated))}` : 'The citation is preserved, but its document could not be found.'}</p>
        <section className="source-excerpt" aria-labelledby="excerpt-title">
          <h3 id="excerpt-title"><Quote size={15} aria-hidden="true" /> Cited excerpt</h3>
          {citation.snippet ? <blockquote>{citation.snippet}</blockquote> : <p>No excerpt was supplied with this citation.</p>}
        </section>
        {source ? <section className="source-document" aria-labelledby="document-title">
          <div className="section-label-row"><h3 id="document-title">In the original document</h3>{parts && <span className="highlight-key"><i /> Cited passage</span>}</div>
          {!parts && <p className="source-note">{citation.snippet ? 'The excerpt could not be located at the supplied offset. The original text is shown without a highlight.' : 'Without an excerpt, a passage cannot be highlighted.'}</p>}
          <div className="document-body">{parts ? <>{parts[0]}<mark>{parts[1]}</mark>{parts[2]}</> : source.body}</div>
        </section> : <div className="source-note">You can read the supplied excerpt above, but cannot verify it against the full document here.</div>}
      </div>
      <div className="drawer-footer">
        <span>Compare the source with the answer.</span>
        <div className="source-pagination"><button className="icon-button" disabled={selected === 0} onClick={() => onSelect(selected - 1)} aria-label="Previous source"><ChevronLeft size={20} aria-hidden="true" /></button><button className="icon-button" disabled={selected === citations.length - 1} onClick={() => onSelect(selected + 1)} aria-label="Next source"><ChevronRight size={20} aria-hidden="true" /></button></div>
      </div>
    </dialog>
  );
}
