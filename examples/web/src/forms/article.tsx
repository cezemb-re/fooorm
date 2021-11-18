import { ReactElement, useCallback, useEffect, useState } from 'react';
import Paragraph, { ParagraphFields, ParagraphState } from './paragraph';

export interface Props {
  initialParagraphs?: ParagraphState[];
  onCreateParagraph?: (fields: ParagraphFields) => Promise<string | number> | string | number;
  onChangeParagraph?: (id: string | number, fields: ParagraphFields) => Promise<void> | void;
  onDeleteParagraph?: (id: string | number) => Promise<boolean> | boolean;
}

export default function ArticleForm({
  initialParagraphs,
  onCreateParagraph,
  onChangeParagraph,
  onDeleteParagraph,
}: Props): ReactElement {
  const [paragraphs, setParagraphs] = useState<ParagraphState[]>(initialParagraphs || []);

  const createNewParagraph = useCallback((): ParagraphState => {
    return {
      key: Math.random().toString(36).substr(2, 10),
      type: 'rich-text',
    };
  }, []);

  useEffect(() => {
    if (!paragraphs.length || paragraphs[paragraphs.length - 1].id) {
      const nextParagraphs = [...paragraphs, createNewParagraph()];
      setParagraphs(nextParagraphs);
    }
  }, [createNewParagraph, paragraphs]);

  const changeParagraph = useCallback(
    async (paragraph: ParagraphState, fields: ParagraphFields) => {
      if (!paragraph.id && onCreateParagraph) {
        let id = onCreateParagraph(fields);
        if (id && typeof id === 'object' && id.then && typeof id.then === 'function') {
          id = await id;
        }

        if (id && (typeof id === 'string' || typeof id === 'number')) {
          const nextParagraphs = [...paragraphs];

          const index = nextParagraphs.findIndex(({ key }) => key === paragraph.key);
          if (index !== -1) {
            nextParagraphs[index].id = id;
            nextParagraphs.push(createNewParagraph());
            setParagraphs(nextParagraphs);
          }
        }
      } else if (paragraph.id && onChangeParagraph) {
        const res = onChangeParagraph(paragraph.id, fields);
        if (res && typeof res === 'object' && res.then && typeof res.then === 'function') {
          await res;
        }
      }
    },
    [createNewParagraph, onChangeParagraph, onCreateParagraph, paragraphs],
  );

  const deleteParagraph = useCallback(
    (paragraph: ParagraphState) => {
      (async () => {
        if (paragraph.id && onDeleteParagraph) {
          let doDelete = onDeleteParagraph(paragraph.id);

          if (
            doDelete &&
            typeof doDelete === 'object' &&
            doDelete.then &&
            typeof doDelete.then === 'function'
          ) {
            doDelete = await doDelete;
          }

          if (doDelete) {
            setParagraphs((ps: ParagraphState[]) => {
              const nextParagraphs = [...ps];

              const index = nextParagraphs.findIndex(({ key }) => key === paragraph.key);

              if (index !== -1) {
                nextParagraphs.splice(index, 1);
              }

              return nextParagraphs;
            });
          }
        }
      })();
    },
    [onDeleteParagraph],
  );

  return (
    <div className="cezembre-admin-forms-article">
      {paragraphs.map((paragraph: ParagraphState) => (
        <div key={paragraph.key} className="paragraph">
          <Paragraph
            paragraph={paragraph}
            onChange={(fields: ParagraphFields) => changeParagraph(paragraph, fields)}
            onDelete={() => deleteParagraph(paragraph)}
          />
        </div>
      ))}
    </div>
  );
}
