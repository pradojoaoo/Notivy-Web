"use client";

import { useEffect } from "react";

const REVEAL_SELECTOR = [
  ".n-proof",
  ".n-section",
  ".n-showcase",
  ".n-footer",
  ".page-heading",
  ".notice",
  ".access-intro",
  ".panel",
  ".dashboard-toolbar",
  ".visual-card",
  ".new-visual-card",
  ".section-note",
].join(",");

export default function SiteMotion() {
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reducedMotion.matches) return;

    const observed = new WeakSet();
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { rootMargin: "0px 0px -8%", threshold: 0.08 });

    const register = (root = document) => {
      const elements = root instanceof Element && root.matches(REVEAL_SELECTOR)
        ? [root, ...root.querySelectorAll(REVEAL_SELECTOR)]
        : [...root.querySelectorAll(REVEAL_SELECTOR)];
      elements.forEach((element, index) => {
        if (observed.has(element)) return;
        observed.add(element);
        element.classList.add("site-reveal");
        element.style.setProperty("--reveal-order", String(index % 4));
        observer.observe(element);
      });
    };

    register();
    const mutations = new MutationObserver((records) => {
      for (const record of records) {
        for (const node of record.addedNodes) {
          if (node instanceof Element) register(node);
        }
      }
    });
    mutations.observe(document.body, { childList: true, subtree: true });

    return () => {
      mutations.disconnect();
      observer.disconnect();
    };
  }, []);

  return null;
}
