// src/hydration.ts
import { h, hydrate } from "preact";
function hydrateAll(componentTable) {
  let hydratableElements = document.querySelectorAll("[data-hydrate]");
  for (let element of hydratableElements) {
    let { key, props } = JSON.parse(element.getAttribute("data-hydrate"));
    let component = componentTable[key];
    if (component == null) {
      throw new Error(`Unknown component: ${key}. Did you forget to add it to StatefulComponents?`);
    }
    hydrate(h(component, props), element);
    element.removeAttribute("data-hydrate");
  }
}

// src/components/code-viewer.tsx
import "preact";
import { useState, useEffect } from "preact/hooks";
import { jsx, jsxs } from "preact/jsx-runtime";
var tabSize = 2;
function CodeViewer({ html, numLines }) {
  let [highlightedLines, setHighlightedLines] = useState([]);
  function handleLineLinkClick(event) {
    event.preventDefault();
    let target = event.target;
    let lineNumber = parseInt(target.id.slice(1), 10);
    let newLines;
    if (event.shiftKey) {
      let firstLine = highlightedLines[0];
      if (firstLine == null) {
        newLines = [lineNumber];
      } else {
        let start = Math.min(firstLine, lineNumber);
        let end = Math.max(firstLine, lineNumber);
        newLines = getNumbersInRange([start, end]);
      }
    } else if (event.metaKey) {
      if (highlightedLines.includes(lineNumber)) {
        newLines = highlightedLines.filter((n) => n !== lineNumber);
      } else {
        newLines = [...highlightedLines, lineNumber].sort((a, b) => a - b);
      }
    } else {
      newLines = [lineNumber];
    }
    setHighlightedLines(newLines);
    let rangeString = stringifyRanges(
      newLines.reduce((ranges, n) => {
        let lastRange = ranges[ranges.length - 1];
        if (lastRange != null && lastRange[1] === n - 1) {
          lastRange[1] = n;
        } else {
          ranges.push([n, n]);
        }
        return ranges;
      }, [])
    );
    window.history.replaceState(
      null,
      "",
      rangeString === "" ? window.location.pathname + window.location.search : `#L${rangeString}`
    );
  }
  function handleHashChange() {
    let hash = window.location.hash;
    if (hash.startsWith("#L")) {
      let lines = parseRanges(hash.slice(2)).reduce(
        (lines2, range) => [...lines2, ...getNumbersInRange(range)],
        []
      );
      setHighlightedLines(lines);
    } else {
      setHighlightedLines([]);
    }
  }
  useEffect(() => {
    window.addEventListener("hashchange", handleHashChange);
    handleHashChange();
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);
  return /* @__PURE__ */ jsxs("div", { class: "flex relative bg-white font-mono text-sm leading-6", children: [
    /* @__PURE__ */ jsx("div", { class: "py-4 border-b border-x border-slate-300 bg-slate-100 text-right select-none", children: Array.from({ length: numLines }, (_, index) => {
      let lineNumber = index + 1;
      return /* @__PURE__ */ jsxs("div", { children: [
        highlightedLines.includes(lineNumber) ? /* @__PURE__ */ jsx("div", { class: "w-full h-6 bg-yellow-200 opacity-40 absolute left-0" }) : null,
        /* @__PURE__ */ jsx("div", { class: "relative", children: /* @__PURE__ */ jsx(
          "a",
          {
            id: `L${lineNumber}`,
            href: `#L${lineNumber}`,
            class: "inline-block w-full pl-4 sm:pl-6 pr-2 text-slate-600 hover:text-slate-950 outline-none",
            onClick: handleLineLinkClick,
            children: lineNumber
          }
        ) })
      ] });
    }) }),
    /* @__PURE__ */ jsx(
      "div",
      {
        class: "py-4 pl-4 pr-6 relative border-b border-r border-slate-300 flex-grow whitespace-pre overflow-x-auto",
        style: { tabSize },
        dangerouslySetInnerHTML: { __html: html }
      }
    )
  ] });
}
function parseRanges(rangeString) {
  return rangeString.split(",").map((range) => {
    let [start, end] = range.split("-").map((n) => parseInt(n, 10));
    if (end == null) {
      return [start, start];
    }
    return [start, end];
  });
}
function stringifyRanges(ranges) {
  return ranges.map(([start, end]) => start === end ? `${start}` : `${start}-${end}`).join(",");
}
function getNumbersInRange(range) {
  let [start, end] = range;
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

// src/components/version-selector.tsx
import "preact";
import { jsx as jsx2, jsxs as jsxs2 } from "preact/jsx-runtime";
function VersionSelector({
  availableTags,
  availableVersions,
  currentVersion,
  pathnameFormat,
  class: className
}) {
  function navigateToVersion(event) {
    let select = event.target;
    let version = select.value;
    let url = new URL(window.location.href);
    url.pathname = pathnameFormat.replace("%s", version);
    window.location.href = url.href;
  }
  let tagNames = Object.keys(availableTags).sort();
  return /* @__PURE__ */ jsxs2("select", { name: "version", value: currentVersion, class: className, onChange: navigateToVersion, children: [
    /* @__PURE__ */ jsx2("optgroup", { label: "Tags", children: tagNames.map((tag) => /* @__PURE__ */ jsxs2("option", { value: availableTags[tag], children: [
      tag,
      " (",
      availableTags[tag],
      ")"
    ] })) }),
    /* @__PURE__ */ jsx2("optgroup", { label: "Versions", children: availableVersions.map((version) => /* @__PURE__ */ jsx2("option", { value: version, children: version })) })
  ] });
}

// assets/scripts.ts
var StatefulComponents = {
  CodeViewer,
  VersionSelector
};
hydrateAll(StatefulComponents);
if (false) {
  new EventSource("http://localhost:8001/esbuild").addEventListener("change", () => {
    window.location.reload();
  });
}
