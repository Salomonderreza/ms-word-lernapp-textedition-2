/* =====================================================================
   REDAKTIONS-PROFI — MISSIONSDATEN (17 Missionen)
   Komplett eigenständig: keine Abhängigkeit von den Teil-1-Dateien.
   Reihenfolge bereits final: B4 (3, sequenziell) → C1/C2/C3 (9, im
   Round-Robin gemischt statt blockweise) → Abschlussaufgaben (5,
   unveraendert in ihrer aufbauenden Reihenfolge).
   ===================================================================== */

(() => {
  "use strict";
  const norm = window.RPEngine.normalize;
  const missions = [];

  // ---------------------------------------------------------------
  // Baustein B4 — Rückgängig / Wiederholen (natives Browser-Undo)
  // ---------------------------------------------------------------

  missions.push({
    id: "b4-1", family: "B4", method: "tastatur",
    title: "Löschen rückgängig machen",
    keys: ["strg-l", "z"],
    erklaerung: "Strg+Z macht den letzten Schritt rückgängig.",
    aufgabe: "Lösche das Wort „schöner “ (mit Leerzeichen) irgendwie — und mache diese Löschung dann mit Strg+Z wieder rückgängig, sodass der ursprüngliche Satz wieder dasteht.",
    hint: "Erst markieren und löschen, danach Strg+Z drücken.",
    paragraphs: ["Das ist ein schöner Tag im Park."],
    demo: { type: "text-compare", vorher: "Das ist ein Tag im Park. (gelöscht)", nachher: "Das ist ein schöner Tag im Park. (wiederhergestellt)" },
    check: (ctx) => {
      const original = norm("Das ist ein schöner Tag im Park.");
      const sawShorter = [...ctx.seenTexts].some(t => t !== original && t.length < original.length);
      return norm(ctx.plainText) === original && ctx.ctrlZCount >= 1 && sawShorter;
    },
  });

  missions.push({
    id: "b4-2", family: "B4", method: "tastatur",
    title: "Rückgängig machen und wiederherstellen",
    keys: ["strg-l", "z", "y"],
    erklaerung: "Strg+Z macht rückgängig, Strg+Y stellt den Schritt danach wieder her.",
    aufgabe: "Ergänze irgendein Wort am Satzende. Mache die Ergänzung mit Strg+Z rückgängig — und stelle sie danach mit Strg+Y wieder her.",
    hint: "Reihenfolge: tippen → Strg+Z → Strg+Y.",
    paragraphs: ["Wir gehen heute ins Kino."],
    demo: { type: "text-compare", vorher: "Wir gehen heute ins Kino. (nach Strg+Z: zurück zum Original)", nachher: "Wir gehen heute ins Kino. Endlich! (nach Strg+Y: wieder da)" },
    check: (ctx) => {
      const base = norm("Wir gehen heute ins Kino.");
      const current = norm(ctx.plainText);
      const sawBase = ctx.seenTexts.has(base);
      return current !== base && current.length > base.length &&
        ctx.ctrlZCount >= 1 && ctx.ctrlYCount >= 1 && sawBase;
    },
  });

  missions.push({
    id: "b4-3", family: "B4", method: "tastatur",
    title: "Zwei Schritte rückgängig machen",
    keys: ["strg-l", "z"],
    erklaerung: "Strg+Z lässt sich auch mehrmals hintereinander drücken — dann werden mehrere Schritte rückgängig gemacht.",
    aufgabe: "Lösche nacheinander die beiden Wörter „wirklich “ und „sehr “ — und mache dann mit zweimaligem Strg+Z beide Löschungen rückgängig, sodass der Originalsatz wieder vollständig dasteht.",
    hint: "Erst „wirklich “ löschen, dann „sehr “ löschen, danach zweimal Strg+Z.",
    paragraphs: ["Das ist ein wirklich sehr schöner Tag."],
    demo: { type: "text-compare", vorher: "Das ist ein schöner Tag. (beide Wörter gelöscht)", nachher: "Das ist ein wirklich sehr schöner Tag. (beide wiederhergestellt)" },
    check: (ctx) => {
      const original = norm("Das ist ein wirklich sehr schöner Tag.");
      const shorterCount = [...ctx.seenTexts].filter(t => t !== original && t.length < original.length).length;
      return norm(ctx.plainText) === original && ctx.ctrlZCount >= 2 && shorterCount >= 2;
    },
  });

  // ---------------------------------------------------------------
  // Baustein C — Zwischenablage (im Round-Robin: C1, C2, C3, C1, C2, C3, …)
  // ---------------------------------------------------------------

  missions.push({
    id: "c1-1", family: "C1", method: "tastatur",
    title: "Ein Wort verschieben",
    keys: ["strg-l", "x", "v"],
    erklaerung: "Ausschneiden (Strg+X) entfernt den markierten Text und merkt ihn sich. Einfügen (Strg+V) setzt ihn an der neuen Stelle wieder ein.",
    aufgabe: "Markiere „schnell “ (mit Leerzeichen danach!), schneide es mit Strg+X aus, setze den Cursor direkt vor „Fuchs“ und füge „schnell “ dort mit Strg+V wieder ein.",
    hint: "Wichtig: Das Leerzeichen nach „schnell“ muss mit markiert und mit ausgeschnitten werden, sonst kleben zwei Wörter aneinander.",
    paragraphs: ["Der Fuchs läuft schnell durch den Wald."],
    demo: { type: "text-compare", vorher: "Der Fuchs läuft schnell durch den Wald.", nachher: "Der schnell Fuchs läuft durch den Wald." },
    check: (ctx) => ctx.method === "tastatur" && norm(ctx.plainText) === norm("Der schnell Fuchs läuft durch den Wald."),
  });

  missions.push({
    id: "c2-1", family: "C2", method: "tastatur",
    title: "Ein Wort kopieren und einfügen",
    keys: ["strg-l", "c", "v"],
    erklaerung: "Kopieren (Strg+C) lässt das Original stehen — der Text landet zusätzlich in der Zwischenablage.",
    aufgabe: "Markiere das Wort „Sonne“, kopiere es mit Strg+C, setze den Cursor ans Satzende und füge es mit einem Leerzeichen davor ein.",
    hint: "Nach dem Kopieren bleibt „Sonne“ an Ort und Stelle stehen.",
    paragraphs: ["Die Sonne scheint heute sehr warm."],
    demo: { type: "text-compare", vorher: "Die Sonne scheint heute sehr warm.", nachher: "Die Sonne scheint heute sehr warm. Sonne" },
    check: (ctx) => ctx.method === "tastatur" && norm(ctx.plainText) === norm("Die Sonne scheint heute sehr warm. Sonne"),
  });

  missions.push({
    id: "c3-1", family: "C3", method: "beides",
    title: "Kopieren über das Kontextmenü",
    erklaerung: "Ein Rechtsklick öffnet ein Menü mit Ausschneiden, Kopieren und Einfügen.",
    aufgabe: "Markiere das Wort „Sofa“, öffne per Rechtsklick das Kontextmenü, wähle „Kopieren“ und füge es am Satzende ein (mit Leerzeichen davor).",
    hint: "Rechtsklick auf die Markierung öffnet das Menü.",
    paragraphs: ["Die Katze schläft auf dem Sofa."],
    demo: { type: "text-compare", contextmenu: true, vorher: "Die Katze schläft auf dem Sofa.", nachher: "Die Katze schläft auf dem Sofa. Sofa" },
    check: (ctx) => norm(ctx.plainText) === norm("Die Katze schläft auf dem Sofa. Sofa"),
  });

  missions.push({
    id: "c1-2", family: "C1", method: "tastatur",
    title: "Einen Ausdruck in den nächsten Absatz verschieben",
    keys: ["strg-l", "x", "v"],
    erklaerung: "Ausschneiden und Einfügen funktioniert auch über Absatzgrenzen hinweg.",
    aufgabe: "Markiere „schnell “ (mit Leerzeichen danach) im ersten Satz, schneide es aus und füge es ganz am Anfang des zweiten Absatzes ein (vor „Dann“).",
    hint: "Nach dem Ausschneiden mit der Maus oder Strg+Pos1 an den Anfang des zweiten Absatzes springen.",
    paragraphs: ["Er packte schnell seine Sachen ein.", "Dann ging er los."],
    demo: {
      type: "text-compare",
      vorher: "Er packte schnell seine Sachen ein.\nDann ging er los.",
      nachher: "Er packte seine Sachen ein.\nschnell Dann ging er los.",
    },
    check: (ctx) => ctx.method === "tastatur" &&
      norm(ctx.plainText) === norm("Er packte seine Sachen ein.\nschnell Dann ging er los."),
  });

  missions.push({
    id: "c2-2", family: "C2", method: "tastatur",
    title: "Denselben Text an zwei Stellen einfügen",
    keys: ["strg-l", "c", "v"],
    erklaerung: "Einmal kopiert, kannst du denselben Text beliebig oft wieder einfügen.",
    aufgabe: "Kopiere „Hallo! “ (mit Leerzeichen danach) vom Satzanfang. Füge es zusätzlich vor „Wir“ im zweiten und vor „Bis“ im dritten Absatz ein.",
    hint: "Einmal kopieren reicht — danach zweimal einfügen.",
    paragraphs: ["Hallo! Wie geht es dir?", "Wir sehen uns bald.", "Bis dann!"],
    demo: {
      type: "text-compare",
      vorher: "Hallo! Wie geht es dir?\nWir sehen uns bald.\nBis dann!",
      nachher: "Hallo! Wie geht es dir?\nHallo! Wir sehen uns bald.\nHallo! Bis dann!",
    },
    check: (ctx) => ctx.method === "tastatur" &&
      norm(ctx.plainText) === norm("Hallo! Wie geht es dir?\nHallo! Wir sehen uns bald.\nHallo! Bis dann!"),
  });

  missions.push({
    id: "c3-2", family: "C3", method: "beides",
    title: "Ausschneiden über das Kontextmenü",
    erklaerung: "Auch Ausschneiden funktioniert über das Rechtsklick-Menü.",
    aufgabe: "Markiere „ sehr alt“ (mit Leerzeichen davor) und schneide es per Rechtsklick → Ausschneiden aus.",
    hint: "Danach soll „Der Baum im Garten ist.“ übrig bleiben.",
    paragraphs: ["Der Baum im Garten ist sehr alt."],
    demo: { type: "text-compare", contextmenu: true, vorher: "Der Baum im Garten ist sehr alt.", nachher: "Der Baum im Garten ist." },
    check: (ctx) => norm(ctx.plainText) === norm("Der Baum im Garten ist."),
  });

  missions.push({
    id: "c1-3", family: "C1", method: "tastatur",
    title: "Zwei Wörter an eine neue Stelle verschieben",
    keys: ["strg-l", "x", "v"],
    erklaerung: "Auch mehrere Wörter am Stück lassen sich auf einmal ausschneiden und einfügen.",
    aufgabe: "Markiere „ ganz fröhlich“ (mit Leerzeichen davor, am Satzende) und schneide es aus. Setze den Cursor direkt hinter „Kinder“ und füge „ ganz fröhlich“ dort wieder ein (mit Leerzeichen davor).",
    hint: "Ergebnis: „Die Kinder ganz fröhlich spielen im Garten.“",
    paragraphs: ["Die Kinder spielen im Garten ganz fröhlich."],
    demo: { type: "text-compare", vorher: "Die Kinder spielen im Garten ganz fröhlich.", nachher: "Die Kinder ganz fröhlich spielen im Garten." },
    check: (ctx) => ctx.method === "tastatur" &&
      norm(ctx.plainText) === norm("Die Kinder ganz fröhlich spielen im Garten."),
  });

  missions.push({
    id: "c2-3", family: "C2", method: "tastatur",
    title: "Die Zwischenablage wird überschrieben",
    keys: ["strg-l", "c", "v"],
    erklaerung: "Kopierst du etwas Neues, ersetzt es den vorherigen Inhalt der Zwischenablage.",
    aufgabe: "Kopiere zuerst „blau“ (aber füge es noch nicht ein). Kopiere danach „grün“ — dadurch wird „blau“ überschrieben. Füge nun „grün“ direkt vor dem Punkt im ersten Satz ein (mit einem Leerzeichen davor).",
    hint: "Der erste Kopiervorgang wird nie eingefügt — er dient nur der Erklärung.",
    paragraphs: ["Der Himmel ist blau.", "Das Gras ist grün."],
    demo: {
      type: "text-compare",
      vorher: "Der Himmel ist blau.\nDas Gras ist grün.",
      nachher: "Der Himmel ist blau grün.\nDas Gras ist grün.",
    },
    check: (ctx) => ctx.method === "tastatur" &&
      norm(ctx.plainText) === norm("Der Himmel ist blau grün.\nDas Gras ist grün."),
  });

  missions.push({
    id: "c3-3", family: "C3", method: "beides",
    title: "Einfügen über das Kontextmenü",
    erklaerung: "Und auch das Einfügen funktioniert über dasselbe Menü.",
    aufgabe: "Kopiere das Wort „Kino“ per Rechtsklick → Kopieren. Setze den Cursor an den Satzanfang und füge es dort per Rechtsklick → Einfügen ein, gefolgt von einem Leerzeichen.",
    hint: "Ergebnis: „Kino Wir gehen ins Kino.“",
    paragraphs: ["Wir gehen ins Kino."],
    demo: { type: "text-compare", contextmenu: true, vorher: "Wir gehen ins Kino.", nachher: "Kino Wir gehen ins Kino." },
    check: (ctx) => norm(ctx.plainText) === norm("Kino Wir gehen ins Kino."),
  });

  // ---------------------------------------------------------------
  // Abschlussaufgaben — unveraendert in ihrer aufbauenden Reihenfolge
  // ---------------------------------------------------------------

  missions.push({
    id: "abschluss-1", family: "T1", method: "beides",
    title: "Eine Nachricht korrigieren",
    erklaerung: "Kombiniert: Cursor gezielt setzen + Text ergänzen.",
    aufgabe: "In der Nachricht hat sich ein Tippfehler eingeschlichen: Am Ende steht „Bis glei!“ statt „Bis gleich!“. Setze den Cursor an die richtige Stelle und ergänze das fehlende „ch“.",
    hint: "Der Cursor muss zwischen „i“ und „!“ stehen.",
    paragraphs: ["Liebe Grüße, wir kommen morgen um 14 Uhr und bringen Kuchen mit. Bis glei!"],
    demo: {
      type: "text-compare",
      vorher: "Liebe Grüße, wir kommen morgen um 14 Uhr und bringen Kuchen mit. Bis glei!",
      nachher: "Liebe Grüße, wir kommen morgen um 14 Uhr und bringen Kuchen mit. Bis gleich!",
    },
    check: (ctx) => norm(ctx.plainText) ===
      norm("Liebe Grüße, wir kommen morgen um 14 Uhr und bringen Kuchen mit. Bis gleich!"),
  });

  missions.push({
    id: "abschluss-2", family: "T2", method: "beides",
    title: "Zwei Sätze vertauschen",
    erklaerung: "Kombiniert: Markieren + Ausschneiden + Navigation + Einfügen.",
    aufgabe: "Die Reihenfolge stimmt nicht: Eigentlich sollt ihr zuerst gemeinsam kochen und danach erst einkaufen gehen. Markiere den ersten Satz komplett inklusive des Leerzeichens danach, schneide ihn aus und füge ihn hinter dem zweiten Satz wieder ein.",
    hint: "Ergebnis: „Danach kochen wir gemeinsam. Zuerst gehen wir einkaufen. Am Ende essen wir zusammen.“",
    paragraphs: ["Zuerst gehen wir einkaufen. Danach kochen wir gemeinsam. Am Ende essen wir zusammen."],
    demo: {
      type: "text-compare",
      vorher: "Zuerst gehen wir einkaufen. Danach kochen wir gemeinsam. Am Ende essen wir zusammen.",
      nachher: "Danach kochen wir gemeinsam. Zuerst gehen wir einkaufen. Am Ende essen wir zusammen.",
    },
    check: (ctx) => norm(ctx.plainText) ===
      norm("Danach kochen wir gemeinsam. Zuerst gehen wir einkaufen. Am Ende essen wir zusammen."),
  });

  missions.push({
    id: "abschluss-3", family: "T3", method: "tastatur",
    title: "Einen wichtigen Hinweis wiederholen",
    erklaerung: "Kombiniert: Strg+A (alles markieren) + Kopieren + mehrfaches Einfügen.",
    aufgabe: "Dieser Hinweis soll niemand übersehen: Markiere den gesamten Text mit Strg+A, kopiere ihn mit Strg+C, und füge ihn danach zweimal hintereinander in je einer neuen Zeile an (Enter für eine neue Zeile, dann Strg+V).",
    hint: "Am Ende soll der Text dreimal untereinander stehen.",
    paragraphs: ["Bitte Sportzeug nicht vergessen!"],
    demo: {
      type: "text-compare",
      vorher: "Bitte Sportzeug nicht vergessen!",
      nachher: "Bitte Sportzeug nicht vergessen!\nBitte Sportzeug nicht vergessen!\nBitte Sportzeug nicht vergessen!",
    },
    check: (ctx) => norm(ctx.plainText) ===
      norm("Bitte Sportzeug nicht vergessen!\nBitte Sportzeug nicht vergessen!\nBitte Sportzeug nicht vergessen!"),
  });

  missions.push({
    id: "abschluss-4", family: "T4", method: "tastatur",
    title: "Einen Fehler rückgängig machen und weiterschreiben",
    erklaerung: "Kombiniert: Markiert überschreiben + Rückgängig machen (Strg+Z) + Text ergänzen.",
    aufgabe: "Lösche zuerst das Wort „Montag“ und tippe stattdessen „Mittwoch“. Mache diese Änderung dann mit Strg+Z komplett rückgängig, sodass wieder „Montag“ dasteht. Ergänze anschließend am Satzende noch „ – bitte pünktlich sein!“.",
    hint: "Reihenfolge: überschreiben → Strg+Z → weiterschreiben.",
    paragraphs: ["Die Prüfung findet am Montag statt."],
    demo: {
      type: "text-compare",
      vorher: "Die Prüfung findet am Mittwoch statt. (nach Strg+Z wieder: Montag)",
      nachher: "Die Prüfung findet am Montag statt. – bitte pünktlich sein!",
    },
    check: (ctx) => {
      const expected = norm("Die Prüfung findet am Montag statt. – bitte pünktlich sein!");
      const sawMittwoch = [...ctx.seenTexts].some(t => t.includes("Mittwoch"));
      return norm(ctx.plainText) === expected && ctx.ctrlZCount >= 1 && sawMittwoch;
    },
  });

  missions.push({
    id: "abschluss-5", family: "T5", method: "beides",
    title: "Eine Nachricht überarbeiten",
    erklaerung: "Kombiniert: Überschreiben + Ausschneiden/Einfügen + Text ergänzen — wie eine echte Nachrichten-Korrektur.",
    aufgabe: "Überarbeite die Nachricht in drei Schritten: 1) Ersetze „Büro“ durch „Konferenzraum“. 2) Verschiebe „am Donnerstag “ (mit Leerzeichen danach) mit Ausschneiden/Einfügen direkt hinter „Meeting “ (vor „im“). 3) Ergänze ganz am Ende: „ Bitte pünktlich sein!“.",
    hint: "Arbeite die drei Schritte nacheinander ab — die Reihenfolge innerhalb eines Schritts ist egal, solange das Ergebnis stimmt.",
    paragraphs: ["Hallo Team, das Meeting im Büro findet am Donnerstag statt. LG"],
    demo: {
      type: "text-compare",
      vorher: "Hallo Team, das Meeting im Büro findet am Donnerstag statt. LG",
      nachher: "Hallo Team, das Meeting am Donnerstag im Konferenzraum findet statt. LG Bitte pünktlich sein!",
    },
    check: (ctx) => norm(ctx.plainText) ===
      norm("Hallo Team, das Meeting am Donnerstag im Konferenzraum findet statt. LG Bitte pünktlich sein!"),
  });

  // ---------------------------------------------------------------
  missions.forEach((m, i) => {
    m.baustein = i < 3 ? "B" : i < 12 ? "C" : "★";
    m.bausteinLabel = i < 3 ? "Texteingabe, Löschen & Undo"
      : i < 12 ? "Zwischenablage" : "Abschlussaufgaben";
  });

  window.RPEngine.start(missions, {
    familyLabel: "Rückgängig, Zwischenablage & Abschluss",
    startNumber: 28,
    totalCount: 44,
    onComplete: {
      title: "Redaktions-Profi abgeschlossen! 🎉",
      text: "Ihr habt alle 44 Missionen gemeistert — von Navigation und Markieren über Texteingabe, Löschen und Undo/Redo bis zur Zwischenablage und den Abschlussaufgaben.",
    },
  });
})();
