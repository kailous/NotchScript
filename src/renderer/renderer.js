const island = document.querySelector("#island");
const compactView = document.querySelector(".compact-view");
const expandedView = document.querySelector(".expanded-view");

let expanded = false;
let collapseTimer;

function renderMode(nextExpanded) {
  expanded = nextExpanded;
  island.classList.toggle("island--expanded", expanded);
  island.classList.toggle("island--compact", !expanded);
  compactView.setAttribute("aria-hidden", String(expanded));
  expandedView.setAttribute("aria-hidden", String(!expanded));

  clearTimeout(collapseTimer);
  if (expanded) {
    collapseTimer = setTimeout(() => {
      window.notchScript.toggle();
    }, 3600);
  }
}

function renderInteraction(nextInteractive) {
  island.classList.toggle("island--interactive", nextInteractive);
}

island.addEventListener("click", () => {
  if (!expanded) {
    window.notchScript.hello();
  }
});

window.notchScript.onModeChange(({ expanded: nextExpanded }) => {
  renderMode(nextExpanded);
});

window.notchScript.onInteractionChange(({ interactive: nextInteractive }) => {
  renderInteraction(nextInteractive);
});

setTimeout(() => {
  window.notchScript.hello();
}, 500);
