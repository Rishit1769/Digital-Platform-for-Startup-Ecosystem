'use client';

import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import mermaid from 'mermaid';

type ReadmeRendererProps = {
  markdown: string;
  owner?: string;
  repo?: string;
};

const F = {
  space: 'font-[family-name:var(--font-space)]',
};

let mermaidInitialized = false;

function resolveRelativeUrl(href: string, owner?: string, repo?: string, forImage = false): string {
  if (!href) return href;
  if (/^(https?:)?\/\//i.test(href) || href.startsWith('mailto:')) return href;
  if (!owner || !repo) return href;

  const cleaned = href.replace(/^\.\//, '').replace(/^\//, '');
  if (forImage) return `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${cleaned}`;
  return `https://github.com/${owner}/${repo}/blob/HEAD/${cleaned}`;
}

function MermaidBlock({ chart }: { chart: string }) {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');

  const id = useMemo(() => `mermaid-${Math.random().toString(36).slice(2)}`, []);

  useEffect(() => {
    let mounted = true;

    const render = async () => {
      try {
        if (!mermaidInitialized) {
          mermaid.initialize({ startOnLoad: false, theme: 'default', securityLevel: 'loose' });
          mermaidInitialized = true;
        }
        const result = await mermaid.render(id, chart);
        if (mounted) {
          setSvg(result.svg);
          setError('');
        }
      } catch {
        if (mounted) {
          setError('Diagram could not be rendered.');
          setSvg('');
        }
      }
    };

    render();

    return () => {
      mounted = false;
    };
  }, [chart, id]);

  if (error) {
    return (
      <pre className="border border-[#CC0000] bg-[#FFF5F5] p-4 text-[#CC0000] text-xs overflow-auto">
        {chart}
      </pre>
    );
  }

  if (!svg) {
    return <div className="border border-[#E0E0E0] bg-[#FAFAFA] p-4 text-xs text-[#888888]">Rendering diagram...</div>;
  }

  return <div className="border border-[#E0E0E0] bg-white p-4 overflow-x-auto" dangerouslySetInnerHTML={{ __html: svg }} />;
}

export default function ReadmeRenderer({ markdown, owner, repo }: ReadmeRendererProps) {
  if (!markdown) return null;

  return (
    <div className={`prose max-w-none prose-sm text-[#444444] ${F.space}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ className, children }) {
            const lang = (className || '').replace('language-', '').toLowerCase();
            const value = String(children || '').trim();

            if (lang === 'mermaid') {
              return <MermaidBlock chart={value} />;
            }

            return (
              <code className={className}>
                {children}
              </code>
            );
          },
          img({ src = '', alt = '' }) {
            const resolved = resolveRelativeUrl(String(src), owner, repo, true);
            return <img src={resolved} alt={alt} className="max-w-full h-auto border border-[#E8E8E8]" />;
          },
          a({ href = '', children }) {
            const resolved = resolveRelativeUrl(String(href), owner, repo, false);
            return (
              <a href={resolved} target="_blank" rel="noopener noreferrer">
                {children}
              </a>
            );
          },
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
