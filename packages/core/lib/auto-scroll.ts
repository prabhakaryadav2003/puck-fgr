const _elementRefs = new Map<string, HTMLElement>();

// Use a Map to prevent race conditions when multiple fields mount/unmount rapidly
const pendingScrolls = new Map<
  string,
  Parameters<typeof scrollElementIntoView>[1] | undefined
>();

export const registerElement = (id: string, el: HTMLElement | null) => {
  if (!el) {
    _elementRefs.delete(id);
    return;
  }

  _elementRefs.set(id, el);

  if (pendingScrolls.has(id)) {
    const options = pendingScrolls.get(id);

    // Clear pending immediately to prevent double-firing
    pendingScrolls.delete(id);

    // Double requestAnimationFrame ensures the browser has fully painted
    // the new sidebar layout and calculated all heights before scrolling.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollElementIntoView(id, options);
      });
    });
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
  const el = _elementRefs.get(id);

  if (!el) {
    // Save to pending map if not found yet
    pendingScrolls.set(id, options);
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

  const animationSettings: KeyframeAnimationOptions = {
    duration,
    iterations,
    delay,
    easing: "ease-in-out",
  };

  const keyframes: Keyframe[] = [
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
  ];

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

  // Cancel any existing animations on this element
  // before starting a new one to prevent visual flickering.
  targetEl.getAnimations().forEach((anim) => anim.cancel());

  // Animate the target element
  targetEl.animate(keyframes, animationSettings);

  pendingScrolls.delete(id);
};
