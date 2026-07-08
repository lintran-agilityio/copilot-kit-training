export const getChatScrollContainer = () => {
  const scrollContent = document.querySelector(
    '[data-sidebar-chat] [data-testid="copilot-scroll-content"]'
  );
  if (!scrollContent) return null;

  let element = scrollContent.parentElement;
  while (element && !element.matches('[data-testid="copilot-chat"]')) {
    const { overflowY } = getComputedStyle(element);
    if (overflowY === "auto" || overflowY === "scroll") {
      return element;
    }
    element = element.parentElement;
  }

  return document.querySelector(
    '[data-sidebar-chat] [data-testid="copilot-chat"] > div:first-child > div:first-child'
  ) as HTMLElement | null;
}

export const scrollChatToEnd = (behavior: ScrollBehavior = "smooth") => {
  const scrollContainer = getChatScrollContainer();
  if (!scrollContainer) return;

  scrollContainer.scrollTo({
    top: scrollContainer.scrollHeight,
    behavior,
  });
}