"use strict";

/* =========================================================
   creature.js — espèces aléatoires et animation du Tamago-vee
   ---------------------------------------------------------
   - genererEspece(graine) : invente une espèce (type, couleurs,
     oreilles, queue, motifs, noms d'évolution) de façon
     reproductible à partir d'un nombre.
   - Un petit moteur d'animation (requestAnimationFrame) fait
     vivre chaque partie du corps : marche, respiration, sauts,
     queue, oreilles, ailes, clignements, regard, mastication.
   ========================================================= */

const Creature = (() => {
  /* ---------- Hasard ---------- */

  function rng(graine) {
    let a = graine >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const pick = (r, liste) => liste[Math.floor(r() * liste.length)];
  const hasard = (a, b) => a + Math.random() * (b - a);
  const nouvelleGraine = () => Math.floor(Math.random() * 2 ** 31);

  /* ---------- Types ---------- */

  const ELEMENTS = {
    feu: {
      nom: "Feu", icone: "🔥",
      palettes: [["#ff8a5b", "#c94f2c", "#ffe3cc", "#ffc233"], ["#ff6b6b", "#b8323f", "#ffe3e0", "#ffb347"]],
      oreilles: ["pointues", "cornes", "rondes"], queues: ["flamme"], motifs: ["ventre", "front"], extras: ["meche", "pics"],
      syllabes: ["Pyr", "Flam", "Brais", "Cendr", "Tis"],
    },
    eau: {
      nom: "Eau", icone: "💧",
      palettes: [["#5ec8f2", "#2a78b8", "#e3f7ff", "#ffd166"], ["#6fd3c7", "#23867b", "#e6fbf7", "#8ecae6"]],
      oreilles: ["nageoires", "rondes", "aucune"], queues: ["poisson", "ronde"], motifs: ["ventre", "taches"], extras: ["crete", "aucun"],
      syllabes: ["Aqu", "Plouf", "Ond", "Mar", "Bull"],
    },
    plante: {
      nom: "Plante", icone: "🌿",
      palettes: [["#8fd694", "#3a8f53", "#f1fbe9", "#ff9fb9"], ["#b5d96b", "#5f8c45", "#f7fbe9", "#ffd166"]],
      oreilles: ["feuilles", "rondes"], queues: ["feuille", "ronde"], motifs: ["taches", "ventre"], extras: ["fleur"],
      syllabes: ["Feuil", "Bourg", "Mouss", "Sylv", "Pouss"],
    },
    electrique: {
      nom: "Électrik", icone: "⚡",
      palettes: [["#ffd84d", "#c98a00", "#fff6c9", "#4d7cff"], ["#ffe066", "#d9770b", "#fff9db", "#ff6b6b"]],
      oreilles: ["antennes", "pointues"], queues: ["eclair"], motifs: ["rayures", "front"], extras: ["ailes", "aucun"],
      syllabes: ["Volt", "Zapp", "Étinc", "Ohm", "Watt"],
    },
    glace: {
      nom: "Glace", icone: "❄️",
      palettes: [["#c7e8ff", "#6f9fc8", "#ffffff", "#8ad8ff"], ["#d6f0ff", "#7f9fb8", "#ffffff", "#b8c0ff"]],
      oreilles: ["pointues", "rondes"], queues: ["ronde", "poisson"], motifs: ["front", "taches"], extras: ["pics", "aucun"],
      syllabes: ["Givr", "Flok", "Crist", "Neig", "Frim"],
    },
    roche: {
      nom: "Roche", icone: "🪨",
      palettes: [["#c49a6c", "#7d5034", "#f3e3d1", "#e76f51"], ["#b8bfc6", "#5c656d", "#eef1f4", "#f4a261"]],
      oreilles: ["cornes", "rondes"], queues: ["massue", "ronde"], motifs: ["taches", "aucun"], extras: ["pics"],
      syllabes: ["Caill", "Gran", "Rok", "Sabl", "Bloc"],
    },
    fee: {
      nom: "Fée", icone: "✨",
      palettes: [["#ffc6dc", "#d9709b", "#fff1f7", "#b8a1ff"], ["#e4c1f9", "#9d6cc9", "#fbf4ff", "#ffafcc"]],
      oreilles: ["longues", "pointues"], queues: ["ronde"], motifs: ["front", "ventre"], extras: ["ailes", "fleur"],
      syllabes: ["Lumi", "Pix", "Féli", "Ros", "Nimb"],
    },
    ombre: {
      nom: "Ombre", icone: "🌙",
      palettes: [["#8e6bd6", "#46278a", "#d9ccff", "#ff7eb6"], ["#5c6b8a", "#2a3149", "#cfd6e6", "#f9c74f"]],
      oreilles: ["pointues", "cornes", "antennes"], queues: ["eclair", "flamme"], motifs: ["front", "rayures"], extras: ["pics", "ailes"],
      syllabes: ["Nyx", "Ombr", "Brum", "Spectr", "Noct"],
    },
  };

  const SUFFIXES = {
    bebe: ["ou", "i", "o", "ette", "inou"],
    enfant: ["on", "ix", "ane", "ard", "ino"],
    adulte: ["gor", "dras", "lion", "zor", "mios", "rak"],
  };

  function genererEspece(graine) {
    const r = rng(graine);
    const cle = pick(r, Object.keys(ELEMENTS));
    const el = ELEMENTS[cle];
    const [corps, sombre, ventre, accent] = pick(r, el.palettes);
    const racine = pick(r, el.syllabes);
    return {
      graine,
      element: cle,
      nomElement: el.nom,
      icone: el.icone,
      couleurs: { corps, sombre, ventre, accent },
      forme: pick(r, ["rond", "poire", "haricot"]),
      oreilles: pick(r, el.oreilles),
      queue: pick(r, el.queues),
      motif: pick(r, el.motifs),
      extra: pick(r, el.extras),
      yeux: { taille: 0.92 + r() * 0.3, iris: pick(r, ["#4a3b8f", "#2f6f8f", "#8f4a2f", "#2f8f5a", "#8f2f6a"]) },
      noms: {
        bebe: racine + pick(r, SUFFIXES.bebe),
        enfant: racine + pick(r, SUFFIXES.enfant),
        adulte: racine + pick(r, SUFFIXES.adulte),
      },
    };
  }

  /* ---------- Géométrie ---------- */

  const FORMES = {
    rond: { tw: 47, bw: 50, h: 96 },
    poire: { tw: 38, bw: 56, h: 100 },
    haricot: { tw: 40, bw: 42, h: 110 },
  };
  const ECHELLE = { bebe: 0.62, enfant: 0.8, adulte: 1 };
  const CROISSANCE = {
    bebe: { or: 0.75, qu: 0.6, ex: 0 },
    enfant: { or: 0.95, qu: 0.85, ex: 0.7 },
    adulte: { or: 1.15, qu: 1.1, ex: 1 },
  };

  function geometrie(esp, stade) {
    const f = FORMES[esp.forme];
    const h = stade === "bebe" ? f.h * 0.9 : f.h;
    const tw = f.tw, bw = f.bw, W = (tw + bw) / 2;
    const pied = 7;
    const cy = -h / 2 - pied;
    const e = 9 * esp.yeux.taille * (stade === "bebe" ? 1.3 : stade === "enfant" ? 1.12 : 1);
    return {
      tw, bw, W, h, cy, pied, e,
      top: cy - h / 2,
      oeilX: W * 0.36,
      oeilY: cy - h * 0.05,
      boucheY: cy + h * 0.15,
      k: CROISSANCE[stade],
      s: ECHELLE[stade],
    };
  }

  function cheminCorps(g) {
    const { tw, bw, h, cy } = g;
    const y = (v) => (cy + v).toFixed(1);
    const m = ((tw + bw) / 2) * 1.02;
    return (
      `M0 ${y(-h / 2)} C${tw * 0.95} ${y(-h / 2)} ${tw * 1.05} ${y(-h * 0.18)} ${m} ${y(h * 0.05)} ` +
      `C${bw * 1.02} ${y(h * 0.28)} ${bw * 0.92} ${y(h / 2)} 0 ${y(h / 2)} ` +
      `C${-bw * 0.92} ${y(h / 2)} ${-bw * 1.02} ${y(h * 0.28)} ${-m} ${y(h * 0.05)} ` +
      `C${-tw * 1.05} ${y(-h * 0.18)} ${-tw * 0.95} ${y(-h / 2)} 0 ${y(-h / 2)}Z`
    );
  }

  /* ---------- Parties du corps ---------- */

  const TRAIT = (c) => `stroke="${c.sombre}" stroke-opacity="0.35" stroke-width="2.5" stroke-linejoin="round"`;

  function oreille(type, s, g, c) {
    if (type === "aucune") return "";
    let ax = s * g.tw * 0.58, ay = g.top + g.h * 0.12;
    if (type === "nageoires") { ax = s * g.W * 0.98; ay = g.cy - g.h * 0.02; }
    if (type === "antennes") { ax = s * g.tw * 0.32; ay = g.top + 6; }
    const k = g.k.or;
    const formes = {
      pointues: `<path d="M-12 5 L6 -34 L17 6 Z" fill="${c.corps}" ${TRAIT(c)}/><path d="M-4 1 L6 -22 L11 3 Z" fill="${c.ventre}" opacity="0.85"/>`,
      longues: `<g transform="rotate(10)"><ellipse cx="2" cy="-26" rx="9.5" ry="29" fill="${c.corps}" ${TRAIT(c)}/><ellipse cx="2" cy="-24" rx="4.5" ry="20" fill="${c.ventre}"/></g>`,
      rondes: `<circle cx="4" cy="-6" r="14" fill="${c.corps}" ${TRAIT(c)}/><circle cx="4" cy="-6" r="7.5" fill="${c.ventre}"/>`,
      nageoires: `<path d="M-4 -2 Q 20 -22 32 -12 Q 24 -2 28 10 Q 12 10 -4 8 Z" fill="${c.sombre}" opacity="0.9"/><path d="M4 0 Q 16 -10 24 -8" stroke="${c.ventre}" stroke-width="2" fill="none" opacity="0.6"/>`,
      feuilles: `<path d="M0 5 Q -12 -18 10 -38 Q 24 -14 0 5 Z" fill="#52b788" stroke="#2d6a4f" stroke-width="2"/><path d="M1 2 Q 4 -16 10 -32" stroke="#2d6a4f" stroke-width="1.8" fill="none"/>`,
      cornes: `<path d="M-6 5 Q -6 -20 12 -36 Q 6 -14 9 5 Z" fill="#fff3d6" stroke="${c.sombre}" stroke-width="2"/>`,
      antennes: `<path d="M0 5 Q 2 -18 10 -32" stroke="${c.sombre}" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="10" cy="-34" r="6.5" fill="${c.accent}" stroke="${c.sombre}" stroke-width="1.5"/>`,
    };
    return `<g class="p-oreille" data-s="${s}" data-px="${ax.toFixed(1)}" data-py="${ay.toFixed(1)}"><g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${s * k} ${k})">${formes[type]}</g></g>`;
  }

  function queue(type, g, c) {
    const ax = g.bw * 0.8, ay = g.cy + g.h * 0.3, k = g.k.qu;
    const formes = {
      flamme: `<g class="p-flamme" data-px="0" data-py="4"><path d="M0 0 Q 18 -2 22 -22 Q 30 -10 34 -32 Q 46 -6 30 7 Q 16 14 0 7 Z" fill="${c.accent}"/><path d="M6 3 Q 18 1 22 -12 Q 30 -2 28 5 Q 18 10 6 6Z" fill="#fff3b0"/></g>`,
      poisson: `<path d="M0 -4 Q 14 -7 22 -2 L 38 -18 Q 33 0 38 15 L 22 4 Q 12 7 0 5 Z" fill="${c.sombre}" opacity="0.9"/>`,
      feuille: `<path d="M0 0 Q 16 -4 20 -20" stroke="${c.sombre}" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M20 -20 Q 8 -42 32 -52 Q 42 -30 20 -20Z" fill="#52b788" stroke="#2d6a4f" stroke-width="2"/>`,
      eclair: `<path d="M0 -3 L 16 -10 L 12 -2 L 30 -18 L 24 -4 L 40 -9 L 18 9 L 22 1 L 6 7 Z" fill="${c.accent}" stroke="${c.sombre}" stroke-width="2" stroke-linejoin="round"/>`,
      ronde: `<circle cx="10" cy="-4" r="13" fill="${c.ventre}" ${TRAIT(c)}/>`,
      massue: `<path d="M0 0 Q 14 -2 24 -10" stroke="${c.corps}" stroke-width="9" fill="none" stroke-linecap="round"/><circle cx="28" cy="-13" r="11" fill="${c.sombre}"/><path d="M28 -27 l3 5 h-6z M42 -13 l-5 3 v-6z M28 1 l3 -5 h-6z" fill="${c.sombre}"/>`,
    };
    return `<g class="p-queue" data-px="${ax.toFixed(1)}" data-py="${ay.toFixed(1)}"><g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${k})">${formes[type]}</g></g>`;
  }

  function ailes(g, c) {
    const k = g.k.ex;
    if (!k) return "";
    return [-1, 1]
      .map((s) => {
        const ax = s * g.tw * 0.55, ay = g.cy - g.h * 0.12;
        return `<g class="p-aile" data-s="${s}" data-px="${ax.toFixed(1)}" data-py="${ay.toFixed(1)}"><g transform="translate(${ax.toFixed(1)} ${ay.toFixed(1)}) scale(${s * k} ${k})"><path d="M0 4 Q 22 -34 48 -20 Q 36 -10 42 2 Q 26 -2 0 10 Z" fill="${c.ventre}" opacity="0.92" stroke="${c.accent}" stroke-width="2.5"/><path d="M8 2 Q 24 -16 38 -14" stroke="${c.accent}" stroke-width="1.5" fill="none" opacity="0.7"/></g></g>`;
      })
      .join("");
  }

  function decorTete(type, g, c) {
    const k = g.k.ex;
    if (!k) return "";
    const t = g.top;
    switch (type) {
      case "pics":
        return [-16, 0, 16]
          .map((x, i) => `<path d="M${x - 9} ${t + 10} L${x} ${t - (i === 1 ? 16 : 11) * k} L${x + 9} ${t + 10}Z" fill="${c.sombre}"/>`)
          .join("");
      case "meche":
        return `<g class="p-flamme" data-px="0" data-py="${t + 4}"><path d="M-10 ${t + 6} Q -12 ${t - 14 * k} 0 ${t - 26 * k} Q 2 ${t - 12 * k} 10 ${t - 18 * k} Q 14 ${t - 2} 8 ${t + 6} Z" fill="${c.accent}"/></g>`;
      case "crete":
        return `<path d="M-14 ${t + 8} Q -6 ${t - 26 * k} 20 ${t - 14 * k} Q 8 ${t - 4} 14 ${t + 8} Z" fill="${c.sombre}" opacity="0.9"/>`;
      case "fleur": {
        const fx = 8, fy = t - 12 * k;
        const petales = [0, 72, 144, 216, 288]
          .map((a) => `<ellipse cx="${fx}" cy="${fy - 7 * k}" rx="${4.5 * k}" ry="${7 * k}" fill="${c.accent}" transform="rotate(${a} ${fx} ${fy})"/>`)
          .join("");
        return `<path d="M2 ${t + 8} Q 4 ${t - 2} ${fx} ${fy}" stroke="#2d6a4f" stroke-width="3" fill="none"/>${petales}<circle cx="${fx}" cy="${fy}" r="${4 * k}" fill="#ffd166"/>`;
      }
      default:
        return "";
    }
  }

  function motif(type, g, c, graine) {
    switch (type) {
      case "ventre":
        return `<ellipse cx="0" cy="${g.cy + g.h * 0.22}" rx="${g.W * 0.62}" ry="${g.h * 0.32}" fill="${c.ventre}"/>`;
      case "taches": {
        const r = rng(graine + 7);
        const points = [[-0.72, -0.22], [0.68, 0.02], [-0.55, 0.3], [0.42, -0.4], [0.8, 0.32]];
        return points
          .map(([px, py]) => `<circle cx="${(px * g.W).toFixed(1)}" cy="${(g.cy + py * g.h).toFixed(1)}" r="${(5 + r() * 6).toFixed(1)}" fill="${c.sombre}" opacity="0.3"/>`)
          .join("");
      }
      case "rayures":
        return [8, 18, 28]
          .map((d) => `<path d="M${-g.W * 0.55} ${g.top + d + 6} Q 0 ${g.top + d - 8} ${g.W * 0.55} ${g.top + d + 6}" stroke="${c.sombre}" stroke-width="5" fill="none" opacity="0.4"/>`)
          .join("");
      default:
        return "";
    }
  }

  function bras(g, c) {
    return [-1, 1]
      .map((s) => {
        const ax = s * g.W * 0.9, ay = g.cy + g.h * 0.1;
        return `<g class="p-bras" data-s="${s}" data-px="${ax.toFixed(1)}" data-py="${ay.toFixed(1)}"><ellipse cx="${(ax + s * 3).toFixed(1)}" cy="${(ay + 9).toFixed(1)}" rx="7" ry="11" fill="${c.corps}" ${TRAIT(c)}/></g>`;
      })
      .join("");
  }

  function pieds(g, c) {
    return [-1, 1]
      .map((s) => {
        const px = s * g.bw * 0.45, py = -g.pied + 2;
        return `<g class="p-pied" data-px="${px.toFixed(1)}" data-py="${py}"><ellipse cx="${px.toFixed(1)}" cy="${py}" rx="13" ry="7.5" fill="${c.sombre}"/></g>`;
      })
      .join("");
  }

  /* ---------- Visage ---------- */

  const ENCRE = "#1f1d36";
  const BOUCHE = "#7a1f3d";

  function visage(esp, g, expr) {
    const c = esp.couleurs;
    const e = expr === "surpris" ? g.e * 1.12 : g.e;
    const y = g.oeilY;
    const by = g.boucheY;

    const ouvert = (x, s) => {
      let extra = "";
      if (expr === "fatigue") {
        extra =
          `<path d="M${x - e * 1.2} ${y - e * 1.35} H${x + e * 1.2} V${y - e * 0.05} Q${x} ${y + e * 0.25} ${x - e * 1.2} ${y - e * 0.05}Z" fill="${c.corps}"/>` +
          `<path d="M${x - e} ${y - e * 0.02} Q${x} ${y + e * 0.22} ${x + e} ${y - e * 0.02}" stroke="${ENCRE}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
      }
      if (expr === "triste") {
        extra = `<path d="M${x + s * e * 1.15} ${y - e * 1.4} L${x - s * e * 0.45} ${y - e * 1.95}" stroke="${ENCRE}" stroke-width="2.6" stroke-linecap="round"/>`;
      }
      if (expr === "malade") {
        return (
          `<g><ellipse cx="${x}" cy="${y}" rx="${e}" ry="${e * 1.15}" fill="#fff"/>` +
          `<path d="M${x - e * 0.55} ${y} a${e * 0.55} ${e * 0.55} 0 1 1 ${e * 1.1} 0 a${e * 0.38} ${e * 0.38} 0 1 1 ${-e * 0.76} 0 a${e * 0.2} ${e * 0.2} 0 1 1 ${e * 0.4} 0" stroke="${ENCRE}" stroke-width="2.2" fill="none"/></g>`
        );
      }
      const pupilleR = expr === "surpris" ? 0.42 : 0.62;
      return (
        `<g class="p-oeil" data-px="${x.toFixed(1)}" data-py="${y.toFixed(1)}">` +
        `<ellipse cx="${x}" cy="${y}" rx="${e}" ry="${e * 1.18}" fill="${ENCRE}"/>` +
        `<g class="p-pupille">` +
        `<ellipse cx="${x}" cy="${y + e * 0.28}" rx="${e * pupilleR}" ry="${e * pupilleR * 1.1}" fill="${esp.yeux.iris}"/>` +
        `<circle cx="${x - e * 0.32}" cy="${y - e * 0.42}" r="${e * 0.36}" fill="#fff"/>` +
        `<circle cx="${x + e * 0.36}" cy="${y + e * 0.36}" r="${e * 0.16}" fill="#fff" opacity="0.85"/>` +
        `</g>${extra}</g>`
      );
    };
    const arc = (x, haut) =>
      `<path d="M${x - e} ${y + e * 0.3} Q${x} ${y + (haut ? -e * 1.1 : e * 0.9)} ${x + e} ${y + e * 0.3}" stroke="${ENCRE}" stroke-width="${(e * 0.42).toFixed(1)}" fill="none" stroke-linecap="round"/>`;

    let yeux;
    if (expr === "joie" || expr === "mange") yeux = arc(-g.oeilX, true) + arc(g.oeilX, true);
    else if (expr === "dodo") yeux = arc(-g.oeilX, false) + arc(g.oeilX, false);
    else yeux = ouvert(-g.oeilX, -1) + ouvert(g.oeilX, 1);

    const bouches = {
      neutre: `<path d="M-7 ${by} Q 0 ${by + 7} 7 ${by}" stroke="${ENCRE}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      joie: `<path d="M-11 ${by - 2} Q 0 ${by + 17} 11 ${by - 2} Z" fill="${BOUCHE}"/><ellipse cx="0" cy="${by + 6.5}" rx="5" ry="3.2" fill="#ff7a93"/>`,
      mange: `<g class="p-bouche" data-px="0" data-py="${by}"><ellipse cx="0" cy="${by + 1}" rx="8" ry="7" fill="${BOUCHE}"/><ellipse cx="0" cy="${by + 4}" rx="4.5" ry="2.5" fill="#ff7a93"/></g>`,
      triste: `<path d="M-7 ${by + 4} Q 0 ${by - 4} 7 ${by + 4}" stroke="${ENCRE}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
      fatigue: `<ellipse cx="0" cy="${by + 1}" rx="3.5" ry="4.5" fill="${BOUCHE}"/>`,
      surpris: `<ellipse cx="0" cy="${by + 1}" rx="5" ry="6.5" fill="${BOUCHE}"/>`,
      dodo: `<path d="M-4 ${by + 1} Q 0 ${by + 4} 4 ${by + 1}" stroke="${ENCRE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
      malade: `<path d="M-9 ${by + 2} q 3 -4 6 0 t 6 0 t 6 0" stroke="${ENCRE}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,
    };

    const joues = ["neutre", "joie", "mange", "surpris"].includes(expr)
      ? [-1, 1].map((s) => `<ellipse cx="${s * g.W * 0.6}" cy="${y + e * 1.4}" rx="7" ry="4.5" fill="#ff6b9a" opacity="0.4"/>`).join("")
      : "";
    const larme = expr === "triste" ? `<path d="M${g.oeilX + e * 0.9} ${y + e * 0.9} q-5 9 0 12 q5 -3 0 -12z" fill="#7fc8ff"/>` : "";
    const front = esp.motif === "front"
      ? `<path d="M0 ${g.cy - g.h * 0.36} l6 7 l-6 7 l-6 -7z" fill="${esp.couleurs.accent}" stroke="${esp.couleurs.sombre}" stroke-width="1.5"/>`
      : "";

    return front + joues + yeux + larme + (bouches[expr] || bouches.neutre);
  }

  /* ---------- Assemblage SVG ---------- */

  let compteur = 0;

  function svgBete(esp, stade, expr) {
    const g = geometrie(esp, stade);
    const c = esp.couleurs;
    const clip = `clip-${esp.graine}-${++compteur}`;
    const corps = cheminCorps(g);
    const arriere = (esp.queue ? queue(esp.queue, g, c) : "") + (esp.extra === "ailes" ? ailes(g, c) : "");
    const tete = esp.extra !== "ailes" ? decorTete(esp.extra, g, c) : "";
    const lesOreilles = oreille(esp.oreilles, -1, g, c) + oreille(esp.oreilles, 1, g, c);
    const reflet = `<ellipse cx="${-g.W * 0.42}" cy="${g.cy - g.h * 0.3}" rx="${g.W * 0.2}" ry="${g.h * 0.1}" fill="#fff" opacity="0.4" transform="rotate(-25 ${-g.W * 0.42} ${g.cy - g.h * 0.3})"/>`;

    return `
      <svg viewBox="0 0 200 200" class="bete" role="img" aria-label="${esp.noms[stade]}">
        <defs><clipPath id="${clip}"><path d="${corps}"/></clipPath></defs>
        <ellipse class="p-ombre" cx="100" cy="192" rx="${(g.bw * g.s * 0.95).toFixed(1)}" ry="6" fill="rgba(0,0,0,0.14)"/>
        <g transform="translate(100 190) scale(${g.s})">
          <g class="p-anim">
            ${arriere}
            ${pieds(g, c)}
            <g class="p-corps">
              ${tete}
              ${lesOreilles}
              <path d="${corps}" fill="${c.corps}" ${TRAIT(c)}/>
              <g clip-path="url(#${clip})">${motif(esp.motif, g, c, esp.graine)}${reflet}</g>
              ${bras(g, c)}
              <g class="p-visage">${visage(esp, g, expr)}</g>
            </g>
          </g>
        </g>
      </svg>`;
  }

  function nbFissures(progres) {
    return progres < 0.45 ? 0 : Math.min(5, Math.ceil((progres - 0.45) / 0.11));
  }

  function svgOeuf(esp, progres = 0, statique = false) {
    const c = esp.couleurs;
    const clip = `clipo-${esp.graine}-${++compteur}`;
    const fissures = ["M76 98 l8 8 l-4 8 l9 6", "M122 90 l-6 10 l6 6 l-4 10", "M70 132 l10 -4 l6 8 l10 -6", "M112 140 l8 -8 l8 6 l8 -8", "M96 68 l4 10 l-6 8 l6 8"]
      .slice(0, nbFissures(progres))
      .map((d) => `<path d="${d}" stroke="${ENCRE}" stroke-width="2.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`)
      .join("");
    return `
      <svg viewBox="0 0 200 200" class="bete" role="img" aria-label="Un œuf">
        <defs><clipPath id="${clip}"><ellipse cx="100" cy="120" rx="54" ry="70"/></clipPath></defs>
        <ellipse class="p-ombre" cx="100" cy="192" rx="46" ry="6" fill="rgba(0,0,0,0.14)"/>
        <g class="p-oeuf${statique ? " anim-oeuf" : ""}">
          <ellipse cx="100" cy="120" rx="54" ry="70" fill="#fffaf2"/>
          <g clip-path="url(#${clip})">
            <path d="M40 132 l15 -12 l15 12 l15 -12 l15 12 l15 -12 l15 12 l15 -12 l15 12 V 200 H40Z" fill="${c.corps}"/>
            <path d="M40 132 l15 -12 l15 12 l15 -12 l15 12 l15 -12 l15 12 l15 -12 l15 12" stroke="${c.sombre}" stroke-width="3" fill="none" opacity="0.5"/>
            <circle cx="80" cy="88" r="9" fill="${c.accent}"/>
            <circle cx="124" cy="98" r="6" fill="${c.corps}"/>
            <circle cx="114" cy="68" r="4.5" fill="${c.accent}"/>
          </g>
          <ellipse cx="100" cy="120" rx="54" ry="70" fill="none" stroke="${c.sombre}" stroke-opacity="0.35" stroke-width="3"/>
          <ellipse cx="80" cy="84" rx="10" ry="17" fill="#fff" opacity="0.55" transform="rotate(-20 80 84)"/>
          ${fissures}
        </g>
      </svg>`;
  }

  /* ---------- Effets (particules) ---------- */

  function effet(conteneur, classe, contenu, vars = {}, duree = 1600) {
    const el = document.createElement("span");
    el.className = `effet ${classe}`;
    el.textContent = contenu;
    for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
    conteneur.appendChild(el);
    setTimeout(() => el.remove(), duree);
    return el;
  }

  function etincelles(conteneur, n) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      effet(conteneur, "effet-etincelle", ["✨", "⭐", "🌟"][i % 3], {
        "--dx": `${(Math.cos(a) * hasard(60, 100)).toFixed(0)}px`,
        "--dy": `${(Math.sin(a) * hasard(50, 85)).toFixed(0)}px`,
      }, 1100);
    }
  }

  /* =========================================================
     Moteur d'animation
     ========================================================= */

  const A = {
    zone: null, conteneur: null, holder: null,
    parts: {}, cle: "", expr: "", espece: null, stade: null, geo: null,
    fissures: -1, progresOeuf: 0,
    x: 0, cibleX: 0, dir: 1, marcheT: 0, prochaineErrance: 0,
    saut: null, atterri: 0,
    prochainBlink: 0, blinkJusqua: 0,
    regard: { x: 0, y: 0 }, regardForce: null, regardLibre: { x: 0, y: 0 }, prochainRegard: 0,
    pointeur: null,
    macheJusqua: 0, salutJusqua: 0, secousseJusqua: 0,
    oreilleTic: 0, oreilleDebut: 0, oreilleChoisie: 0,
    prochainZ: 0,
    balle: null,
    verrou: false, attente: null, mode: "idle",
    peutBouger: () => false,
    dernier: 0,
    reduit: false,
  };

  function init(zone, conteneur, holder, options = {}) {
    A.zone = zone;
    A.conteneur = conteneur;
    A.holder = holder;
    if (options.peutBouger) A.peutBouger = options.peutBouger;
    try {
      A.reduit = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      A.reduit = false;
    }
    zone.addEventListener("pointermove", (ev) => {
      const r = zone.getBoundingClientRect();
      A.pointeur = { x: ev.clientX - r.left, y: ev.clientY - r.top, t: performance.now() };
    });
    zone.addEventListener("pointerleave", () => (A.pointeur = null));
    requestAnimationFrame(frame);
  }

  function q(sel) {
    return [...A.holder.querySelectorAll(sel)];
  }

  function cacherParts() {
    A.parts = {
      anim: q(".p-anim")[0],
      corps: q(".p-corps")[0],
      queue: q(".p-queue")[0],
      oreilles: q(".p-oreille"),
      ailes: q(".p-aile"),
      pieds: q(".p-pied"),
      bras: q(".p-bras"),
      oeils: q(".p-oeil"),
      pupilles: q(".p-pupille"),
      bouche: q(".p-bouche")[0],
      flammes: q(".p-flamme"),
      ombre: q(".p-ombre")[0],
      oeuf: q(".p-oeuf")[0],
      visage: q(".p-visage")[0],
    };
  }

  function construire(esp, stade, expr, progres = A.progresOeuf) {
    A.espece = esp;
    A.stade = stade;
    A.expr = expr;
    A.cle = `${esp.graine}|${stade}`;
    if (stade === "oeuf") {
      A.fissures = nbFissures(progres);
      A.holder.innerHTML = svgOeuf(esp, progres);
      A.geo = null;
    } else {
      A.holder.innerHTML = svgBete(esp, stade, expr);
      A.geo = geometrie(esp, stade);
    }
    cacherParts();
  }

  /** Point d'entrée : l'appli décrit ce qu'elle veut voir, le moteur s'occupe des transitions. */
  function maj(esp, stade, expr, progres = 0) {
    A.progresOeuf = progres;
    if (A.verrou) {
      A.attente = [esp, stade, expr, progres];
      return;
    }
    const cle = `${esp.graine}|${stade}`;
    if (cle !== A.cle) {
      const [graineAvant, stadeAvant] = A.cle ? A.cle.split("|") : [];
      const meme = A.cle && Number(graineAvant) === esp.graine;
      if (meme && stadeAvant === "oeuf" && stade !== "oeuf") return eclosion(esp, stade, expr);
      if (meme && stadeAvant !== "oeuf" && stade !== "oeuf") return evolution(esp, stadeAvant, stade, expr);
      A.x = A.cibleX = 0;
      construire(esp, stade, expr, progres);
      return;
    }
    if (stade === "oeuf") {
      if (nbFissures(progres) !== A.fissures) construire(esp, stade, expr, progres);
      return;
    }
    if (expr !== A.expr) {
      A.expr = expr;
      A.parts.visage.innerHTML = visage(esp, A.geo, expr);
      A.parts.oeils = q(".p-oeil");
      A.parts.pupilles = q(".p-pupille");
      A.parts.bouche = q(".p-bouche")[0];
    }
  }

  function deverrouiller() {
    A.verrou = false;
    A.mode = "idle";
    if (A.attente) {
      const [esp, stade, expr, progres] = A.attente;
      A.attente = null;
      maj(esp, stade, expr, progres);
    }
  }

  function eclosion(esp, stade, expr) {
    A.verrou = true;
    A.mode = "eclosion";
    A.attente = [esp, stade, expr, 1];
    const debut = performance.now();
    A.eclosionDebut = debut;
    setTimeout(() => A.holder.classList.add("flash"), 950);
    setTimeout(() => {
      construire(esp, stade, "surpris");
      A.mode = "idle";
      A.holder.classList.remove("flash");
      A.holder.classList.remove("apparition");
      void A.holder.offsetWidth;
      A.holder.classList.add("apparition");
      for (let i = 0; i < 9; i++) {
        const a = (i / 9) * Math.PI * 2;
        effet(A.conteneur, "effet-coquille", "", {
          "--dx": `${(Math.cos(a) * hasard(70, 115)).toFixed(0)}px`,
          "--dy": `${(Math.sin(a) * hasard(50, 95) - 25).toFixed(0)}px`,
          "--r": `${hasard(-320, 320).toFixed(0)}deg`,
        }, 1000);
      }
      etincelles(A.conteneur, 6);
    }, 1200);
    setTimeout(() => {
      A.holder.classList.remove("apparition");
      sauter(26);
      deverrouiller();
    }, 2000);
  }

  function evolution(esp, ancien, nouveau, expr) {
    A.verrou = true;
    A.mode = "evolution";
    A.attente = [esp, nouveau, expr, 1];
    A.cibleX = A.x;
    construire(esp, ancien, "surpris");
    A.holder.classList.add("silhouette");
    const delais = [500, 420, 340, 280, 230, 190, 160, 130, 110, 95, 80, 70, 60, 55];
    let t = 300;
    delais.forEach((d, i) => {
      t += d;
      setTimeout(() => construire(esp, i % 2 === 0 ? nouveau : ancien, "surpris"), t);
    });
    setTimeout(() => {
      construire(esp, nouveau, "joie");
      A.holder.classList.remove("silhouette");
      A.conteneur.classList.remove("brille");
      void A.conteneur.offsetWidth;
      A.conteneur.classList.add("brille");
      etincelles(A.conteneur, 12);
      sauter(30);
    }, t + 200);
    setTimeout(() => {
      A.conteneur.classList.remove("brille");
      deverrouiller();
    }, t + 1500);
  }

  /* ---------- Commandes ---------- */

  function sauter(h = 24) {
    if (A.saut || A.stade === "oeuf") return;
    A.saut = { t0: performance.now(), duree: 380 + h * 6, h };
  }
  function secouer(ms = 700) {
    A.secousseJusqua = performance.now() + ms;
  }
  function macher(ms = 1600) {
    A.macheJusqua = performance.now() + ms;
  }
  function saluer(ms = 1100) {
    A.salutJusqua = performance.now() + ms;
  }
  /** Fait regarder un point de la zone (en px), ou vers le haut si non précisé. */
  function regarder(point, ms = 900) {
    A.regardForce = { point, jusqua: performance.now() + ms };
  }

  function hauteurBouche() {
    if (!A.geo) return "75%";
    return `${(((190 + A.geo.boucheY * A.geo.s) / 200) * 100).toFixed(1)}%`;
  }

  function lancerBalle() {
    if (A.balle || !A.zone) return;
    const W = A.zone.clientWidth;
    const depuisDroite = A.x < 0;
    const el = document.createElement("span");
    el.className = "balle";
    el.textContent = "⚽";
    A.zone.appendChild(el);
    A.balle = {
      el,
      x: depuisDroite ? W + 20 : -20,
      y: 70,
      vx: (depuisDroite ? -1 : 1) * hasard(150, 190),
      vy: 120,
      rot: 0,
      t0: performance.now(),
      coups: 0,
      dernierCoup: 0,
    };
  }

  /* ---------- Boucle ---------- */

  function poser(el, transform) {
    if (el) el.setAttribute("transform", transform);
  }
  const num = (el, k) => Number(el.dataset[k]);
  const pivot = (el, a) => `rotate(${a.toFixed(2)} ${el.dataset.px} ${el.dataset.py})`;

  function majBalle(dt, now) {
    const b = A.balle;
    const W = A.zone.clientWidth;
    b.vy -= 900 * dt;
    b.y += b.vy * dt;
    if (b.y < 0) {
      b.y = 0;
      b.vy = Math.abs(b.vy) > 60 ? -b.vy * 0.6 : 0;
      b.vx *= 0.97;
    }
    b.x += b.vx * dt;
    b.rot += b.vx * dt * 3.2;
    if (b.coups < 3) {
      if (b.x < 16 && b.vx < 0 && now - b.t0 > 600) b.vx = Math.abs(b.vx);
      if (b.x > W - 16 && b.vx > 0 && now - b.t0 > 600) b.vx = -Math.abs(b.vx);
    }
    // il court après la balle
    const marge = Math.max(0, W / 2 - 70);
    A.cibleX = Math.max(-marge, Math.min(marge, b.x - W / 2));
    const distance = b.x - W / 2 - A.x;
    if (Math.abs(distance) < 36 && b.y < 55 && !A.saut && now - b.dernierCoup > 550 && b.coups < 3) {
      sauter(30);
      b.coups++;
      b.dernierCoup = now;
      const sens = b.coups >= 3 ? (b.x < W / 2 ? -1 : 1) : Math.sign(distance) || A.dir;
      b.vx = sens * hasard(170, 240);
      b.vy = hasard(330, 430);
    }
    b.el.style.left = `${(b.x - 15).toFixed(1)}px`;
    b.el.style.bottom = `${(22 + b.y).toFixed(1)}px`;
    b.el.style.transform = `rotate(${b.rot.toFixed(0)}deg)`;
    if (now - b.t0 > 6000 || b.x < -50 || b.x > W + 50) {
      b.el.remove();
      A.balle = null;
      A.cibleX = A.x;
      saluer(900);
      sauter(20);
    }
  }

  function animerOeuf(t, now) {
    const p = A.parts;
    if (!p.oeuf) return;
    const intense = A.mode === "eclosion" ? 1 : A.progresOeuf;
    const salve = A.mode === "eclosion" ? 1 : Math.max(0.12, Math.sin(t * 1.4) > 0.35 ? 1 : 0);
    const vitesse = 6 + intense * 18;
    const angle = Math.sin(t * vitesse) * (2 + intense * 9) * salve * (A.reduit ? 0.3 : 1);
    const hop = intense > 0.8 ? -Math.abs(Math.sin(t * 9)) * 5 * salve : 0;
    poser(p.oeuf, `translate(0 ${hop.toFixed(2)}) rotate(${angle.toFixed(2)} 100 188)`);
    if (A.mode === "eclosion") {
      const k = Math.min(1, (now - A.eclosionDebut) / 1000);
      poser(p.oeuf, `translate(${(Math.sin(t * 60) * 3 * k).toFixed(2)} ${hop.toFixed(2)}) rotate(${(angle * (1 + k)).toFixed(2)} 100 188)`);
    }
  }

  function cibleRegard(now) {
    // point à regarder, en px dans la zone
    if (A.balle) return { x: A.balle.x, y: A.zone.clientHeight - 36 - A.balle.y };
    if (A.regardForce && now < A.regardForce.jusqua) {
      return A.regardForce.point || { x: A.zone.clientWidth / 2 + A.x, y: -40 };
    }
    if (A.pointeur && now - A.pointeur.t < 2500) return A.pointeur;
    return null;
  }

  function positionYeux() {
    const H = A.zone.clientHeight;
    const echellePx = A.holder.clientWidth / 200;
    const yLocal = 190 + A.geo.oeilY * A.geo.s;
    const basHolder = H - 10; // la créature est posée à 10px du bas de la zone
    return {
      x: A.zone.clientWidth / 2 + A.x,
      y: basHolder - (200 - yLocal) * echellePx,
    };
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - (A.dernier || now)) / 1000);
    A.dernier = now;
    const t = now / 1000;
    const p = A.parts;
    const m = A.reduit ? 0.3 : 1;
    if (!A.holder || (!p.anim && !p.oeuf)) return;
    if (A.stade === "oeuf" || A.mode === "eclosion") {
      if (p.oeuf) animerOeuf(t, now);
      return;
    }
    if (!p.anim) return;

    if (A.balle) majBalle(dt, now);

    /* --- déplacement --- */
    const libre = A.peutBouger() && !A.verrou && A.mode === "idle";
    if (!A.balle) {
      if (!libre) {
        A.cibleX = A.x;
      } else if (now > A.prochaineErrance) {
        const W = A.zone.clientWidth;
        const marge = Math.max(0, W / 2 - 90);
        A.cibleX = Math.random() < 0.3 ? A.x : hasard(-marge, marge);
        A.prochaineErrance = now + hasard(2600, 6000);
      }
    }
    const ecart = A.cibleX - A.x;
    let marche = false;
    if (Math.abs(ecart) > 1.5 && (libre || A.balle)) {
      const vitesse = (A.balle ? 175 : 62) * (A.reduit ? 0.5 : 1);
      A.x += Math.sign(ecart) * Math.min(Math.abs(ecart), vitesse * dt);
      A.dir = Math.sign(ecart);
      marche = true;
      A.marcheT += dt * (A.balle ? 17 : 11);
    }
    A.conteneur.style.transform = `translateX(${A.x.toFixed(1)}px)`;
    A.holder.classList.toggle("gauche", A.dir < 0);

    /* --- saut, écrasement --- */
    const s = A.geo.s;
    let sautY = 0, sx = 1, sy = 1;
    if (A.saut) {
      const k = (now - A.saut.t0) / A.saut.duree;
      if (k >= 1) {
        A.saut = null;
        A.atterri = now;
      } else if (k < 0.14) {
        // élan : il se tasse
        const e = k / 0.14;
        sy = 1 - 0.16 * Math.sin(e * Math.PI);
        sx = 1 + 0.12 * Math.sin(e * Math.PI);
      } else {
        const kk = (k - 0.14) / 0.86;
        sautY = -4 * A.saut.h * kk * (1 - kk);
        sy = 1 + 0.08 * (1 - kk);
        sx = 1 - 0.05 * (1 - kk);
      }
    }
    if (A.atterri && now - A.atterri < 180) {
      const k = (now - A.atterri) / 180;
      sy = 1 - 0.15 * Math.sin((1 - k) * Math.PI * 0.5);
      sx = 1 + 0.12 * Math.sin((1 - k) * Math.PI * 0.5);
    }

    /* --- respiration, démarche, tremblement --- */
    const expr = A.expr;
    const dodo = expr === "dodo";
    const resp = Math.sin(t * (dodo ? 1.3 : 2.4)) * (dodo ? 0.04 : 0.02) * m;
    const bob = marche ? -Math.abs(Math.sin(A.marcheT)) * 5 * m : 0;
    const balance = marche ? Math.sin(A.marcheT) * 4 * m : 0;
    let tremble = 0;
    if (now < A.secousseJusqua) tremble = Math.sin(t * 48) * 3.5;
    else if (expr === "malade") tremble = Math.sin(t * 40) * 0.8;

    poser(
      p.anim,
      `translate(${(tremble / s).toFixed(2)} ${((sautY + bob) / s).toFixed(2)}) rotate(${balance.toFixed(2)} 0 0) scale(${(sx * (1 - resp * 0.6)).toFixed(4)} ${(sy * (1 + resp)).toFixed(4)})`
    );
    if (p.ombre) {
      const k = 1 + sautY / 160;
      poser(p.ombre, `translate(${100 * (1 - k)} ${192 * (1 - k)}) scale(${k.toFixed(3)})`);
    }

    /* --- pieds --- */
    p.pieds.forEach((el, i) => {
      if (marche) {
        const ph = A.marcheT + (i ? Math.PI : 0);
        const lift = Math.max(0, Math.sin(ph)) * 5;
        poser(el, `translate(0 ${(-lift).toFixed(2)}) ${pivot(el, Math.sin(ph) * 14)}`);
      } else if (A.saut) {
        poser(el, `translate(0 -2) ${pivot(el, (i ? 1 : -1) * 12)}`);
      } else poser(el, "");
    });

    /* --- bras --- */
    const joyeux = expr === "joie" || expr === "mange";
    p.bras.forEach((el) => {
      const cote = num(el, "s");
      let a;
      if (now < A.salutJusqua && cote === 1) a = -120 + Math.sin(t * 18) * 25;
      else if (A.saut) a = -70 * cote;
      else if (marche) a = Math.sin(A.marcheT + (cote > 0 ? Math.PI : 0)) * 25;
      else if (joyeux) a = (-25 + Math.sin(t * 8) * 10) * cote;
      else if (expr === "triste" || dodo) a = 8 * cote;
      else a = Math.sin(t * 2 + cote) * 4;
      poser(el, pivot(el, a * (cote === 1 ? 1 : 1)));
    });

    /* --- queue --- */
    if (p.queue) {
      let a;
      if (dodo) a = Math.sin(t * 1.1) * 3;
      else if (expr === "triste" || expr === "malade") a = 10 + Math.sin(t * 1.5) * 3;
      else if (marche || A.balle) a = Math.sin(t * 10) * 18;
      else if (joyeux) a = Math.sin(t * 9) * 22;
      else a = Math.sin(t * 3.2) * 10;
      poser(p.queue, pivot(p.queue, a * m));
    }
    p.flammes.forEach((el, i) => {
      const fx = 1 + Math.sin(t * 21 + i) * 0.07;
      const fy = 1 + Math.sin(t * 16 + i * 2) * 0.13 * (dodo ? 0.4 : 1);
      const px = el.dataset.px, py = el.dataset.py;
      poser(el, `translate(${px} ${py}) scale(${fx.toFixed(3)} ${fy.toFixed(3)}) translate(${-px} ${-py})`);
    });

    /* --- oreilles --- */
    if (now > A.oreilleTic) {
      A.oreilleDebut = now;
      A.oreilleChoisie = Math.random() < 0.5 ? -1 : 1;
      A.oreilleTic = now + hasard(2200, 6000);
    }
    p.oreilles.forEach((el) => {
      const cote = num(el, "s");
      let a = Math.sin(t * 1.8 + cote) * 3;
      const kt = (now - A.oreilleDebut) / 280;
      if (kt < 1 && cote === A.oreilleChoisie && !dodo) a += Math.sin(kt * Math.PI * 2) * 16;
      if (expr === "triste" || expr === "malade" || dodo) a += 16;
      if (A.saut) a -= 10;
      poser(el, pivot(el, a * cote * m));
    });

    /* --- ailes --- */
    p.ailes.forEach((el) => {
      const cote = num(el, "s");
      const rapide = A.saut || joyeux || A.balle;
      const a = rapide ? Math.sin(t * 20) * 24 : Math.sin(t * 3) * 6;
      poser(el, pivot(el, -a * cote * m));
    });

    /* --- yeux : clignement --- */
    if (now > A.prochainBlink) {
      A.blinkJusqua = now + 130;
      A.prochainBlink = now + (Math.random() < 0.2 ? 260 : hasard(1800, 5200));
    }
    const ferme = now < A.blinkJusqua ? 0.1 : 1;
    p.oeils.forEach((el) => {
      const px = el.dataset.px, py = el.dataset.py;
      poser(el, `translate(${px} ${py}) scale(1 ${ferme}) translate(${-px} ${-py})`);
    });

    /* --- yeux : regard --- */
    if (p.pupilles.length) {
      const e = A.geo.e;
      let cx = 0, cy = 0;
      const cible = cibleRegard(now);
      if (cible) {
        const yeux = positionYeux();
        const dx = cible.x - yeux.x, dy = cible.y - yeux.y;
        const d = Math.hypot(dx, dy) || 1;
        const portee = Math.min(1, d / 60);
        cx = (dx / d) * e * 0.3 * portee * (A.dir < 0 ? -1 : 1);
        cy = (dy / d) * e * 0.25 * portee;
      } else if (marche) {
        cx = e * 0.22;
      } else {
        if (now > A.prochainRegard) {
          A.regardLibre = Math.random() < 0.4 ? { x: 0, y: 0 } : { x: hasard(-1, 1) * e * 0.28, y: hasard(-0.6, 0.6) * e * 0.2 };
          A.prochainRegard = now + hasard(1200, 3200);
        }
        cx = A.regardLibre.x;
        cy = A.regardLibre.y;
      }
      const lissage = Math.min(1, dt * 12);
      A.regard.x += (cx - A.regard.x) * lissage;
      A.regard.y += (cy - A.regard.y) * lissage;
      p.pupilles.forEach((el) => poser(el, `translate(${A.regard.x.toFixed(2)} ${A.regard.y.toFixed(2)})`));
    }

    /* --- bouche qui mâche --- */
    if (p.bouche) {
      const ouverture = now < A.macheJusqua ? 0.3 + 0.7 * Math.abs(Math.sin(t * 13)) : 1;
      const px = p.bouche.dataset.px, py = p.bouche.dataset.py;
      poser(p.bouche, `translate(${px} ${py}) scale(1 ${ouverture.toFixed(3)}) translate(${-px} ${-py})`);
    }

    /* --- Zzz --- */
    if (dodo && now > A.prochainZ) {
      A.prochainZ = now + 1300;
      effet(A.conteneur, "effet-z", Math.random() < 0.5 ? "z" : "Z", { "--dx": `${hasard(20, 45).toFixed(0)}px` }, 2600);
    }
  }

  return {
    ELEMENTS,
    nouvelleGraine,
    genererEspece,
    init,
    maj,
    sauter,
    secouer,
    macher,
    saluer,
    regarder,
    lancerBalle,
    hauteurBouche,
    effet,
    etincelles,
    svgOeuf: (esp) => svgOeuf(esp, 0, true),
    svgStatique: (esp, stade, expr) => svgBete(esp, stade, expr),
    occupe: () => A.verrou || !!A.balle,
  };
})();
