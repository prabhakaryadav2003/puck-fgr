const elementRefs = new Map<string, HTMLElement>();

// Store both the ID and the options so they aren't lost when deferred
let pendingScroll: {
  id: string;
  options?: Parameters<typeof scrollElementIntoView>[1];
} | null = null;

export const registerElement = (id: string, el: HTMLElement | null) => {
  if (!el) {
    elementRefs.delete(id);
    return;
  }

  elementRefs.set(id, el);

  if (pendingScroll?.id === id) {
    const options = pendingScroll.options;

    // Clear pending immediately to prevent double-firing
    pendingScroll = null;

    // Defer the scroll to allow the browser to paint and calculate
    // the layout heights (crucial for newly opened arrays).
    setTimeout(() => {
      scrollElementIntoView(id, options);
    }, 50);
  }
};

export const scrollElementIntoView = (
  id: string,
  options?: {
    behavior?: ScrollBehavior;
    block?: ScrollLogicalPosition;
    duration?: number;
    iterations?: number;
    delay?: number;
  }
) => {
  const el = elementRefs.get(id);

  if (!el) {
    // Save to pending if not found yet
    pendingScroll = { id, options };
    return;
  }

  const {
    behavior = "smooth",
    block = "center",
    duration = 600,
    iterations = 2,
    delay = 50,
  } = options ?? {};

  // Scroll the wrapper into view
  el.scrollIntoView({
    behavior,
    block,
  });

  const animationSettings = {
    keyframes: [
      {
        backgroundColor: "transparent",
        outline: "2px solid transparent",
      },
      {
        backgroundColor: "rgba(0, 123, 237, 0.15)",
        outline: "2px solid rgba(0, 123, 237, 0.8)",
      },
      {
        backgroundColor: "transparent",
        outline: "2px solid transparent",
      },
    ],
    options: {
      duration,
      iterations,
      delay,
      easing: "ease-in-out",
    },
  };

  // Find the actual input field inside the wrapper.
  // We use type assertion to tell TypeScript it's an HTMLElement,
  // and fallback to the wrapper `el` if for some reason an input isn't found.

  // Give strict preference to the Rich Text editor first
  let targetEl = el.querySelector(
    '[contenteditable="true"]'
  ) as HTMLElement | null;

  // If not a rich text field, fall back to standard form inputs
  if (!targetEl) {
    targetEl = el.querySelector(
      "input, textarea, select"
    ) as HTMLElement | null;
  }

  targetEl = targetEl || el;

  // Animate the target element
  targetEl.animate(animationSettings.keyframes, animationSettings.options);

  // Clear pending if it was called directly and succeeded
  if (pendingScroll?.id === id) {
    pendingScroll = null;
  }
};
