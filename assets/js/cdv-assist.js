/**
 * CDV Assist — Frontend Widget Controller
 * Pure vanilla JavaScript with zero framework dependencies.
 */
document.addEventListener("DOMContentLoaded", () => {
  const launcher = document.getElementById("cdv-chat-launcher");
  const windowEl = document.getElementById("cdv-chat-window");
  const closeBtn = document.getElementById("cdv-chat-close");
  const messagesContainer = document.getElementById("cdv-chat-messages");
  const form = document.getElementById("cdv-chat-form");
  const input = document.getElementById("cdv-chat-input");
  const sendBtn = document.getElementById("cdv-chat-send");
  const suggestedWrap = document.getElementById("cdv-suggested-wrap");

  if (!launcher || !windowEl || !form || !input) return;

  // In-memory conversation state for the active session
  const conversation = [
    {
      role: "assistant",
      content:
        "Hi! 👋 I'm CDV Assist, your AI support assistant.\n\nI can help with tenant referencing, supporting documents, identity verification and general questions about Complete Digital Vetting.\n\nWhat would you like help with?",
    },
  ];

  let isWaiting = false;

  // 1. Open / Close Interactions
  function toggleChat(open) {
    const shouldOpen = typeof open === "boolean" ? open : !windowEl.classList.contains("is-open");
    if (shouldOpen) {
      windowEl.classList.add("is-open");
      launcher.setAttribute("aria-expanded", "true");
      scrollToBottom();
      // Only autofocus on non-touch devices to avoid jumping the virtual keyboard
      if (window.innerWidth > 640) {
        setTimeout(() => input.focus(), 150);
      }
    } else {
      windowEl.classList.remove("is-open");
      launcher.setAttribute("aria-expanded", "false");
      launcher.focus();
    }
  }

  launcher.addEventListener("click", () => toggleChat());
  closeBtn?.addEventListener("click", () => toggleChat(false));

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && windowEl.classList.contains("is-open")) {
      toggleChat(false);
    }
  });

  // 2. Safe HTML Escaping and Lightweight Markdown Formatter
  function escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str;
    return div.innerHTML;
  }

  function formatAssistantMessage(rawText) {
    const safe = escapeHtml(rawText);

    // Convert URLs into safe links
    const withLinks = safe.replace(
      /(https?:\/\/[^\s\)]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
    );

    // Convert **bold** to <strong>
    const withBold = withLinks.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

    // Convert bullet points to <ul><li>
    const lines = withBold.split("\n");
    let inList = false;
    const formattedLines = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        if (!inList) {
          formattedLines.push("<ul>");
          inList = true;
        }
        formattedLines.push(`<li>${trimmed.slice(2)}</li>`);
      } else {
        if (inList) {
          formattedLines.push("</ul>");
          inList = false;
        }
        if (trimmed.length > 0) {
          formattedLines.push(`<p>${line}</p>`);
        }
      }
    });

    if (inList) formattedLines.push("</ul>");
    return formattedLines.join("");
  }

  // 3. Render Message Bubble
  function appendMessage(role, content) {
    const row = document.createElement("div");
    row.className = `cdv-msg-row ${role}`;

    if (role === "assistant") {
      const avatar = document.createElement("div");
      avatar.className = "cdv-msg-avatar";
      avatar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;
      row.appendChild(avatar);
    }

    const bubble = document.createElement("div");
    bubble.className = "cdv-msg-bubble";

    if (role === "assistant") {
      bubble.innerHTML = formatAssistantMessage(content);
    } else {
      bubble.textContent = content;
    }

    row.appendChild(bubble);
    messagesContainer.appendChild(row);
    scrollToBottom();
  }

  // 4. Typing Indicator
  function showTypingIndicator() {
    const existing = document.getElementById("cdv-typing-row");
    if (existing) return;

    const row = document.createElement("div");
    row.id = "cdv-typing-row";
    row.className = "cdv-msg-row assistant";

    const avatar = document.createElement("div");
    avatar.className = "cdv-msg-avatar";
    avatar.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2a8 8 0 0 0-8 8c0 5 8 12 8 12s8-7 8-12a8 8 0 0 0-8-8z"/><circle cx="12" cy="10" r="3"/></svg>`;
    row.appendChild(avatar);

    const bubble = document.createElement("div");
    bubble.className = "cdv-msg-bubble cdv-typing-indicator";
    bubble.innerHTML = `
      <span class="cdv-typing-dot"></span>
      <span class="cdv-typing-dot"></span>
      <span class="cdv-typing-dot"></span>
      <span class="sr-only">CDV Assist is typing...</span>
    `;
    row.appendChild(bubble);

    messagesContainer.appendChild(row);
    scrollToBottom();
  }

  function hideTypingIndicator() {
    const indicator = document.getElementById("cdv-typing-row");
    if (indicator) indicator.remove();
  }

  function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  // 5. Send User Message & Handle API
  async function sendMessage(text) {
    const cleanText = (text || "").trim();
    if (!cleanText || isWaiting) return;

    // Hide suggested chips after initial interaction
    if (suggestedWrap) {
      suggestedWrap.style.display = "none";
    }

    // Add user message
    appendMessage("user", cleanText);
    conversation.push({ role: "user", content: cleanText });

    input.value = "";
    input.disabled = true;
    sendBtn.disabled = true;
    isWaiting = true;

    showTypingIndicator();

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: conversation }),
      });

      hideTypingIndicator();

      if (!response.ok) {
        let errMessage = "We're currently unable to reach CDV Assist. Please try again shortly or contact team@cdvetting.com.";
        try {
          const errData = await response.json();
          if (errData.error) errMessage = errData.error;
        } catch {
          // fallback to standard message
        }
        appendMessage("assistant", `⚠️ ${errMessage}`);
        return;
      }

      const data = await response.json();
      const reply = data.message || "Thank you for your question. If you need immediate assistance, please email team@cdvetting.com.";
      
      appendMessage("assistant", reply);
      conversation.push({ role: "assistant", content: reply });
    } catch {
      hideTypingIndicator();
      appendMessage(
        "assistant",
        "Connection issue: Unable to reach the support service. Please check your internet connection or email us directly at team@cdvetting.com."
      );
    } finally {
      isWaiting = false;
      input.disabled = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  // 6. Form Submission
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    sendMessage(input.value);
  });

  // 7. Suggested Questions Handling
  document.querySelectorAll("[data-cdv-question]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-cdv-question");
      if (q) {
        toggleChat(true);
        sendMessage(q);
      }
    });
  });
});
