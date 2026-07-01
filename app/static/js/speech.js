// speech.js -- spoken answer reinforcement for the Square Color drill.
//
// Purely additive and opt-in. A "Speak" toggle (mirroring the existing "Auto"
// toggle) that, when ON, says the answer aloud right after a CORRECT color
// guess -- e.g. square h1 -> "H 1 is white". Wrong guesses are untouched.
//
// Only active on the color game. game.js calls ChessSpeech.onColorCorrect(...)
// at the moment a color answer is confirmed correct. If this module handles the
// announcement it returns true and takes over advancing to the next square (so
// game.js skips its own fixed-delay auto-advance); otherwise it returns false
// and game.js behaves EXACTLY as it does today.
(function () {
  // Word spoken for each square color. Chess convention is "light"/"dark";
  // swap these two values if you'd rather hear that than "white"/"black".
  var COLOR_WORD = { light: "white", dark: "black" };

  var STORAGE_KEY = "chess-speak";
  var SAFETY_MS = 4000; // if the browser never fires onend (an iOS quirk), advance anyway

  var synth = window.speechSynthesis || null;
  function supported() {
    return !!synth && typeof window.SpeechSynthesisUtterance !== "undefined";
  }

  var enabled = localStorage.getItem(STORAGE_KEY) === "true"; // opt-in: OFF by default

  // ---- speech engine ------------------------------------------------------
  // iOS is fussy: it wants the speech engine unlocked inside a real user
  // gesture, exactly like the Web Audio beeps. We prime it (silently) on the
  // first tap, and again whenever the toggle is switched on (that tap counts).
  var warmed = false;
  function warm() {
    if (!supported() || warmed) return;
    warmed = true;
    try {
      var u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      synth.speak(u);
    } catch (e) {}
  }
  document.addEventListener("pointerdown", warm, true);
  document.addEventListener("touchstart", warm, { passive: true, capture: true });

  function speak(text, onDone) {
    if (!supported()) { if (onDone) onDone(); return false; }
    try {
      synth.cancel(); // never queue or overlap utterances
      var u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95; // a touch slower for clarity
      u.pitch = 1.0;
      u.volume = 1.0;
      if (onDone) { u.onend = onDone; u.onerror = onDone; } // never hang the loop
      synth.speak(u);
      return true;
    } catch (e) {
      if (onDone) onDone();
      return false;
    }
  }

  function cancel() {
    if (supported()) { try { synth.cancel(); } catch (e) {} }
  }

  // "h1","light" -> "H 1 is white". The space makes voices say "H one"
  // instead of mangling "h1".
  function sentence(square, color) {
    var sq = String(square || "");
    var word = COLOR_WORD[color] || color || "";
    return sq.charAt(0).toUpperCase() + " " + sq.charAt(1) + " is " + word;
  }

  // ---- the "Speak" toggle (mirrors game.js's "Auto" toggle) ---------------
  var toggle = document.createElement("div");
  toggle.style.cssText =
    "display:flex;align-items:center;gap:6px;font-size:12px;color:var(--text-secondary);cursor:pointer;user-select:none;";
  function render() {
    toggle.innerHTML =
      '<span>Speak</span><div style="width:34px;height:18px;background:' +
      (enabled ? "var(--accent-gold)" : "#555") +
      ';border-radius:9px;position:relative;transition:background .2s"><div style="width:14px;height:14px;background:#fff;border-radius:50%;position:absolute;top:2px;left:' +
      (enabled ? "18px" : "2px") +
      ';transition:left .2s"></div></div>';
  }
  toggle.addEventListener("click", function () {
    enabled = !enabled;
    localStorage.setItem(STORAGE_KEY, enabled ? "true" : "false");
    render();
    if (enabled) warm(); // this tap is a valid gesture to unlock iOS speech
    else cancel();       // turning it off silences anything mid-sentence
  });

  function mount() {
    if (!document.body.classList.contains("game-color")) return; // color drill only
    render();
    var nav = document.querySelector(".navigation-section");
    if (!nav) return;
    // Group our toggle next to the existing "Auto" toggle on the right.
    var autoToggle = null, kids = nav.children, i;
    for (i = 0; i < kids.length; i++) {
      if (kids[i].tagName === "DIV") { autoToggle = kids[i]; break; }
    }
    if (autoToggle) {
      var wrap = document.createElement("div");
      wrap.style.cssText = "display:flex;align-items:center;gap:16px;";
      nav.insertBefore(wrap, autoToggle);
      wrap.appendChild(autoToggle); // moves the existing toggle into the group
      wrap.appendChild(toggle);
    } else {
      nav.appendChild(toggle);
    }
    // Manually clicking "Next" while a square is still being spoken silences it.
    var nextBtn = document.querySelector(".result-next");
    if (nextBtn) nextBtn.addEventListener("click", cancel);
  }

  // ---- the hook game.js calls on a correct color answer -------------------
  // Returns true if we announced it (and, when auto is on, will drive the
  // advance); false means "not my job -- game.js, carry on as usual".
  function onColorCorrect(data, auto, nextBtn) {
    if (!enabled || !supported()) return false;
    var text = sentence(data.square, data.correct_color);
    if (auto) {
      var advanced = false;
      var go = function () {
        if (advanced) return; // fire once, whether via onend or the safety net
        advanced = true;
        if (nextBtn) nextBtn.click(); // reuses game.js's own loadNext handler
      };
      if (nextBtn) nextBtn.style.display = "none";
      speak(text, go);
      setTimeout(go, SAFETY_MS); // safety net in case onend never arrives
    } else {
      speak(text, null);
      if (nextBtn) nextBtn.style.display = ""; // let the user advance when ready
    }
    return true;
  }

  window.ChessSpeech = {
    supported: supported,
    warm: warm,
    speak: speak,
    cancel: cancel,
    onColorCorrect: onColorCorrect
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
