import { toHTML, type PortableTextComponents } from '@portabletext/to-html';
import { urlFor } from './sanity';

// Renders longRead.body once it's live Portable Text from Sanity — the
// pullQuote/inlineFigure cases mirror src/components/PullQuote.astro and
// InlineFigure.astro so the HTML output matches those components' markup.
const components: Partial<PortableTextComponents> = {
  types: {
    pullQuote: ({ value }) => `
      <div class="pull-quote display-lg">
        ${value.quote}
        ${value.attribution ? `<span class="ui">${value.attribution}</span>` : ''}
      </div>
    `,
    inlineFigure: ({ value }) => `
      <figure class="inline-figure">
        <div class="frame"><img src="${urlFor(value.image).width(1200).url()}" alt="" /></div>
        <figcaption class="ui">${value.caption ?? ''}</figcaption>
      </figure>
    `,
  },
  block: {
    // matches article.html's hand-authored <h2 class="display"> section headings
    h2: ({ children }) => `<h2 class="display-lg">${children}</h2>`,
  },
};

export function renderPortableText(blocks: unknown[]): string {
  return toHTML(blocks as never, { components });
}
