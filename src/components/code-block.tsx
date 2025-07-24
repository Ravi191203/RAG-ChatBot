"use client";

import { useState } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";

// This is a more robust way to handle the props from react-markdown.
// It ensures that we can extract the code string and language correctly.
interface CodeBlockProps {
  node?: any;
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function CodeBlock({ node, inline, className, children, ...props }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : 'text';
  const code = String(children).replace(/\n$/, '');

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // For inline code, we don't want the full block treatment.
  if (inline) {
    return <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm" {...props}>{children}</code>;
  }

  return (
    <div className="relative my-4 rounded-lg bg-[#1e1e1e]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700">
        <span className="text-xs font-sans text-gray-400">{language}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-gray-400 hover:bg-gray-700 hover:text-white"
          onClick={handleCopy}
        >
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: '1rem',
          backgroundColor: 'transparent',
          fontSize: '0.875rem' 
        }}
        codeTagProps={{
          style: {
            fontFamily: 'var(--font-mono)',
          },
        }}
        {...props}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  );
}
