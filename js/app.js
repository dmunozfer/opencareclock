(function () {
  function applySettings() {
    var st = window.CCState.state;
    // Tema
    document.body.className = document.body.className.replace(
      /(theme-light|theme-contrast|kiosk|admin-mode|no-notes)/g,
      ""
    );
    if (st.settings.theme === "light")
      document.body.classList.add("theme-light");
    else if (st.settings.theme === "contrast")
      document.body.classList.add("theme-contrast");
    if (st.settings.kiosk) {
      document.body.classList.add("kiosk");
    } else {
      document.body.classList.add("admin-mode");
    }

    // Escala
    var root = document.getElementById("root"); // puede no existir ya, aplicamos a body
    var scaleClasses = ["scale-100", "scale-120", "scale-140", "scale-160"];
    for (var i = 0; i < scaleClasses.length; i++)
      document.body.classList.remove(scaleClasses[i]);
    document.body.classList.add("scale-" + st.settings.scale);

    // Selects y títulos según modo
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

    // Títulos de tarjetas según modo
    var notesTitle = document.querySelector("#notesCard .section-title");
    if (notesTitle)
      notesTitle.textContent = st.settings.kiosk ? "Notas de hoy" : "Notas";
    var remTitle = document.querySelector("#remindersCard .section-title");
    if (remTitle)
      remTitle.textContent = st.settings.kiosk
        ? "Recordatorios de hoy"
        : "Recordatorios";

    // Footer: ocultar hint y puntos si no estamos en kiosko
    var footerHint = document.getElementById("footerHint");
    var footer = document.getElementById("footer");
    if (footerHint) footerHint.style.display = st.settings.kiosk ? "" : "none";
    if (footer) footer.title = st.settings.kiosk ? footer.title : "";
    var dots = footer ? footer.querySelectorAll(".dot") : [];
    for (var di = 0; di < dots.length; di++) {
      dots[di].style.display = st.settings.kiosk ? "" : "none";
    }

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

    // ¿Notas de hoy? (solo activas)
    for (var i = 0; i < st.notes.length; i++) {
      if (
        st.notes[i].days &&
        st.notes[i].days.indexOf(dow) >= 0 &&
        st.notes[i].active !== false
      ) {
        hasNotes = true;
        break;
      }
    }
    // ¿Recordatorios de hoy? (solo activos)
    for (var j = 0; j < st.reminders.length; j++) {
      if (
        st.reminders[j].days &&
        st.reminders[j].days.indexOf(dow) >= 0 &&
        st.reminders[j].active !== false
      ) {
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
    var isTouchDevice =
      "ontouchstart" in window || navigator.maxTouchPoints > 0;

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
        // Re-render inmediato al salir de kiosko
        if (window.CCNotes && window.CCNotes.renderToday)
          window.CCNotes.renderToday();
        if (window.CCReminders && window.CCReminders.renderToday)
          window.CCReminders.renderToday();
        if (window.CCLayout && window.CCLayout.update) window.CCLayout.update();
      }, 2000); // 2s pulsación larga
    }

    // En dispositivos táctiles usar solo eventos touch, en desktop usar mouse
    if (isTouchDevice) {
      footer.ontouchstart = function (e) {
        e.preventDefault(); // evitar zoom
        start();
      };
      footer.ontouchend = clear;
      footer.ontouchcancel = clear;
    } else {
      footer.onmousedown = start;
      footer.onmouseup = clear;
      footer.onmouseleave = clear;
    }
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
          // Re-render inmediato al salir de kiosko
          if (window.CCNotes && window.CCNotes.renderToday)
            window.CCNotes.renderToday();
          if (window.CCReminders && window.CCReminders.renderToday)
            window.CCReminders.renderToday();
          if (window.CCLayout && window.CCLayout.update)
            window.CCLayout.update();
        }
        taps = 0;
      }, 500);
    };
  }

  function bindUI() {
    var addNoteBtn = document.getElementById("addNote");
    var selAllNotes = document.getElementById("selectAllNotesDays");
    if (selAllNotes) {
      selAllNotes.onclick = function () {
        if (window.CCState.state.settings.kiosk) return;
        var boxes = document.getElementsByName("noteDay");
        var allChecked = true;
        for (var i = 0; i < boxes.length; i++)
          if (!boxes[i].checked) allChecked = false;
        var newVal = allChecked ? false : true; // si todos marcados -> ninguno; si no -> todos
        for (var j = 0; j < boxes.length; j++) boxes[j].checked = newVal;
        updateSelectAllButtons();
      };
    }
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
    var selAllRem = document.getElementById("selectAllRemDays");
    if (selAllRem) {
      selAllRem.onclick = function () {
        if (window.CCState.state.settings.kiosk) return;
        var boxes = document.getElementsByName("remDay");
        var allChecked = true;
        for (var i = 0; i < boxes.length; i++)
          if (!boxes[i].checked) allChecked = false;
        var newVal = allChecked ? false : true;
        for (var j = 0; j < boxes.length; j++) boxes[j].checked = newVal;
        updateSelectAllButtons();
      };
    }

    // Mantener texto del botón Todos/Ninguno actualizado según selección
    function updateSelectAllButtons() {
      var selAllNotesBtn = document.getElementById("selectAllNotesDays");
      var noteBoxes = document.getElementsByName("noteDay");
      if (selAllNotesBtn && noteBoxes && noteBoxes.length) {
        var allCheckedN = true;
        for (var i = 0; i < noteBoxes.length; i++)
          if (!noteBoxes[i].checked) allCheckedN = false;
        selAllNotesBtn.textContent = allCheckedN ? "Ninguno" : "Todos";
      }
      var selAllRemBtn = document.getElementById("selectAllRemDays");
      var remBoxes = document.getElementsByName("remDay");
      if (selAllRemBtn && remBoxes && remBoxes.length) {
        var allCheckedR = true;
        for (var j = 0; j < remBoxes.length; j++)
          if (!remBoxes[j].checked) allCheckedR = false;
        selAllRemBtn.textContent = allCheckedR ? "Ninguno" : "Todos";
      }
    }

    // Escuchar cambios individuales de checkbox para refrescar botones
    var wireChange = function (name) {
      var boxes = document.getElementsByName(name);
      for (var i = 0; i < boxes.length; i++) {
        boxes[i].onchange = updateSelectAllButtons;
      }
    };
    wireChange("noteDay");
    wireChange("remDay");
    // Inicializar labels de botones
    updateSelectAllButtons();
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
        // Re-render para refrescar handlers (borrado habilitado/inhabilitado)
        if (window.CCNotes && window.CCNotes.renderToday)
          window.CCNotes.renderToday();
        if (window.CCReminders && window.CCReminders.renderToday)
          window.CCReminders.renderToday();
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

    // Configurar pantalla completa para kiosko
    setupFullscreen();
  }

  function setupFullscreen() {
    // Prevenir gestos de navegación en kiosko
    if (window.CCState.state.settings.kiosk) {
      // Prevenir zoom con gestos
      document.addEventListener("gesturestart", function (e) {
        e.preventDefault();
      });
      document.addEventListener("gesturechange", function (e) {
        e.preventDefault();
      });
      document.addEventListener("gestureend", function (e) {
        e.preventDefault();
      });

      // Prevenir scroll y navegación
      document.addEventListener(
        "touchmove",
        function (e) {
          if (e.touches.length > 1) {
            e.preventDefault(); // prevenir zoom con dos dedos
          }
        },
        { passive: false }
      );

      // Prevenir menú contextual
      document.addEventListener("contextmenu", function (e) {
        e.preventDefault();
      });
    }
  }

  init();
})();
