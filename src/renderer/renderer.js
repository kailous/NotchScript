const island = document.querySelector("#island");
const collapseButton = document.querySelector("#collapseButton");
const passThroughButton = document.querySelector("#passThroughButton");
const compactView = document.querySelector(".compact-view");
const expandedView = document.querySelector(".expanded-view");

let expanded = false;
let interactive = false;
let collapseTimer;

function renderMode(nextExpanded) {
  expanded = nextExpanded;
  island.classList.toggle("island--expanded", expanded);
  island.classList.toggle("island--compact", !expanded);
  compactView.setAttribute("aria-hidden", String(expanded));
  expandedView.setAttribute("aria-hidden", String(!expanded));

  clearTimeout(collapseTimer);
  if (expanded) {
    window.notchScript.setInteractive(true);
    collapseTimer = setTimeout(() => {
      window.notchScript.toggle();
    }, 6000);
  }
}

function renderInteraction(nextInteractive) {
  interactive = nextInteractive;
  island.classList.toggle("island--interactive", interactive);
  passThroughButton.textContent = interactive ? "穿透" : "交互";
}

island.addEventListener("click", () => {
  if (!expanded) {
    window.notchScript.hello();
  }
});

collapseButton.addEventListener("click", (event) => {
  event.stopPropagation();
  window.notchScript.toggle();
});

passThroughButton.addEventListener("click", (event) => {
  event.stopPropagation();
  window.notchScript.setInteractive(false);
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
