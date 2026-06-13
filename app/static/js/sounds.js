// Audio feedback for answer taps.
// Plays a sound inside the user's tap (the moment iOS allows audio), using the
// correct answer the page already knows (body[data-correct]), THEN lets the form
// submit as normal. Purely additive: no change to how the server validates answers.
(function () {
  var SUBMIT_DELAY_MS = 300; // wait before the page changes, so the sound can play
  var LEAD = 0.1;            // silent runway (s) so a just-woken audio engine doesn't clip the first note

  var ctx;
  function audio() {
    try {
      if (!ctx) {
        var AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        ctx = new AC();
      }
      if (ctx.state === "suspended") {
        ctx.resume();
      }
      return ctx;
    } catch (err) {
      return null;
    }
  }

  // Play a sequence of notes: [freq, startOffsetSec, durSec, waveform, peakGain]
  function blip(notes, attack) {
    var c = audio();
    if (!c) return;
    var now = c.currentTime + LEAD;
    var atk = attack || 0.012;
    notes.forEach(function (n) {
      var freq = n[0], t = n[1], dur = n[2], type = n[3] || "sine", peak = n[4] || 0.18;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      var start = now + t;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + atk);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    });
  }

  function playCorrect() {
    // Rounded rising blip: two triangle notes (C5 -> G5) with a soft attack.
    blip([[523, 0, 0.17, "triangle", 0.16], [784, 0.1, 0.24, "triangle", 0.16]], 0.022);
  }
  function playWrong() {
    // Soft low buzz.
    blip([[180, 0, 0.2, "square", 0.12]]);
  }

  // Construct the audio engine right away so it is initialized well before the
  // first tap, then fully wake it (resume + a brief silent primer) on the first
  // user gesture so cold-start latency doesn't swallow the start of a sound.
  audio();
  function warm() {
    var c = audio();
    if (c) {
      try {
        var o = c.createOscillator();
        var g = c.createGain();
        g.gain.value = 0.0001;
        o.connect(g);
        g.connect(c.destination);
        o.start();
        o.stop(c.currentTime + 0.03);
      } catch (err) {}
    }
    document.removeEventListener("pointerdown", warm, true);
    document.removeEventListener("touchstart", warm, true);
  }
  document.addEventListener("pointerdown", warm, true);
  document.addEventListener("touchstart", warm, { passive: true, capture: true });

  function wire() {
    var correct = document.body.getAttribute("data-correct");
    if (correct === null) return; // not an answer page
    var form = document.querySelector("form");
    if (!form) return;
    var buttons = form.querySelectorAll(".option-button");
    if (!buttons.length) return;

    var submitting = false;
    buttons.forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (submitting) return;
        submitting = true;

        var value = btn.getAttribute("value");
        try {
          if (String(value).trim() === String(correct).trim()) {
            playCorrect();
          } else {
            playWrong();
          }
        } catch (err) {
          // Never let an audio hiccup block answering.
        }

        // Preserve which answer was chosen (form.submit() drops the button's value).
        var hidden = document.createElement("input");
        hidden.type = "hidden";
        hidden.name = btn.getAttribute("name");
        hidden.value = value;
        form.appendChild(hidden);

        setTimeout(function () {
          form.submit();
        }, SUBMIT_DELAY_MS);
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wire);
  } else {
    wire();
  }
})();
