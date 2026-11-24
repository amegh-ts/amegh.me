// Weight-follows-pointer effect on the hero heading (desktop pointers only).
// Lines marked with .ln (home page) keep their line breaks.
const hero = document.querySelector(".hero");
const h1 = hero && hero.querySelector("h1");
const fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;
const still = window.matchMedia("(prefers-reduced-motion:reduce)").matches;

if (h1 && fine && !still) {
  if (!h1.hasAttribute("aria-label")) h1.setAttribute("aria-label", h1.textContent.trim());
  const chars = [];

  const split = (text, into) => {
    text.split(" ").forEach((word, i, all) => {
      const w = document.createElement("span");
      w.style.cssText = "display:inline-block;white-space:nowrap";
      for (const c of word) {
        const s = document.createElement("span");
        s.style.display = "inline-block";
        s.textContent = c;
        w.appendChild(s);
        chars.push(s);
      }
      into.appendChild(w);
      if (i < all.length - 1) into.appendChild(document.createTextNode(" "));
    });
  };

  const lines = h1.querySelectorAll(".ln");
  if (lines.length) {
    lines.forEach((ln) => {
      const text = ln.textContent;
      ln.textContent = "";
      split(text, ln);
    });
  } else {
    const text = h1.textContent.trim();
    h1.textContent = "";
    const wrap = document.createElement("span");
    wrap.setAttribute("aria-hidden", "true");
    h1.appendChild(wrap);
    split(text, wrap);
  }

  const MIN = 300, MAX = 800, REST = 600;
  const weight = chars.map(() => REST);
  const target = chars.map(() => REST);
  let px = null, py = null, running = false;

  const aim = () => {
    const r = Math.max(140, h1.getBoundingClientRect().width / 5);
    chars.forEach((ch, i) => {
      const b = ch.getBoundingClientRect();
      const dx = b.left + b.width / 2 - px, dy = b.top + b.height / 2 - py;
      const d = Math.sqrt(dx * dx + dy * dy) / r;
      target[i] = MIN + (MAX - MIN) * Math.exp(-d * d);
    });
  };

  const tick = () => {
    if (px !== null) aim();
    else target.fill(REST);
    let moving = false;
    chars.forEach((ch, j) => {
      const diff = target[j] - weight[j];
      weight[j] += diff * 0.14;
      if (Math.abs(diff) > 0.6) moving = true;
      ch.style.fontWeight = Math.round(weight[j]);
    });
    if (moving || px !== null) requestAnimationFrame(tick);
    else running = false;
  };

  const go = () => {
    if (!running) {
      running = true;
      requestAnimationFrame(tick);
    }
  };
  hero.addEventListener("pointermove", (e) => { px = e.clientX; py = e.clientY; go(); });
  hero.addEventListener("pointerleave", () => { px = null; py = null; go(); });
}
