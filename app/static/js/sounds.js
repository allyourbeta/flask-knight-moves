// Audio feedback for answer taps.
// Plays a sound inside the user's tap (the moment iOS allows audio), using the
// correct answer the page already knows (body[data-correct]), THEN lets the form
// submit as normal. Purely additive: no change to how the server validates answers.
(function () {
  var SUBMIT_DELAY_MS = 200; // let the blip sound before the page changes

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
  function blip(notes) {
    var c = audio();
    if (!c) return;
    var now = c.currentTime;
    notes.forEach(function (n) {
      var freq = n[0], t = n[1], dur = n[2], type = n[3] || "sine", peak = n[4] || 0.18;
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      var start = now + t;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(peak, start + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(start);
      osc.stop(start + dur + 0.03);
    });
  }

  function playCorrect() {
    // "Warm" rising blip (triangle wave, two notes up a fifth).
    blip([[660, 0, 0.11, "triangle", 0.2], [990, 0.09, 0.14, "triangle", 0.2]]);
  }
  function playWrong() {
    // Soft low buzz.
    blip([[180, 0, 0.2, "square", 0.12]]);
  }

  // Warm the audio context up on the very first interaction so the first
  // answer sound is reliable on iOS.
  function warm() {
    audio();
    document.removeEventListener("pointerdown", warm);
    document.removeEventListener("touchstart", warm);
  }
  document.addEventListener("pointerdown", warm);
  document.addEventListener("touchstart", warm, { passive: true });

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
