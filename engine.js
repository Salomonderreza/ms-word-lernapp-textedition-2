/* =====================================================================
   REDAKTIONS-PROFI — ENGINE — komplett eigenständig, teilt keine Datei mit index.html.

   Bewusst schlanker als die Engine von Teil 1: Keine der Missionen in
   Baustein B4 (Rückgängig/Wiederholen), Baustein C (Zwischenablage) oder
   den Abschlussaufgaben prüft eine exakte Cursorposition oder einen
   exakten Selektionsbereich — alle Prüfungen laufen über den
   Enddokument-Text, die verwendete Methode (Maus/Tastatur), die Anzahl
   Strg+Z/Strg+Y-Drücke und durchlaufene Zwischenzustände. Die komplette
   Zeichen-Offset-Umrechnung und die Cursor-/Auswahl-Demo-Animation aus
   der Teil-1-Engine werden hier deshalb gar nicht erst gebaut.
   ===================================================================== */

window.RPEngine = (() => {
  "use strict";

  const editor = document.getElementById("editor");
  const el = {
    panelBody: document.getElementById("panelBody"),
    progressFill: document.getElementById("progressFill"),
    progressLabel: document.getElementById("progressLabel"),
    familyLabel: document.getElementById("familyLabel"),
    brandNum: document.getElementById("brandNum"),
    docName: document.getElementById("docName"),
    keyboardDock: document.getElementById("keyboardDock"),
    keyboardSvgHost: document.getElementById("keyboardSvgHost"),
    pasteFallback: document.getElementById("pasteFallback"),
    btnPasteFallback: document.getElementById("btnPasteFallback"),
  };

  const state = {
    missions: [],
    index: 0,
    phase: "erklaerung",   // 'erklaerung' | 'demo' | 'aufgabe'
    lastMethod: null,      // 'maus' | 'tastatur'
    done: false,
    ctrlZCount: 0,
    ctrlYCount: 0,
    seenTexts: new Set(),
    appClipboard: "",
    startNumber: 28,
    totalCount: 44,
    onComplete: null,
  };

  // -----------------------------------------------------------
  // Text-Hilfsfunktionen
  // -----------------------------------------------------------

  function getPlainText() {
    return [...editor.querySelectorAll("p")].map(p => p.textContent).join("\n");
  }

  function setParagraphs(paragraphs) {
    editor.innerHTML = "";
    paragraphs.forEach(text => {
      const p = document.createElement("p");
      p.textContent = text;
      editor.appendChild(p);
    });
  }

  // Toleriert doppelte/geschützte Leerzeichen beim Textvergleich, ohne
  // inhaltliche Fehler durchzulassen (siehe Mission 31 / Baustein C).
  function normalize(t) {
    return t
      .replace(/\u00A0/g, " ")
      .replace(/\u200B/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/ *\n */g, "\n")
      .trim();
  }

  // -----------------------------------------------------------
  // Methodenerkennung + Undo/Redo-Zählung + besuchte Textzustände
  // -----------------------------------------------------------

  function markMethod(method) { state.lastMethod = method; }

  editor.addEventListener("mousedown", () => markMethod("maus"));
  editor.addEventListener("dblclick", () => markMethod("maus"));

  editor.addEventListener("keydown", (e) => {
    const mod = e.ctrlKey || e.metaKey;
    const key = e.key.toLowerCase();
    if (mod && ["a", "x", "c", "v", "z", "y"].includes(key)) markMethod("tastatur");
    // Natives Undo/Redo NICHT abfangen (kein preventDefault) — der Browser
    // verwaltet seine eigene Undo-Historie im contenteditable-Feld selbst,
    // wir zählen hier nur mit.
    if (mod && key === "z" && !e.shiftKey) state.ctrlZCount++;
    if (mod && (key === "y" || (key === "z" && e.shiftKey))) state.ctrlYCount++;
  });

  editor.addEventListener("input", () => {
    if (state.phase === "aufgabe") state.seenTexts.add(getPlainText().trim());
  });

  function afterManualEdit() {
    if (state.phase === "aufgabe") state.seenTexts.add(getPlainText().trim());
    runCheck();
  }

  // -----------------------------------------------------------
  // Zwischenablage: native Strg+X/C/V bleiben primär. Viele Schul-/
  // Verwaltungs-Browser erlauben zwar das Schreiben (Ausschneiden/
  // Kopieren wirken lokal immer), blockieren aber das Lesen beim
  // Einfügen — deshalb zusätzlich eine eigene, interne Zwischenablage
  // als Fallback, plus ein Klick-Button, der ganz ohne Paste-Ereignis
  // auskommt (für Browser, die das Ereignis komplett unterdrücken).
  // -----------------------------------------------------------

  function insertTextAtCursor(text) {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editor.contains(sel.anchorNode)) return false;
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(text);
    range.insertNode(node);
    const p = node.parentElement;
    if (p) p.normalize();
    range.setStartAfter(node);
    range.setEndAfter(node);
    sel.removeAllRanges();
    sel.addRange(range);
    return true;
  }

  editor.addEventListener("copy", (e) => {
    const sel = window.getSelection();
    const text = sel ? sel.toString() : "";
    if (!text) return;
    state.appClipboard = text;
    try { e.clipboardData && e.clipboardData.setData("text/plain", text); } catch (err) {}
  });

  editor.addEventListener("cut", (e) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return;
    const text = sel.toString();
    state.appClipboard = text;
    try { e.clipboardData && e.clipboardData.setData("text/plain", text); } catch (err) {}
    setTimeout(afterManualEdit, 0);
  });

  editor.addEventListener("paste", (e) => {
    let text = "";
    try { text = e.clipboardData ? e.clipboardData.getData("text/plain") : ""; } catch (err) {}
    if (!text) {
      text = state.appClipboard || "";
      if (!text) return;
      e.preventDefault();
      insertTextAtCursor(text);
    }
    setTimeout(afterManualEdit, 0);
  });

  if (el.btnPasteFallback) {
    el.btnPasteFallback.addEventListener("mousedown", (e) => e.preventDefault());
    el.btnPasteFallback.addEventListener("click", () => {
      if (!state.appClipboard) return;
      const ok = insertTextAtCursor(state.appClipboard);
      if (ok) { markMethod("tastatur"); afterManualEdit(); }
    });
  }

  // -----------------------------------------------------------
  // Tastatur-Grafik: nur die Tasten, die B4/C tatsächlich brauchen
  // (Strg, Z, Y, X, C, V) — als vollständige, deutsch beschriftete
  // QWERTZ-Abbildung, damit sie genauso aussieht wie in Teil 1.
  // -----------------------------------------------------------

  const KEY_LAYOUT = [
    ["q", "Q", 10, 10, 34, 34], ["w", "W", 46, 10, 34, 34], ["e", "E", 82, 10, 34, 34],
    ["r", "R", 118, 10, 34, 34], ["t", "T", 154, 10, 34, 34], ["z", "Z", 190, 10, 34, 34],
    ["u", "U", 226, 10, 34, 34], ["i", "I", 262, 10, 34, 34], ["o", "O", 298, 10, 34, 34],
    ["p", "P", 334, 10, 34, 34], ["backspace", "⌫ Rück", 372, 10, 44, 34],

    ["a", "A", 28, 46, 34, 34], ["s", "S", 64, 46, 34, 34], ["d", "D", 100, 46, 34, 34],
    ["f", "F", 136, 46, 34, 34], ["g", "G", 172, 46, 34, 34], ["h", "H", 208, 46, 34, 34],
    ["j", "J", 244, 46, 34, 34], ["k", "K", 280, 46, 34, 34], ["l", "L", 316, 46, 34, 34],

    ["shift-l", "⇧ Umschalt", 10, 82, 66, 34], ["y", "Y", 80, 82, 34, 34],
    ["x", "X", 116, 82, 34, 34], ["c", "C", 152, 82, 34, 34], ["v", "V", 188, 82, 34, 34],
    ["b", "B", 224, 82, 34, 34], ["n", "N", 260, 82, 34, 34], ["m", "M", 296, 82, 34, 34],
    ["shift-r", "⇧ Umschalt", 332, 82, 66, 34],

    ["strg-l", "Strg", 10, 118, 50, 34], ["alt", "Alt", 64, 118, 42, 34],
    ["leertaste", "Leertaste", 110, 118, 180, 34], ["altgr", "Alt Gr", 294, 118, 42, 34],
    ["strg-r", "Strg", 340, 118, 50, 34],

    ["pos1", "Pos1", 420, 10, 46, 34], ["ende", "Ende", 470, 10, 46, 34],
    ["entf", "Entf", 420, 46, 46, 34],
    ["pfeil-hoch", "↑", 450, 100, 34, 30],
    ["pfeil-links", "←", 414, 132, 34, 30], ["pfeil-runter", "↓", 450, 132, 34, 30], ["pfeil-rechts", "→", 486, 132, 34, 30],
  ];

  function buildKeyboardSVG() {
    const parts = KEY_LAYOUT.map(([id, label, x, y, w, h]) => `
      <g class="kbd-key" data-key="${id}">
        <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5"></rect>
        <text x="${x + w / 2}" y="${y + h / 2 + 3.5}" text-anchor="middle">${label}</text>
      </g>`).join("");
    return `<svg viewBox="0 0 540 172" xmlns="http://www.w3.org/2000/svg">${parts}</svg>`;
  }
  el.keyboardSvgHost.innerHTML = buildKeyboardSVG();

  function highlightKeys(keyIds, { sequential = true, onDone } = {}) {
    if (!keyIds || !keyIds.length) { if (onDone) onDone(); return; }
    el.keyboardDock.querySelectorAll(".kbd-key").forEach(g => g.classList.remove("key-active"));
    const modifiers = keyIds.filter(k => ["strg-l", "strg-r", "shift-l", "shift-r", "alt", "altgr"].some(m => k.startsWith(m.split("-")[0])));
    const others = keyIds.filter(k => !modifiers.includes(k));

    function activate(id) {
      const g = el.keyboardDock.querySelector(`.kbd-key[data-key="${id}"]`);
      if (g) g.classList.add("key-active");
    }
    modifiers.forEach(activate);
    if (!sequential || others.length === 0) {
      others.forEach(activate);
      setTimeout(() => onDone && onDone(), 900);
      return;
    }
    let i = 0;
    const step = () => {
      if (i > 0) {
        const prev = el.keyboardDock.querySelector(`.kbd-key[data-key="${others[i - 1]}"]`);
        if (prev) prev.classList.remove("key-active");
      }
      if (i < others.length) { activate(others[i]); i++; setTimeout(step, 500); }
      else { setTimeout(() => onDone && onDone(), 500); }
    };
    step();
  }
  function clearKeyHighlights() {
    el.keyboardDock.querySelectorAll(".kbd-key").forEach(g => g.classList.remove("key-active"));
  }

  // -----------------------------------------------------------
  // Vorher/Nachher- und Kontextmenü-Demo (rein statisch)
  // -----------------------------------------------------------

  function renderTextCompare(host, vorher, nachher, showContextMenu) {
    if (!host) return;
    host.innerHTML = `
      ${showContextMenu ? `
        <div class="demo-contextmenu">
          <span class="demo-contextmenu-cursor">🖱️</span>
          <div class="demo-contextmenu-box">
            <div>✂️ Ausschneiden</div><div>📋 Kopieren</div><div>📥 Einfügen</div>
          </div>
        </div>` : ""}
      <div class="demo-compare">
        <div class="demo-compare-box">
          <span class="demo-compare-label">Vorher</span>
          <p>${vorher}</p>
        </div>
        <div class="demo-compare-arrow">↓</div>
        <div class="demo-compare-box demo-compare-after">
          <span class="demo-compare-label">Nachher</span>
          <p>${nachher}</p>
        </div>
      </div>`;
  }

  // -----------------------------------------------------------
  // Missions-/Phasen-Steuerung
  // -----------------------------------------------------------

  function currentMission() { return state.missions[state.index]; }
  function isKeyboardMission(m) { return m.method === "tastatur" || m.method === "beides"; }

  function renderKeyboardDock(m) {
    if (isKeyboardMission(m) && m.keys && m.keys.length) el.keyboardDock.hidden = false;
    else { el.keyboardDock.hidden = true; clearKeyHighlights(); }
  }
  function isClipboardMission(m) {
    return m.family === "C1" || m.family === "C2" || m.family === "C3";
  }

  function setPhase(phase) { state.phase = phase; render(); }

  function render() {
    const m = currentMission();
    el.docName.textContent = "Mission " + (state.index + state.startNumber) + " – " + m.title + ".docx";
    renderKeyboardDock(m);
    if (el.pasteFallback) el.pasteFallback.hidden = !(state.phase === "aufgabe" && isClipboardMission(m));
    if (el.brandNum && m.baustein) el.brandNum.textContent = m.baustein;
    if (m.bausteinLabel) el.familyLabel.textContent = m.bausteinLabel;

    if (state.phase === "erklaerung") {
      editor.contentEditable = "false";
      setParagraphs(m.paragraphs);
      el.panelBody.innerHTML = `
        <span class="phase-tag">So wird es gemacht!</span>
        <span class="method-badge">${m.method === "maus" ? "🖱️ Maus" : m.method === "tastatur" ? "⌨️ Tastatur" : "🖱️⌨️ Beides"}</span>
        <h2 id="missionTitle">${m.title}</h2>
        <p class="explanation-text">${m.erklaerung}</p>
        <div class="panelnav">
          <button class="btn btn-ghost" id="btnSkipDemo">Direkt zur Übung →</button>
          <button class="btn btn-primary" id="btnZurDemo">Demo ansehen →</button>
        </div>`;
      document.getElementById("btnZurDemo").addEventListener("click", () => setPhase("demo"));
      document.getElementById("btnSkipDemo").addEventListener("click", () => setPhase("aufgabe"));
      return;
    }

    if (state.phase === "demo") {
      editor.contentEditable = "false";
      setParagraphs(m.paragraphs);
      el.panelBody.innerHTML = `
        <span class="phase-tag demo">Demo</span>
        <h2 id="missionTitle">${m.title}</h2>
        <p class="explanation-text">${m.erklaerung}</p>
        <div id="demoVisual" class="demo-visual"></div>
        <div class="panelnav">
          <button class="btn btn-ghost" id="btnDemoNochmal">Nochmal ansehen</button>
          <button class="btn btn-primary" id="btnJetztDu">Jetzt du! →</button>
        </div>`;
      document.getElementById("btnDemoNochmal").addEventListener("click", playDemo);
      document.getElementById("btnJetztDu").addEventListener("click", () => setPhase("aufgabe"));
      playDemo();
      return;
    }

    if (state.phase === "aufgabe") {
      state.done = false;
      state.lastMethod = null;
      state.ctrlZCount = 0;
      state.ctrlYCount = 0;
      state.appClipboard = "";
      setParagraphs(m.paragraphs);
      state.seenTexts = new Set([getPlainText().trim()]);
      editor.contentEditable = "true";
      el.panelBody.innerHTML = `
        <span class="phase-tag aufgabe">Deine Aufgabe</span>
        <span class="method-badge">${m.method === "maus" ? "🖱️ Mit der Maus" : m.method === "tastatur" ? "⌨️ Mit der Tastatur" : "🖱️⌨️ Maus oder Tastatur"}</span>
        <h2 id="missionTitle">${m.title}</h2>
        <p class="instruction">${m.aufgabe}</p>
        ${m.hint ? `<div class="hintbox">
          <button class="hint-toggle" id="hintToggle">Tipp anzeigen</button>
          <p class="hint-text" id="hintText" hidden>${m.hint}</p>
        </div>` : ""}
        <div class="feedback" id="feedback"></div>
        <div class="panelnav">
          <button class="btn btn-ghost" id="btnRetry">Neu starten</button>
          <button class="btn btn-primary" id="btnNext" disabled>Weiter →</button>
        </div>`;
      if (m.hint) {
        document.getElementById("hintToggle").addEventListener("click", () => {
          const t = document.getElementById("hintText");
          const show = t.hidden;
          t.hidden = !show;
          document.getElementById("hintToggle").textContent = show ? "Tipp verbergen" : "Tipp anzeigen";
        });
      }
      document.getElementById("btnRetry").addEventListener("click", () => setPhase("aufgabe"));
      document.getElementById("btnNext").addEventListener("click", nextMission);
      editor.focus();
      return;
    }
  }

  function playDemo() {
    const m = currentMission();
    const visualHost = document.getElementById("demoVisual");
    if (visualHost) visualHost.innerHTML = "";
    const runVisual = () => {
      if (m.demo && m.demo.type === "text-compare") {
        renderTextCompare(visualHost, m.demo.vorher, m.demo.nachher, m.demo.contextmenu);
      }
    };
    if (isKeyboardMission(m) && m.keys && m.keys.length) highlightKeys(m.keys, { onDone: runVisual });
    else runVisual();
  }

  function updateProgress() {
    el.progressFill.style.width = Math.round(state.index / state.missions.length * 100) + "%";
    el.progressLabel.textContent = "Mission " + (state.index + state.startNumber) + " / " + state.totalCount;
  }

  function runCheck() {
    const m = currentMission();
    if (state.phase !== "aufgabe" || state.done) return;
    const ctx = {
      method: state.lastMethod,
      plainText: getPlainText(),
      seenTexts: state.seenTexts,
      ctrlZCount: state.ctrlZCount,
      ctrlYCount: state.ctrlYCount,
    };
    let ok = false;
    try { ok = !!m.check(ctx); } catch (e) { ok = false; }
    if (ok) {
      state.done = true;
      const fb = document.getElementById("feedback");
      if (fb) { fb.textContent = "✓ Richtig gemacht! Klicke auf „Weiter“."; fb.className = "feedback ok"; }
      const btn = document.getElementById("btnNext");
      if (btn) btn.disabled = false;
      updateProgress();
    }
  }

  editor.addEventListener("keyup", runCheck);
  editor.addEventListener("mouseup", runCheck);
  document.addEventListener("selectionchange", () => {
    if (editor.contains(document.activeElement) || document.activeElement === editor) runCheck();
  });
  document.addEventListener("keydown", (e) => {
    // Escape hat hier keine Dialoge zu schließen (anders als Teil 1),
    // aber der Listener bleibt bewusst leer/vorhanden für künftige Erweiterungen.
  });

  function nextMission() {
    if (state.index < state.missions.length - 1) {
      state.index++;
      updateProgress();
      setPhase("erklaerung");
    } else {
      editor.contentEditable = "false";
      el.keyboardDock.hidden = true;
      if (el.pasteFallback) el.pasteFallback.hidden = true;
      const done = state.onComplete || {
        title: "Geschafft",
        text: `Du hast alle ${state.totalCount} Missionen von Programm 1a gemeistert.`,
      };
      el.panelBody.innerHTML = `
        <span class="phase-tag aufgabe">Geschafft! 🎉</span>
        <h2 id="missionTitle">${done.title}</h2>
        <p class="explanation-text">${done.text}</p>`;
    }
  }

  function start(missions, { familyLabel, startNumber = 28, totalCount = 44, onComplete } = {}) {
    state.missions = missions;
    state.index = 0;
    state.startNumber = startNumber;
    state.totalCount = totalCount;
    state.onComplete = onComplete || null;
    if (familyLabel) el.familyLabel.textContent = familyLabel;
    updateProgress();
    setPhase("erklaerung");
  }

  return { start, normalize };
})();
