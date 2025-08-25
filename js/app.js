(function () {
  function applySettings() {
    var st = window.CCState.state;
    // tema
    document.body.className = document.body.className.replace(
      /(theme-light|theme-contrast|kiosk)/g,
      ""
    );
    if (st.settings.theme === "light") {
      document.body.classList.add("theme-light");
    } else if (st.settings.theme === "contrast") {
      document.body.classList.add("theme-contrast");
    }

    // scale
    var root = document.getElementById("root");
    if (root) {
      root.className = root.className.replace(/scale-\d{3}/g, "");
      root.classList.add("scale-" + st.settings.scale);
    }

    // selects
    var themeSel = document.getElementById("themeSel");
    if (themeSel)
      themeSel.value =
        st.settings.theme === "dark"
          ? "dark"
          : st.settings.theme === "light"
          ? "light"
          : "contrast";
    var scaleSel = document.getElementById("scaleSel");
    if (scaleSel) scaleSel.value = String(st.settings.scale);
    var hourSel = document.getElementById("hourSel");
    if (hourSel) hourSel.value = String(st.settings.hourFormat);
    var secChk = document.getElementById("secChk");
    if (secChk) secChk.checked = !!st.settings.showSeconds;

    // kiosk
    if (st.settings.kiosk) {
      document.body.classList.add("kiosk");
    } else {
      document.body.classList.remove("kiosk");
    }
  }

  function exportData() {
    var data = JSON.stringify(window.CCState.state, null, 2);
    var blob = new Blob([data], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "calendar-clock-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 1000);
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        if (obj.settings) window.CCState.state.settings = obj.settings;
        if (obj.notes) window.CCState.state.notes = obj.notes;
        if (obj.reminders) window.CCState.state.reminders = obj.reminders;
        window.CCState.save();
        applySettings();
        window.CCNotes.render();
        window.CCReminders.render();
      } catch (e) {}
    };
    reader.readAsText(file);
  }

  function bind() {
    var addNoteBtn = document.getElementById("addNote");
    if (addNoteBtn)
      addNoteBtn.onclick = function () {
        var v = document.getElementById("noteInput").value;
        document.getElementById("noteInput").value = "";
        window.CCNotes.add(v);
      };
    var noteInput = document.getElementById("noteInput");
    if (noteInput)
      noteInput.onkeypress = function (e) {
        if (e.keyCode === 13) {
          var v = noteInput.value;
          noteInput.value = "";
          window.CCNotes.add(v);
        }
      };

    var addRemBtn = document.getElementById("addReminder");
    if (addRemBtn)
      addRemBtn.onclick = function () {
        var t = document.getElementById("remTime").value;
        var l = document.getElementById("remLabel").value;
        var d = window.CCReminders.getSelectedDays();
        document.getElementById("remTime").value = "";
        document.getElementById("remLabel").value = "";
        window.CCReminders.add(t, l, d);
      };
    var remLabel = document.getElementById("remLabel");
    if (remLabel)
      remLabel.onkeypress = function (e) {
        if (e.keyCode === 13) {
          var t = document.getElementById("remTime").value;
          var l = remLabel.value;
          var d = window.CCReminders.getSelectedDays();
          document.getElementById("remTime").value = "";
          remLabel.value = "";
          window.CCReminders.add(t, l, d);
        }
      };

    var themeSel = document.getElementById("themeSel");
    if (themeSel)
      themeSel.onchange = function () {
        var st = window.CCState.state;
        st.settings.theme =
          themeSel.value === "dark"
            ? "dark"
            : themeSel.value === "light"
            ? "light"
            : "contrast";
        window.CCState.save();
        applySettings();
      };
    var scaleSel = document.getElementById("scaleSel");
    if (scaleSel)
      scaleSel.onchange = function () {
        var st = window.CCState.state;
        st.settings.scale = parseInt(scaleSel.value, 10);
        window.CCState.save();
        applySettings();
      };
    var hourSel = document.getElementById("hourSel");
    if (hourSel)
      hourSel.onchange = function () {
        var st = window.CCState.state;
        st.settings.hourFormat = parseInt(hourSel.value, 10);
        window.CCState.save();
      };
    var secChk = document.getElementById("secChk");
    if (secChk)
      secChk.onchange = function () {
        var st = window.CCState.state;
        st.settings.showSeconds = !!secChk.checked;
        window.CCState.save();
      };

    var btnKiosk = document.getElementById("btnKiosk");
    if (btnKiosk)
      btnKiosk.onclick = function () {
        var st = window.CCState.state;
        st.settings.kiosk = !st.settings.kiosk;
        window.CCState.save();
        applySettings();
      };

    var btnExport = document.getElementById("btnExport");
    if (btnExport) btnExport.onclick = exportData;
    var importFile = document.getElementById("importFile");
    if (importFile)
      importFile.onchange = function () {
        if (importFile.files && importFile.files[0]) {
          importData(importFile.files[0]);
        }
      };

    // triple toque en la hora para salir del kiosko
    var timeEl = document.getElementById("time");
    if (timeEl) {
      var taps = 0;
      var tapTimer;
      timeEl.onclick = function () {
        taps++;
        clearTimeout(tapTimer);
        tapTimer = setTimeout(function () {
          if (taps >= 3) {
            var st = window.CCState.state;
            st.settings.kiosk = false;
            window.CCState.save();
            applySettings();
          }
          taps = 0;
        }, 500);
      };
    }
  }

  function updateLayoutNoNotes() {
    var st = window.CCState.state;
    var hasNotes = st.notes && st.notes.length > 0;
    var hasRems = st.reminders && st.reminders.length > 0;
    document.body.classList.toggle("no-notes", !(hasNotes || hasRems));
  }
  window.CCLayout = { update: updateLayoutNoNotes };

  function init() {
    window.CCState.load();
    applySettings();
    window.CCNotes.render();
    window.CCReminders.render();
    window.CCClock.start();
    window.CCReminders.start();
    window.CCLayout.update();
    bind();
  }

  init();
})();
