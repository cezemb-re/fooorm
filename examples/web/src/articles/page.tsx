import { ReactElement } from 'react';
import articles from './data';
import Editor from './editor';

export interface Params {
  article: string;
}

export default function Page(): ReactElement | null {
  const article = articles.find(({ id }) => id === '2');

  if (!article) {
    return null;
  }

  return (
    <div className="articles-page">
      <Editor article={article} />
    </div>
  );
}
