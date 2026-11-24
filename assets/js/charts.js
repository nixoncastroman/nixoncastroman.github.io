/* Small, dependency-free SVG charts for the case-study pages.
 *
 * Each <figure class="chart" data-chart="dumbbell|line"> holds its data as JSON in a
 * <script type="application/json"> child. Charts are drawn at the container's real pixel
 * width (so labels stay readable on phones) and redrawn when the width changes.
 * Every value is also in the figure's "Show data" table: tooltips add, never gate.
 */
(() => {
  "use strict";

  const NS = "http://www.w3.org/2000/svg";
  const css = getComputedStyle(document.documentElement);
  const token = (name, fallback) => css.getPropertyValue(name).trim() || fallback;
  const C = {
    ink: token("--ink", "#1d1b18"),
    ink2: token("--ink-2", "#5e5a52"),
    ink3: token("--ink-3", "#8a8478"),
    card: token("--card", "#f7f3ea"),
    grid: "rgba(29, 27, 24, 0.10)",
  };

  function el(name, attrs, parent) {
    const node = document.createElementNS(NS, name);
    for (const [key, value] of Object.entries(attrs || {})) node.setAttribute(key, String(value));
    if (parent) parent.appendChild(node);
    return node;
  }

  function text(parent, x, y, str, cls, anchor) {
    const node = el("text", { x, y, class: cls || "lbl", "text-anchor": anchor || "start" }, parent);
    node.textContent = str; // labels are data: never innerHTML
    return node;
  }

  function makeTooltip(plot) {
    const tip = document.createElement("div");
    tip.className = "tip";
    tip.setAttribute("aria-hidden", "true"); // focus targets carry their own aria-label
    plot.appendChild(tip);
    return {
      show(x, y, value, rest) {
        const strong = document.createElement("strong");
        strong.textContent = value;
        tip.replaceChildren(strong, document.createTextNode(" " + rest));
        const half = tip.offsetWidth / 2;
        const max = plot.clientWidth;
        tip.style.left = Math.max(half, Math.min(max - half, x)) + "px";
        tip.style.top = y + "px";
        tip.classList.add("on");
      },
      hide() {
        tip.classList.remove("on");
      },
    };
  }

  function bindHover(target, show, hide) {
    target.addEventListener("pointerenter", show);
    target.addEventListener("focus", show);
    target.addEventListener("pointerleave", hide);
    target.addEventListener("blur", hide);
  }

  /* Before/after per item: a dumbbell, one row per item, with an optional threshold. */
  function dumbbell(fig, d) {
    const plot = fig.querySelector(".plot");
    const tip = fig._tip;
    const W = Math.max(280, plot.clientWidth);
    const narrow = W < 540;
    const labelW = narrow ? 0 : 160;
    const rowH = narrow ? 82 : 58;
    const top = 36;
    const bottom = 30;
    const right = 26;
    const H = top + d.rows.length * rowH + bottom;
    const x0 = narrow ? 8 : labelW + 16;
    const x1 = W - right;
    const sx = (v) => x0 + (v / d.max) * (x1 - x0);

    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "group", "aria-labelledby": fig.dataset.titleId });

    for (let t = 0; t <= d.max + 1e-9; t += d.step) {
      el("line", { x1: sx(t), x2: sx(t), y1: top - 4, y2: H - bottom, stroke: C.grid, "stroke-width": 1, "shape-rendering": "crispEdges" }, svg);
      text(svg, sx(t), H - bottom + 19, t === d.max ? `${t} ${d.unit}` : String(t), "lbl", "middle");
    }

    if (d.threshold) {
      const tx = sx(d.threshold.value);
      el("line", { x1: tx, x2: tx, y1: top - 16, y2: H - bottom, stroke: C.ink2, "stroke-width": 1, "stroke-dasharray": "4 3" }, svg);
      text(svg, tx - 7, top - 20, d.threshold.label, "lbl", "end");
    }

    d.rows.forEach((row, i) => {
      const cy = top + i * rowH + (narrow ? rowH - 24 : rowH / 2 - 4);
      if (narrow) text(svg, x0, cy - 22, row.label, "lbl", "start");
      else text(svg, labelW, cy + 5, row.label, "lbl", "end");

      el("line", { x1: sx(row.after), x2: sx(row.before), y1: cy, y2: cy, stroke: C.ink3, "stroke-width": 2, "stroke-linecap": "round" }, svg);

      const points = [
        { value: row.before, color: C.ink3, name: d.names.before },
        { value: row.after, color: C.ink, name: d.names.after },
      ];
      for (const p of points) {
        const cx = sx(p.value);
        const valueText = `${p.value} ${d.unit}`;
        el("circle", { cx, cy, r: 5.5, fill: p.color, stroke: C.card, "stroke-width": 2 }, svg);
        const nearLeft = cx - x0 < 34;
        text(svg, nearLeft ? cx - 6 : cx, cy + 22, valueText, "val", nearLeft ? "start" : "middle");
        const hit = el("circle", { cx, cy, r: 13, class: "hit", tabindex: 0, role: "img", "aria-label": `${p.name}, ${row.label}: ${valueText}` }, svg);
        bindHover(hit, () => tip.show(cx, cy - 4, valueText, `${p.name.toLowerCase()} · ${row.label}`), tip.hide);
      }
    });

    plot.querySelector("svg")?.remove();
    plot.prepend(svg);
  }

  /* One series over an ordered x: a line with a crosshair that snaps to the nearest x. */
  function line(fig, d) {
    const plot = fig.querySelector(".plot");
    const tip = fig._tip;
    const W = Math.max(280, plot.clientWidth);
    const H = 240;
    const m = { l: 48, r: 64, t: 22, b: 38 };
    const n = d.x.length;
    const sx = (i) => m.l + (i / (n - 1)) * (W - m.l - m.r);
    const sy = (v) => m.t + (1 - (v - d.min) / (d.max - d.min)) * (H - m.t - m.b);
    const pct = (v) => `${(v * 100).toFixed(1)}%`;

    const svg = el("svg", { width: W, height: H, viewBox: `0 0 ${W} ${H}`, role: "group", "aria-labelledby": fig.dataset.titleId });

    for (let t = d.min; t <= d.max + 1e-9; t += d.step) {
      const y = sy(t);
      el("line", { x1: m.l, x2: W - m.r, y1: y, y2: y, stroke: C.grid, "stroke-width": 1, "shape-rendering": "crispEdges" }, svg);
      text(svg, m.l - 9, y + 5, `${Math.round(t * 100)}%`, "lbl", "end");
    }
    d.x.forEach((xv, i) => text(svg, sx(i), H - m.b + 24, i === 0 ? `${d.xLabel} ${xv}` : String(xv), "lbl", "middle"));

    const path = d.y.map((v, i) => `${i ? "L" : "M"}${sx(i).toFixed(1)},${sy(v).toFixed(1)}`).join(" ");
    el("path", { d: path, fill: "none", stroke: C.ink, "stroke-width": 2, "stroke-linejoin": "round", "stroke-linecap": "round" }, svg);
    d.y.forEach((v, i) => el("circle", { cx: sx(i), cy: sy(v), r: 4.5, fill: C.ink, stroke: C.card, "stroke-width": 2 }, svg));

    // label only the ends
    text(svg, sx(0) + 9, sy(d.y[0]) + 19, pct(d.y[0]), "val", "start");
    text(svg, sx(n - 1) + 10, sy(d.y[n - 1]) + 5, pct(d.y[n - 1]), "val", "start");

    const cross = el("line", { x1: 0, x2: 0, y1: m.t, y2: H - m.b, stroke: C.ink2, "stroke-width": 1, opacity: 0 }, svg);
    const overlay = el("rect", {
      x: m.l - 12, y: m.t - 8, width: W - m.l - m.r + 24, height: H - m.t - m.b + 16,
      class: "hit", tabindex: 0, role: "img", "aria-label": d.alt,
    }, svg);

    let current = n - 1;
    const showAt = (i) => {
      current = i;
      const cx = sx(i);
      cross.setAttribute("x1", cx);
      cross.setAttribute("x2", cx);
      cross.setAttribute("opacity", 1);
      const extra = d.f1 ? ` · F1 ${d.f1[i].toFixed(3)}` : "";
      tip.show(cx, sy(d.y[i]) - 4, pct(d.y[i]), `${d.seriesName} · ${d.xLabel.toLowerCase()} ${d.x[i]}${extra}`);
    };
    const hide = () => {
      cross.setAttribute("opacity", 0);
      tip.hide();
    };
    overlay.addEventListener("pointermove", (e) => {
      const px = e.clientX - svg.getBoundingClientRect().left;
      let best = 0;
      for (let i = 1; i < n; i++) if (Math.abs(sx(i) - px) < Math.abs(sx(best) - px)) best = i;
      showAt(best);
    });
    overlay.addEventListener("pointerleave", hide);
    overlay.addEventListener("focus", () => showAt(current));
    overlay.addEventListener("blur", hide);
    overlay.addEventListener("keydown", (e) => {
      if (e.key === "ArrowLeft") { showAt(Math.max(0, current - 1)); e.preventDefault(); }
      if (e.key === "ArrowRight") { showAt(Math.min(n - 1, current + 1)); e.preventDefault(); }
    });

    plot.querySelector("svg")?.remove();
    plot.prepend(svg);
  }

  const renderers = { dumbbell, line };

  function draw(fig) {
    const data = JSON.parse(fig.querySelector('script[type="application/json"]').textContent);
    if (!fig._tip) fig._tip = makeTooltip(fig.querySelector(".plot"));
    renderers[fig.dataset.chart](fig, data);
  }

  for (const fig of document.querySelectorAll("figure.chart[data-chart]")) {
    const plot = fig.querySelector(".plot");
    draw(fig);
    let lastWidth = plot.clientWidth;
    let frame = 0;
    new ResizeObserver(() => {
      if (plot.clientWidth === lastWidth) return;
      lastWidth = plot.clientWidth;
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => draw(fig));
    }).observe(plot);
  }
})();
