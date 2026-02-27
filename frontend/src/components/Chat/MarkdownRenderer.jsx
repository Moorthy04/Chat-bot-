import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { vscDarkPlus, vs } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { Copy, Check } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';


const CodeBlock = ({ language, value, theme }) => {
    const [copied, setCopied] = useState(false);
    const isDark = theme === 'dark';

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="relative group my-6 rounded-xl overflow-hidden border border-(--border)/50 shadow-sm bg-(--input-bg) max-w-full">
            {/* Header bar */}
            <div className="flex items-center justify-between px-4 py-2 bg-(--active-bg)/50 border-b border-(--border)/30">
                <span className="text-xs font-mono text-foreground/50 lowercase">{language || 'text'}</span>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground transition-colors py-1 px-2 rounded hover:bg-(--hover-bg) cursor-pointer"
                >
                    {copied ? (
                        <>
                            <Check size={14} className="text-(--button-primary)" />
                            <span className="text-(--button-primary)">Copied!</span>
                        </>
                    ) : (
                        <>
                            <Copy size={14} />
                            <span>Copy</span>
                        </>
                    )}
                </button>
            </div>
            {/* Syntax Highlighting */}
            <div className="p-0 overflow-x-auto custom-scrollbar max-w-full">
                <SyntaxHighlighter
                    language={language}
                    style={isDark ? vscDarkPlus : vs}
                    wrapLongLines={true}
                    customStyle={{
                        margin: 0,
                        padding: window.innerWidth < 640 ? '0.75rem' : '1.25rem',
                        fontSize: window.innerWidth < 640 ? '0.75rem' : '0.85rem',
                        lineHeight: '1.6',
                        backgroundColor: 'transparent',
                        width: '100%',
                    }}
                    codeTagProps={{
                        style: { fontFamily: '"JetBrains Mono", "Fira Code", monospace', whiteSpace: 'pre-wrap' }
                    }}
                >
                    {value}
                </SyntaxHighlighter>
            </div>
        </div>
    );
};

const MarkdownRenderer = ({ content, isStreaming = false }) => {
    const { theme } = useTheme();

    return (
        <div className="markdown-container prose prose-zinc dark:prose-invert max-w-none prose-sm sm:prose-base leading-[1.75] prose-headings:font-bold prose-p:my-4 prose-pre:bg-transparent prose-pre:p-0 prose-strong:text-foreground prose-headings:text-foreground prose-headings:mb-3 prose-headings:mt-6 prose-h1:text-xl sm:prose-h1:text-2xl prose-h2:text-lg sm:prose-h2:text-xl prose-h3:text-base sm:prose-h3:text-lg">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    // Custom code block — react-markdown v10 removed the `inline` prop.
                    // Block code is wrapped in a <pre> parent; inline code is not.
                    code({ node, className, children, ...props }) {
                        const match = /language-(\w+)/.exec(className || '');
                        const language = match ? match[1] : '';
                        const value = String(children).replace(/\n$/, '');

                        // In react-markdown v10, block code has a <pre> element as parent.
                        // Inline code does not. Use multi-line or language tag as fallback.
                        const isBlock = match || value.includes('\n');

                        return isBlock ? (
                            <CodeBlock language={language} value={value} theme={theme} />
                        ) : (
                            <code
                                className="bg-(--hover-bg) text-(--foreground) px-1.5 py-0.5 rounded-md font-mono text-[0.85em] border border-(--border)/30 mx-0.5 inline-block align-middle"
                                {...props}
                            >
                                {children}
                            </code>
                        );
                    },

                    // Link styling
                    a: ({ node, ...props }) => (
                        <a
                            className="text-(--button-primary) hover:underline transition-all font-medium decoration-2 underline-offset-4"
                            target="_blank"
                            rel="noopener noreferrer"
                            {...props}
                        />
                    ),
                    // Table styling
                    table: ({ node, ...props }) => (
                        <div className="overflow-x-auto my-6 border border-(--border)/50 rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full border-collapse bg-(--background)" {...props} />
                        </div>
                    ),
                    thead: ({ node, ...props }) => <thead className="bg-(--hover-bg) border-b border-(--border)" {...props} />,
                    th: ({ node, ...props }) => <th className="px-4 py-3 text-left font-semibold text-xs uppercase text-foreground/60 tracking-wider" {...props} />,
                    td: ({ node, ...props }) => <td className="px-4 py-3 text-sm border-b border-(--border)/30 text-foreground/80" {...props} />,
                    // List styling
                    ul: ({ node, ...props }) => <ul className="list-disc pl-6 my-4 space-y-2 text-foreground/90" {...props} />,
                    ol: ({ node, ...props }) => <ol className="list-decimal pl-6 my-4 space-y-2 text-foreground/90" {...props} />,
                    li: ({ node, ...props }) => <li className="pl-1" {...props} />,
                    // Quote styling
                    blockquote: ({ node, ...props }) => (
                        <blockquote
                            className="border-l-4 border-(--button-primary)/30 pl-4 py-1 my-6 italic text-foreground/70 bg-(--hover-bg)/30 rounded-r-lg"
                            {...props}
                        />
                    ),
                    // Divider
                    hr: ({ node, ...props }) => <hr className="my-8 border-t border-(--border)/50" {...props} />,
                }}
            >
                {content}
            </ReactMarkdown>
            {isStreaming && (
                <span className="inline-block ml-0.5 text-(--button-primary) font-bold animate-cursor-blink" aria-hidden="true">▍</span>
            )}
        </div>
    );
};

export default MarkdownRenderer;
