import React from 'react';
import { InlineMath, BlockMath } from 'react-katex';

export interface MathRendererProps {
  /** Raw math LaTeX string to render */
  math?: string;
  /** Whether to render as block math ($$...$$) instead of inline ($...$) */
  block?: boolean;
  /** Full text containing mixed markdown/text and $...$ or $$...$$ delimiters */
  text?: string;
  /** Child content if passed as children */
  children?: React.ReactNode;
  /** Optional custom CSS classes */
  className?: string;
  /** Error fallback renderer */
  errorColor?: string;
}

/**
 * Clean math expression by stripping surrounding delimiters if any
 */
function cleanMathExpression(raw: string): string {
  let clean = raw.trim();
  if (clean.startsWith('$$') && clean.endsWith('$$')) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('$') && clean.endsWith('$')) {
    clean = clean.slice(1, -1).trim();
  } else if (clean.startsWith('\\[') && clean.endsWith('\\]')) {
    clean = clean.slice(2, -2).trim();
  } else if (clean.startsWith('\\(') && clean.endsWith('\\)')) {
    clean = clean.slice(2, -2).trim();
  }
  return clean;
}

/**
 * A robust, high-contrast mathematical notation renderer using KaTeX / react-katex provider.
 * Supports:
 * 1. Single math expressions via `math` prop or children (inline or block).
 * 2. Mixed text with embedded $inline$ and $$block$$ notation via `text` prop.
 */
export const MathRenderer: React.FC<MathRendererProps> = ({
  math,
  block = false,
  text,
  children,
  className = '',
  errorColor = '#EF4444',
}) => {
  // Mode 1: If full mixed text is provided, parse and render text + math segments
  if (text !== undefined && text !== null) {
    if (!text) return null;

    // Regex to capture $$block math$$ or $inline math$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;
    const parts = text.split(mathRegex);

    return (
      <span className={`leading-relaxed ${className}`}>
        {parts.map((part, index) => {
          if (!part) return null;

          if (part.startsWith('$$') && part.endsWith('$$')) {
            const formula = cleanMathExpression(part);
            return (
              <span key={index} className="my-2 block overflow-x-auto text-center py-1">
                <BlockMath
                  math={formula}
                  errorColor={errorColor}
                  renderError={(error) => (
                    <span className="text-red-400 font-mono text-xs bg-red-950/40 px-1 py-0.5 rounded">
                      [LaTeX Error: {formula}]
                    </span>
                  )}
                />
              </span>
            );
          }

          if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
            const formula = cleanMathExpression(part);
            return (
              <span key={index} className="inline-block align-baseline mx-0.5 text-[#34D399]">
                <InlineMath
                  math={formula}
                  errorColor={errorColor}
                  renderError={(error) => (
                    <span className="text-red-400 font-mono text-xs bg-red-950/40 px-1 py-0.5 rounded">
                      {formula}
                    </span>
                  )}
                />
              </span>
            );
          }

          // Plain text segment
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  }

  // Mode 2: Single expression via `math` prop or string children
  const expression = math ?? (typeof children === 'string' ? children : '');
  const cleanExp = cleanMathExpression(expression);

  if (!cleanExp) {
    return <>{children}</>;
  }

  if (block) {
    return (
      <div className={`overflow-x-auto text-center sm:text-left py-1 ${className}`}>
        <BlockMath
          math={cleanExp}
          errorColor={errorColor}
          renderError={(error) => (
            <span className="text-red-400 font-mono text-xs bg-red-950/40 px-2 py-1 rounded">
              [LaTeX Error: {cleanExp}]
            </span>
          )}
        />
      </div>
    );
  }

  return (
    <span className={`inline-block align-baseline mx-0.5 text-[#34D399] ${className}`}>
      <InlineMath
        math={cleanExp}
        errorColor={errorColor}
        renderError={(error) => (
          <span className="text-red-400 font-mono text-xs bg-red-950/40 px-1 py-0.5 rounded">
            {cleanExp}
          </span>
        )}
      />
    </span>
  );
};
