// ============================================================================
// RagChatWidget Inline Script
// ============================================================================
// Client-side interactivity for the "Tanya AI" sidebar widget. Bundled as a
// raw string and injected via Component.afterDOMLoaded (see RagChatWidget.tsx).
// ============================================================================

interface RagChatSource {
  path: string;
  title?: string;
}

interface RagChatResponse {
  answer?: string;
  sources?: RagChatSource[];
}

// Step 3e: render the source notes as a list of relative links.
// Uses textContent/createElement (never innerHTML) so nothing in the
// answer, question, or source data can be interpreted as HTML/script.
function renderSources(sourcesEl: HTMLDivElement, sources: RagChatSource[]) {
  sourcesEl.textContent = "";
  if (sources.length === 0) return;

  const heading = document.createElement("p");
  heading.className = "rag-chat-widget-sources-heading";
  heading.textContent = "Sumber:";
  sourcesEl.appendChild(heading);

  const list = document.createElement("ul");
  list.className = "rag-chat-widget-sources-list";
  for (const source of sources) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.path;
    link.textContent = source.title && source.title.length > 0 ? source.title : source.path;
    item.appendChild(link);
    list.appendChild(item);
  }
  sourcesEl.appendChild(list);
}

async function submitQuestion(
  input: HTMLInputElement,
  button: HTMLButtonElement,
  answerEl: HTMLDivElement,
  sourcesEl: HTMLDivElement,
  originalButtonText: string,
) {
  // Step 3b: validate input, ignore empty submissions.
  const question = input.value.trim();
  if (!question) return;

  // Edge case: ignore new clicks/Enter presses while a request is in flight.
  if (button.dataset.ragChatLoading === "true") return;

  // Step 3c: enter loading state.
  button.dataset.ragChatLoading = "true";
  button.disabled = true;
  button.textContent = "Mencari...";
  answerEl.textContent = "";
  sourcesEl.textContent = "";

  try {
    // Step 3d: call the RAG backend.
    const response = await fetch("/neuron/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    if (!response.ok) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    // Step 3e: render the answer and its sources.
    const data = (await response.json()) as RagChatResponse;
    answerEl.textContent = data.answer ?? "";
    renderSources(sourcesEl, Array.isArray(data.sources) ? data.sources : []);
  } catch (error) {
    // Step 3f: friendly error, no technical details leaked to the visitor.
    console.error("[RagChatWidget] Failed to fetch answer:", error);
    answerEl.textContent = "Gagal menghubungi asisten, coba lagi sebentar lagi.";
  } finally {
    // Step 3g: always restore the button to its original state.
    button.dataset.ragChatLoading = "false";
    button.disabled = false;
    button.textContent = originalButtonText;
  }
}

// Step 3a: locate the widget's DOM nodes and wire up the submit interactions.
function setupRagChat() {
  const input = document.querySelector<HTMLInputElement>("#rag-chat-input");
  const button = document.querySelector<HTMLButtonElement>("#rag-chat-submit");
  const answerEl = document.querySelector<HTMLDivElement>("#rag-chat-answer");
  const sourcesEl = document.querySelector<HTMLDivElement>("#rag-chat-sources");

  if (!input || !button || !answerEl || !sourcesEl) return;

  // Guard against re-binding listeners if "nav" fires without the widget's
  // DOM nodes being replaced (e.g. persistent sidebar across navigations).
  if (button.dataset.ragChatBound === "true") return;
  button.dataset.ragChatBound = "true";

  const originalButtonText = button.textContent ?? "Tanya";

  const clickHandler = () => {
    void submitQuestion(input, button, answerEl, sourcesEl, originalButtonText);
  };
  const keypressHandler = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      void submitQuestion(input, button, answerEl, sourcesEl, originalButtonText);
    }
  };

  button.addEventListener("click", clickHandler);
  input.addEventListener("keypress", keypressHandler);

  // Release the listeners on the next SPA navigation so they don't leak if
  // the widget's DOM nodes ever persist instead of being re-created.
  if (typeof window !== "undefined" && window.addCleanup) {
    window.addCleanup(() => {
      button.removeEventListener("click", clickHandler);
      input.removeEventListener("keypress", keypressHandler);
      delete button.dataset.ragChatBound;
    });
  }
}

// Step 4: re-run setup after every Quartz SPA navigation (also covers the
// initial page load, since "nav" fires then too).
document.addEventListener("nav", () => {
  setupRagChat();
});
