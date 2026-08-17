import React, { useId, useState } from "react";

export interface SkillGroup {
  title: string;
  items: readonly string[];
}

interface Props {
  heading: string;
  groups: readonly SkillGroup[];
}

/* One icon per group, in the order the groups are declared. Keeping them
   positional means the component stays language-agnostic — the Persian and
   English group titles differ, but the icons line up either way. */
const GroupIcons: React.ReactNode[] = [
  // Agents / multi-agent
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-[var(--sec)] opacity-70">
    <path d="M12 2C12.5523 2 13 2.44772 13 3V4H18C19.1046 4 20 4.89543 20 6V16C20 17.1046 19.1046 18 18 18H13.4142L12 19.4142L10.5858 18H6C4.89543 18 4 17.1046 4 16V6C4 4.89543 4.89543 4 6 4H11V3C11 2.44772 11.4477 2 12 2ZM18 6H6V16H11.4142L12 16.5858L12.5858 16H18V6ZM9.5 9C10.3284 9 11 9.67157 11 10.5C11 11.3284 10.3284 12 9.5 12C8.67157 12 8 11.3284 8 10.5C8 9.67157 8.67157 9 9.5 9ZM14.5 9C15.3284 9 16 9.67157 16 10.5C16 11.3284 15.3284 12 14.5 12C13.6716 12 13 11.3284 13 10.5C13 9.67157 13.6716 9 14.5 9ZM2 20H22V22H2V20Z" />
  </svg>,
  // LLM apps / chatbots
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-[var(--sec)] opacity-70">
    <path d="M6.45455 19L2 22.5V4C2 3.44772 2.44772 3 3 3H21C21.5523 3 22 3.44772 22 4V18C22 18.5523 21.5523 19 21 19H6.45455ZM5.76282 17H20V5H4V18.3851L5.76282 17ZM11 10H13V12H11V10ZM7 10H9V12H7V10ZM15 10H17V12H15V10Z" />
  </svg>,
  // RAG / search / data
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-[var(--sec)] opacity-70">
    <path d="M18.031 16.6168L22.3137 20.8995L20.8995 22.3137L16.6168 18.031C15.0769 19.2635 13.124 20 11 20C6.032 20 2 15.968 2 11C2 6.032 6.032 2 11 2C15.968 2 20 6.032 20 11C20 13.124 19.2635 15.0769 18.031 16.6168ZM16.0247 15.8748C17.2475 14.6146 18 12.8956 18 11C18 7.1325 14.8675 4 11 4C7.1325 4 4 7.1325 4 11C4 14.8675 7.1325 18 11 18C12.8956 18 14.6146 17.2475 15.8748 16.0247L16.0247 15.8748Z" />
  </svg>,
  // Backend / architecture
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className="w-6 h-6 text-[var(--sec)] opacity-70">
    <path d="M5 11H19V5H5V11ZM5 19H19V13H5V19ZM4 3H20C20.5523 3 21 3.44772 21 4V20C21 20.5523 20.5523 21 20 21H4C3.44772 21 3 20.5523 3 20V4C3 3.44772 3.44772 3 4 3ZM7 7H9V9H7V7ZM7 15H9V17H7V15Z" />
  </svg>,
];

const SkillsList = ({ heading, groups }: Props) => {
  const [openItem, setOpenItem] = useState<string | null>(null);
  // Stable across server and client render, so the aria wiring survives hydration.
  const baseId = useId();

  const toggleItem = (item: string) => setOpenItem(openItem === item ? null : item);

  return (
    <div className="text-start pt-3 md:pt-9 w-full">
      {/* h2, not h3: this is a top-level section under the page h1, and as an
          h3 it skipped a level in the document outline. */}
      <h2 className="reveal text-[var(--white)] heading-sub font-medium md:mb-6">{heading}</h2>
      <ul className="space-y-4 mt-4 text-lg">
        {groups.map((group, index) => {
          const isOpen = openItem === group.title;
          const panelId = `${baseId}-panel-${index}`;
          const buttonId = `${baseId}-trigger-${index}`;

          return (
            /* `.reveal` sits on the <li>, not on the <ul>, so the four groups
               come up one after another — each one drives its own timeline off
               its own position. The panel inside animates max-height on toggle,
               which is a separate, unrelated transition. */
            <li key={group.title} className="reveal w-full">
              <div className="md:w-[420px] w-full bg-[var(--surface)] rounded-2xl border border-[var(--surface-border)] overflow-hidden">
                {/*
                  A real <button>, not a div with onClick. As a div this was
                  unreachable by keyboard and announced as nothing, which put
                  all four skill groups out of reach for keyboard and screen
                  reader users entirely.
                */}
                <button
                  type="button"
                  id={buttonId}
                  onClick={() => toggleItem(group.title)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  className="w-full flex items-center gap-3 p-4 text-start cursor-pointer"
                >
                  {GroupIcons[index % GroupIcons.length]}
                  <span className="flex items-center gap-2 flex-grow justify-between">
                    <span className="block text-[var(--white)] text-base md:text-lg">
                      {group.title}
                    </span>
                    <svg
                      viewBox="0 0 24 24"
                      fill="currentColor"
                      aria-hidden="true"
                      className={`w-6 h-6 text-[var(--white)] transition-transform flex-shrink-0 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    >
                      <path d="M11.9999 13.1714L16.9497 8.22168L18.3639 9.63589L11.9999 15.9999L5.63599 9.63589L7.0502 8.22168L11.9999 13.1714Z" />
                    </svg>
                  </span>
                </button>

                {/*
                  `inert` rather than `hidden`: it takes the collapsed panel out
                  of the accessibility tree and out of the tab order the way
                  `hidden` would, but without setting display:none, so the
                  max-height open still animates. Clipping alone left all four
                  panels being read out at all times.
                */}
                <div
                  id={panelId}
                  role="region"
                  aria-labelledby={buttonId}
                  inert={!isOpen}
                  className={`transition-all duration-300 px-4 ${
                    isOpen ? "max-h-[500px] pb-4 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <ul className="space-y-2 text-[var(--white-icon)] text-sm">
                    {group.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-[var(--sec)] leading-6" aria-hidden="true">
                          •
                        </span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default SkillsList;
