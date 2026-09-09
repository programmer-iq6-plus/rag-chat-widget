import type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
} from "@quartz-community/types";
import { classNames } from "../util/lang";
import style from "./styles/rag-chat.scss";
// @ts-expect-error - inline script import handled by Quartz bundler
import script from "./scripts/rag-chat.inline.ts";

export interface RagChatWidgetOptions {
  className?: string;
}

// IDs referenced by the inline script (src/components/scripts/rag-chat.inline.ts)
// to locate the widget's DOM nodes after each Quartz navigation.
const INPUT_ID = "rag-chat-input";
const SUBMIT_BUTTON_ID = "rag-chat-submit";
const ANSWER_AREA_ID = "rag-chat-answer";
const SOURCES_AREA_ID = "rag-chat-sources";

export default ((opts?: RagChatWidgetOptions) => {
  const { className = "rag-chat-widget" } = opts ?? {};

  // Step 1: RagChatWidget renders a small standalone form (title, input,
  // submit button) plus two empty containers that the inline script fills
  // in with the answer and the list of source notes.
  const Component: QuartzComponent = (_props: QuartzComponentProps) => {
    return (
      <div class={classNames(className)}>
        <h3 class="rag-chat-widget-title">Tanya AI</h3>
        <div class="rag-chat-widget-form">
          <input
            type="text"
            id={INPUT_ID}
            class="rag-chat-widget-input"
            placeholder="Tanyakan sesuatu tentang catatan ini..."
          />
          <button type="button" id={SUBMIT_BUTTON_ID} class="rag-chat-widget-button">
            Tanya
          </button>
        </div>
        <div id={ANSWER_AREA_ID} class="rag-chat-widget-answer" />
        <div id={SOURCES_AREA_ID} class="rag-chat-widget-sources" />
      </div>
    );
  };

  // Step 2: minimal styling - thin border, full-width input, dimmed
  // disabled button, and word-wrapped answer text.
  Component.css = style;

  // Step 3-4: interactivity is implemented in the inline script and wired
  // up on every SPA navigation via the "nav" event (see the script file).
  Component.afterDOMLoaded = script;

  return Component;
}) satisfies QuartzComponentConstructor;
