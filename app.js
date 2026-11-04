"use strict";

/* =========================================================
   Tamago-vee — un petit compagnon virtuel
   ---------------------------------------------------------
   Règles du jeu et interface. Le dessin et les animations de la
   créature sont dans creature.js.

   Astuce test : ouvre la page avec ?rapide=1 à la fin de l'adresse
   pour que le temps passe 60 fois plus vite.
   ========================================================= */

const CLE_SAUVEGARDE = "tamagovee-v1";
const VITESSE = new URLSearchParams(location.search).has("rapide") ? 60 : 1;

const SECONDE = 1000;
const MINUTE = 60 * SECONDE;
const HEURE = 60 * MINUTE;
const JOUR = 24 * HEURE;

// Durées de vie (en temps de jeu)
const DUREE_OEUF = 20 * SECONDE;
const AGE_ENFANT = 1 * HEURE;
const AGE_ADULTE = 24 * HEURE;

// Négligence : si une jauge reste à zéro trop longtemps…
const DELAI_MALADIE = 4 * HEURE;
const DELAI_DEPART = 24 * HEURE;

// Rattrapage maximum quand on rouvre la page après une longue absence
const RATTRAPAGE_MAX = 3 * JOUR;

// Évolution des jauges, en points par heure.
// Éveillé, la faim passe de 100 à 0 en ~16 h. Endormi, il peut passer la nuit tranquille.
const TAUX_EVEILLE = { faim: -6, bonheur: -5, energie: -4 };
const TAUX_DODO = { faim: -2, bonheur: 0, energie: 20 };

const STADES = {
  oeuf: "Œuf",
  bebe: "Bébé",
  enfant: "Enfant",
  adulte: "Adulte",
};

/* ---------- État ---------- */

let etat = null;
let timerBulle = null;
let graineAccueil = Creature.nouvelleGraine();

function nouvelEtat(nom, graine) {
  return {
    nom,
    graine, // détermine l'espèce
    ageJeu: 0, // temps de jeu écoulé depuis l'adoption (ms)
    faim: 80, // 100 = rassasié, 0 = affamé
    bonheur: 80,
    energie: 80,
    dodo: false,
    malade: false,
    negligence: 0, // temps passé avec une jauge à zéro (ms)
    parti: false,
    derniereMaj: Date.now(),
    dernierStade: "oeuf",
  };
}

function charger() {
  try {
    const brut = localStorage.getItem(CLE_SAUVEGARDE);
    const e = brut ? JSON.parse(brut) : null;
    if (e && typeof e.graine !== "number") e.graine = Creature.nouvelleGraine(); // ancienne sauvegarde
    return e;
  } catch {
    return null;
  }
}

function sauvegarder() {
  if (!etat) return;
  try {
    localStorage.setItem(CLE_SAUVEGARDE, JSON.stringify(etat));
  } catch {
    /* stockage indisponible : le jeu continue sans sauvegarde */
  }
}

function effacerSauvegarde() {
  try {
    localStorage.removeItem(CLE_SAUVEGARDE);
  } catch {
    /* rien à faire */
  }
}

const cacheEspece = new Map();
function espece(graine) {
  if (!cacheEspece.has(graine)) cacheEspece.set(graine, Creature.genererEspece(graine));
  return cacheEspece.get(graine);
}

/* ---------- Règles du jeu ---------- */

const borner = (v) => Math.max(0, Math.min(100, v));

function stade(e) {
  if (e.ageJeu < DUREE_OEUF) return "oeuf";
  const age = e.ageJeu - DUREE_OEUF;
  if (age < AGE_ENFANT) return "bebe";
  if (age < AGE_ADULTE) return "enfant";
  return "adulte";
}

/** Fait avancer la simulation d'une petite durée (ms de jeu). Retourne les événements. */
function simuler(e, dt) {
  const evenements = [];
  if (e.parti) return evenements;

  e.ageJeu += dt;
  const s = stade(e);

  if (s !== e.dernierStade) {
    if (e.dernierStade === "oeuf") evenements.push("éclot ! 🐣");
    else evenements.push(`évolue en ${espece(e.graine).noms[s]} !`);
    e.dernierStade = s;
  }

  if (s === "oeuf") return evenements;

  const h = dt / HEURE;
  const taux = e.dodo ? TAUX_DODO : TAUX_EVEILLE;
  const facteurMaladie = e.malade ? 2 : 1;

  e.faim = borner(e.faim + taux.faim * h);
  e.bonheur = borner(e.bonheur + taux.bonheur * h * facteurMaladie);
  e.energie = borner(e.energie + taux.energie * h);

  const enManque = e.faim <= 0 || e.bonheur <= 0 || e.energie <= 0;
  if (enManque || e.malade) {
    e.negligence += dt;
  } else {
    e.negligence = Math.max(0, e.negligence - dt);
  }

  if (!e.malade && e.negligence >= DELAI_MALADIE) {
    e.malade = true;
    evenements.push("est tombé malade 🤒");
  }

  if (e.malade && e.negligence >= DELAI_DEPART) {
    e.parti = true;
    e.dodo = false;
    evenements.push("est parti…");
  }

  return evenements;
}

/** Avance le temps par pas d'une minute maximum (utile pour le rattrapage hors-ligne). */
function avancer(e, dtTotal) {
  const evenements = [];
  let reste = dtTotal;
  while (reste > 0 && !e.parti) {
    const pas = Math.min(reste, MINUTE);
    evenements.push(...simuler(e, pas));
    reste -= pas;
  }
  return evenements;
}

function humeur(e) {
  const s = stade(e);
  if (s === "oeuf") return { texte: "Va bientôt éclore…", visage: "neutre" };
  if (e.malade) return { texte: "Malade", visage: "malade" };
  if (e.dodo) return { texte: "Dort", visage: "dodo" };
  if (e.faim < 25) return { texte: "A faim", visage: "triste" };
  if (e.energie < 25) return { texte: "Fatigué", visage: "fatigue" };
  if (e.bonheur < 25) return { texte: "S'ennuie", visage: "triste" };
  const moyenne = (e.faim + e.bonheur + e.energie) / 3;
  if (moyenne >= 70) return { texte: "Heureux", visage: "joie" };
  return { texte: "Ça va", visage: "neutre" };
}

/* ---------- Actions ---------- */

function nourrir() {
  if (etat.dodo) return dire("Chut… il dort 😴");
  if (etat.faim >= 95) {
    etat.bonheur = borner(etat.bonheur - 3);
    Creature.secouer();
    return dire("Trop plein ! 🤢");
  }
  etat.faim = borner(etat.faim + 25);
  etat.energie = borner(etat.energie + 3);
  Creature.regarder(null, 700);
  definirAction("surpris", 700);
  Creature.effet($("creature"), "effet-nourriture", choisir(["🍙", "🍎", "🍓", "🍪", "🥕", "🍤", "🍑"]), { "--bouche": Creature.hauteurBouche() }, 1000);
  setTimeout(() => {
    definirAction("mange", 1700);
    Creature.macher(1700);
    dire(choisir(["Miam ! 😋", "Délicieux !", "Encore un peu ?"]));
  }, 700);
  setTimeout(() => {
    Creature.sauter(16);
    effetCoeurs(1);
  }, 2450);
}

function jouer() {
  if (etat.dodo) return dire("Chut… il dort 😴");
  if (etat.malade) return dire("Trop malade pour jouer…");
  if (etat.energie < 15) {
    Creature.secouer();
    return dire("Trop fatigué… 🥱");
  }
  if (etat.faim < 10) return dire("J'ai trop faim pour jouer !");
  if (Creature.occupe()) return;
  etat.bonheur = borner(etat.bonheur + 20);
  etat.energie = borner(etat.energie - 12);
  etat.faim = borner(etat.faim - 6);
  Creature.lancerBalle();
  definirAction("joie", 4500);
  dire(choisir(["Youpi ! 🎉", "Une balle !", "À moi !"]));
}

function dormir() {
  if (etat.dodo) {
    etat.dodo = false;
    dire("Bonjour ! ☀️");
    setTimeout(() => {
      Creature.sauter(20);
      Creature.saluer(900);
    }, 150);
  } else {
    etat.dodo = true;
    dire("Bonne nuit… 🌙");
  }
}

function soigner() {
  if (!etat.malade) return;
  etat.malade = false;
  etat.negligence = 0;
  etat.bonheur = borner(etat.bonheur - 5);
  Creature.effet($("creature"), "effet-nourriture", "💊", { "--bouche": Creature.hauteurBouche() }, 1000);
  setTimeout(() => {
    Creature.etincelles($("creature"), 6);
    Creature.sauter(18);
    dire("Beurk, le médicament… mais ça va mieux ! 💊");
  }, 700);
}

function caresser() {
  if (!etat || etat.parti || stade(etat) === "oeuf") return;
  if (etat.dodo) return dire("Zzz…");
  etat.bonheur = borner(etat.bonheur + 1);
  effetCoeurs(3);
  definirAction("joie", 1300);
  Creature.saluer(1100);
  Creature.sauter(14);
  dire(choisir(["Hihi !", "♥", "Ça chatouille !"]));
}

function choisir(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

/* ---------- Petites animations ---------- */

let action = null; // { visage, jusqua } : expression temporaire (mange, rit…)

function definirAction(visage, duree) {
  action = { visage, jusqua: Date.now() + duree };
  rendu();
  setTimeout(rendu, duree + 30);
}

const hasard = (min, max) => min + Math.random() * (max - min);

function effetCoeurs(n) {
  for (let i = 0; i < n; i++) {
    setTimeout(
      () => Creature.effet($("creature"), "effet-coeur", choisir(["💗", "💖", "💕"]), { "--dx": `${hasard(-40, 40)}px` }, 1500),
      i * 160
    );
  }
}

/* ---------- Il réclame ce dont il a besoin ---------- */

function reclamer() {
  if (!etat || etat.parti || etat.dodo || stade(etat) === "oeuf" || !$("bulle").hidden || Creature.occupe()) return;
  if (Math.random() > 0.08) return;
  if (etat.malade) {
    Creature.effet($("creature"), "effet-goutte", "💧", { "--dx": `${hasard(-40, 40)}px` }, 1300);
    return dire("Je ne me sens pas bien… 🤒");
  }
  if (etat.faim < 25) return dire(choisir(["J'ai faim… 🍙", "Mon ventre gargouille !"]));
  if (etat.energie < 25) return dire("Je suis fatigué… 🥱");
  if (etat.bonheur < 25) return dire(choisir(["On joue ? 🎾", "Je m'ennuie…"]));
  if (humeur(etat).visage === "joie" && Math.random() < 0.3) {
    effetCoeurs(1);
    Creature.saluer(900);
    return dire(choisir(["La la la ♪", "Je t'aime bien !", "Quelle belle journée !"]));
  }
}

/* ---------- Affichage ---------- */

const $ = (id) => document.getElementById(id);

function afficherEcran(id) {
  for (const ecran of ["ecranNom", "ecranJeu", "ecranFin"]) {
    $(ecran).hidden = ecran !== id;
  }
}

function couleurJauge(v) {
  if (v > 60) return "var(--ok)";
  if (v > 30) return "var(--moyen)";
  return "var(--bas)";
}

function formaterAge(e) {
  const age = Math.max(0, e.ageJeu - DUREE_OEUF);
  if (age < HEURE) return `${Math.floor(age / MINUTE)} min`;
  if (age < JOUR) return `${Math.floor(age / HEURE)} h`;
  const j = Math.floor(age / JOUR);
  return `${j} jour${j > 1 ? "s" : ""}`;
}

function afficherAccueil() {
  $("oeufAccueil").innerHTML = Creature.svgOeuf(espece(graineAccueil));
}

function rendu() {
  if (!etat) {
    afficherEcran("ecranNom");
    return;
  }

  const esp = espece(etat.graine);

  if (etat.parti) {
    afficherEcran("ecranFin");
    const s = stade(etat) === "oeuf" ? "bebe" : stade(etat);
    $("creatureFin").innerHTML = Creature.svgStatique(esp, s, "triste");
    $("messageFin").textContent =
      `${etat.nom} ne se sentait plus bien ici et est parti vivre sa vie ailleurs… ` +
      `Il a vécu ${formaterAge(etat)} avec toi. Prends bien soin du prochain !`;
    return;
  }

  afficherEcran("ecranJeu");
  const s = stade(etat);
  const h = humeur(etat);

  $("nom").textContent = etat.nom;
  $("infoAge").textContent = s === "oeuf" ? STADES.oeuf : `${STADES[s]} · ${formaterAge(etat)}`;
  $("espece").textContent = s === "oeuf" ? "Œuf mystérieux" : `${esp.noms[s]} · ${esp.icone} ${esp.nomElement}`;
  $("humeur").textContent = h.texte;

  // Expression temporaire (il mange, il rit…) si rien de plus urgent
  let visage = h.visage;
  if (action && Date.now() < action.jusqua && !etat.dodo && !etat.malade && s !== "oeuf") visage = action.visage;

  Creature.maj(esp, s, visage, Math.min(1, etat.ageJeu / DUREE_OEUF));
  $("creatureSvg").classList.toggle("malade", etat.malade);
  $("creatureZone").classList.toggle("dodo", etat.dodo);

  for (const [id, valeur] of [
    ["jaugeFaim", etat.faim],
    ["jaugeBonheur", etat.bonheur],
    ["jaugeEnergie", etat.energie],
  ]) {
    const fill = $(id);
    fill.style.width = `${valeur}%`;
    fill.style.backgroundColor = couleurJauge(valeur);
    fill.classList.toggle("urgent", valeur < 20);
  }

  const estOeuf = s === "oeuf";
  $("btnNourrir").disabled = estOeuf || etat.dodo;
  $("btnJouer").disabled = estOeuf || etat.dodo;
  $("btnDormir").disabled = estOeuf;
  $("btnDormir").innerHTML = etat.dodo ? "☀️<span>Réveiller</span>" : "🌙<span>Dormir</span>";
  $("btnSoigner").hidden = !etat.malade;
}

function dire(message) {
  const bulle = $("bulle");
  bulle.textContent = message;
  bulle.hidden = false;
  // relance l'animation d'apparition
  bulle.style.animation = "none";
  void bulle.offsetWidth;
  bulle.style.animation = "";
  clearTimeout(timerBulle);
  timerBulle = setTimeout(() => (bulle.hidden = true), 2600);
  rendu();
  sauvegarder();
}

function annoncer(evenements) {
  if (evenements.length) dire(`${etat.nom} ${evenements[evenements.length - 1]}`);
}

/* ---------- Thème jour / nuit ---------- */

function appliquerTheme() {
  const heure = new Date().getHours();
  const jour = heure >= 7 && heure < 20;
  document.body.classList.toggle("jour", jour);
  document.body.classList.toggle("nuit", !jour);
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", jour ? "#ffb703" : "#1b1c33");
}

/* ---------- Boucle principale ---------- */

function tic() {
  if (!etat || etat.parti) return;
  const maintenant = Date.now();
  const ecoule = Math.min(Math.max(0, maintenant - etat.derniereMaj), RATTRAPAGE_MAX);
  etat.derniereMaj = maintenant;
  const evenements = avancer(etat, ecoule * VITESSE);
  rendu();
  annoncer(evenements);
  reclamer();
  sauvegarder();
}

function demarrer() {
  appliquerTheme();
  afficherAccueil();

  Creature.init($("creatureZone"), $("creature"), $("creatureSvg"), {
    peutBouger: () => etat && !etat.parti && stade(etat) !== "oeuf" && !etat.dodo && !etat.malade && etat.energie >= 25,
  });

  etat = charger();
  if (etat) {
    // Rattrapage du temps passé page fermée
    const absence = Date.now() - etat.derniereMaj;
    tic();
    if (!etat.parti && absence > 10 * MINUTE && stade(etat) !== "oeuf") {
      dire(`${etat.nom} est content de te revoir ! 💛`);
      Creature.saluer(1200);
    }
  }
  rendu();

  $("btnAutreOeuf").addEventListener("click", () => {
    graineAccueil = Creature.nouvelleGraine();
    afficherAccueil();
  });

  $("formNom").addEventListener("submit", (ev) => {
    ev.preventDefault();
    const nom = $("nameInput").value.trim();
    if (!nom) {
      $("nameInput").focus();
      $("nameInput").placeholder = "Donne-lui un vrai nom 😉";
      return;
    }
    etat = nouvelEtat(nom, graineAccueil);
    sauvegarder();
    rendu();
    dire("Prends soin de moi ! 🥚");
  });

  $("btnNourrir").addEventListener("click", nourrir);
  $("btnJouer").addEventListener("click", jouer);
  $("btnDormir").addEventListener("click", dormir);
  $("btnSoigner").addEventListener("click", soigner);
  $("creature").addEventListener("click", caresser);

  $("btnRecommencer").addEventListener("click", () => {
    effacerSauvegarde();
    etat = null;
    graineAccueil = Creature.nouvelleGraine();
    afficherAccueil();
    $("nameInput").value = "";
    rendu();
  });

  // Sauvegarde quand on quitte ou masque la page
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") sauvegarder();
    else tic();
  });

  setInterval(tic, SECONDE);
  setInterval(appliquerTheme, MINUTE);

  // Mode appli (hors-ligne, installable) — uniquement servi en http(s)
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
}

demarrer();
