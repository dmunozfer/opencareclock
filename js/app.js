(function () {
  function applySettings() {
    var st = window.CCState.state;
    // Tema
    document.body.className = document.body.className.replace(
      /(theme-light|theme-contrast|kiosk|no-notes)/g,
      ""
    );
    if (st.settings.theme === "light")
      document.body.classList.add("theme-light");
    else if (st.settings.theme === "contrast")
      document.body.classList.add("theme-contrast");
    if (st.settings.kiosk) document.body.classList.add("kiosk");

    // Escala
    var root = document.getElementById("root"); // puede no existir ya, aplicamos a body
    var scaleClasses = ["scale-100", "scale-120", "scale-140", "scale-160"];
    for (var i = 0; i < scaleClasses.length; i++)
      document.body.classList.remove(scaleClasses[i]);
    document.body.classList.add("scale-" + st.settings.scale);

    // Selects
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

    // Entradas deshabilitadas en kiosko (solo lectura visual y funcional)
    var disableWhenKiosk = [
      "noteInput",
      "addNote",
      "remTime",
      "remLabel",
      "addReminder",
    ];
    for (var i = 0; i < disableWhenKiosk.length; i++) {
      var el = document.getElementById(disableWhenKiosk[i]);
      if (el) el.disabled = !!st.settings.kiosk;
    }
  }

  function updateLayoutNoNotes() {
    var st = window.CCState.state;
    var dow = new Date().getDay();
    var hasNotes = false,
      hasRems = false;

    // ¿Notas de hoy?
    for (var i = 0; i < st.notes.length; i++) {
      if (st.notes[i].days && st.notes[i].days.indexOf(dow) >= 0) {
        hasNotes = true;
        break;
      }
    }
    // ¿Recordatorios de hoy?
    for (var j = 0; j < st.reminders.length; j++) {
      if (st.reminders[j].days && st.reminders[j].days.indexOf(dow) >= 0) {
        hasRems = true;
        break;
      }
    }

    var noNotes = !(hasNotes || hasRems);
    if (noNotes) document.body.classList.add("no-notes");
    else document.body.classList.remove("no-notes");
  }
  window.CCLayout = { update: updateLayoutNoNotes };

  function exportData() {
    var data = JSON.stringify(window.CCState.state, null, 2);
    var url = URL.createObjectURL(
      new Blob([data], { type: "application/json" })
    );
    var a = document.createElement("a");
    a.href = url;
    a.download = "opencareclock-config.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () {
      URL.revokeObjectURL(url);
    }, 500);
  }

  function importData(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var obj = JSON.parse(reader.result);
        var st = window.CCState.state;
        if (obj.settings) st.settings = obj.settings;
        if (obj.notes) st.notes = obj.notes;
        if (obj.reminders) st.reminders = obj.reminders;
        if (obj.completedByDate) st.completedByDate = obj.completedByDate;
        window.CCState.save();
        applySettings();
        window.CCNotes.renderToday();
        window.CCReminders.renderToday();
        updateLayoutNoNotes();
      } catch (e) {}
    };
    reader.readAsText(file);
  }

  // Kiosko: salida con pulsación larga en el footer (+ PIN opcional)
  function bindFooterKioskExit() {
    var footer = document.getElementById("footer");
    if (!footer) return;
    var timer;
    function clear() {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
    function start() {
      timer = setTimeout(function () {
        var st = window.CCState.state;
        // Si hay PIN activado, pedirlo
        if (st.settings.kioskPinEnabled && st.settings.kioskPin) {
          var pin = window.prompt(
            "Introduce PIN para salir del modo kiosko:",
            ""
          );
          if (pin !== st.settings.kioskPin) {
            clear();
            return;
          }
        }
        st.settings.kiosk = false;
        window.CCState.save();
        applySettings();
      }, 2000); // 2s pulsación larga
    }
    footer.onmousedown = start;
    footer.onmouseup = clear;
    footer.onmouseleave = clear;
    footer.ontouchstart = start;
    footer.ontouchend = clear;
    footer.ontouchcancel = clear;
  }

  // Plan B: triple toque en la hora
  function bindTripleTapOnTime() {
    var timeEl = document.getElementById("time");
    if (!timeEl) return;
    var taps = 0,
      tapTimer;
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

  function bindUI() {
    var addNoteBtn = document.getElementById("addNote");
    if (addNoteBtn)
      addNoteBtn.onclick = function () {
        if (window.CCState.state.settings.kiosk) return;
        var text = document.getElementById("noteInput").value;
        document.getElementById("noteInput").value = "";
        var days = window.CCNotes.getSelectedDays();
        window.CCNotes.add(text, days);
      };
    var noteInput = document.getElementById("noteInput");
    if (noteInput)
      noteInput.onkeypress = function (e) {
        if (e.keyCode === 13) {
          addNoteBtn.click();
        }
      };

    var addRemBtn = document.getElementById("addReminder");
    if (addRemBtn)
      addRemBtn.onclick = function () {
        if (window.CCState.state.settings.kiosk) return;
        var t = document.getElementById("remTime").value;
        var l = document.getElementById("remLabel").value;
        document.getElementById("remTime").value = "";
        document.getElementById("remLabel").value = "";
        var days = window.CCReminders.getSelectedDays();
        window.CCReminders.add(t, l, days);
      };
    var remLabel = document.getElementById("remLabel");
    if (remLabel)
      remLabel.onkeypress = function (e) {
        if (e.keyCode === 13) {
          addRemBtn.click();
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
        if (importFile.files && importFile.files[0])
          importData(importFile.files[0]);
      };

    bindFooterKioskExit();
    bindTripleTapOnTime();
  }

  function init() {
    window.CCState.load();
    applySettings();
    window.CCClock.start();
    window.CCNotes.renderToday();
    window.CCReminders.renderToday();
    window.CCReminders.start();
    updateLayoutNoNotes();
    bindUI();
  }

  init();
})();
