import React from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

export const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // Split text by display math $$...$$ and inline math $...$
  // First match $$...$$ then $...$
  const regex = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;
  const parts = text.split(regex);

  return (
    <span className={`inline-block leading-relaxed ${className}`}>
      {parts.map((part, index) => {
        if (part.startsWith('$$') && part.endsWith('$$')) {
          const math = part.slice(2, -2).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: true,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="block my-2 text-center overflow-x-auto"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index}>{part}</code>;
          }
        } else if (part.startsWith('$') && part.endsWith('$')) {
          const math = part.slice(1, -1).trim();
          try {
            const html = katex.renderToString(math, {
              displayMode: false,
              throwOnError: false,
            });
            return (
              <span
                key={index}
                className="inline-math px-0.5"
                dangerouslySetInnerHTML={{ __html: html }}
              />
            );
          } catch (e) {
            return <code key={index}>{part}</code>;
          }
        }
        // Normal text: preserve line breaks
        return (
          <span key={index} className="whitespace-pre-wrap">
            {part}
          </span>
        );
      })}
    </span>
  );
};
