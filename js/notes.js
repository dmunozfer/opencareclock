(function () {
  function getSelectedDays() {
    var boxes = document.getElementsByName("noteDay");
    var out = [];
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) out.push(parseInt(boxes[i].value, 10));
    }
    return out;
  }

  function addNote(text, days) {
    // Bloquear en modo kiosko
    if (
      window.CCState &&
      window.CCState.state &&
      window.CCState.state.settings &&
      window.CCState.state.settings.kiosk
    )
      return;
    if (!text) return;
    var st = window.CCState.state;
    if (!days || !days.length) days = [new Date().getDay()]; // por defecto solo hoy
    st.notes.push({ id: "n" + new Date().getTime(), text: text, days: days });
    window.CCState.save();
    renderToday();
  }

  function delNote(id) {
    // Bloquear en modo kiosko
    if (
      window.CCState &&
      window.CCState.state &&
      window.CCState.state.settings &&
      window.CCState.state.settings.kiosk
    )
      return;
    var st = window.CCState.state;
    for (var i = 0; i < st.notes.length; i++) {
      if (st.notes[i].id === id) {
        st.notes.splice(i, 1);
        break;
      }
    }
    window.CCState.save();
    renderToday();
  }

  function renderToday() {
    var st = window.CCState.state;
    var dow = new Date().getDay();
    var list = document.getElementById("notes");
    if (!list) return;
    list.innerHTML = "";
    var any = false;
    for (var i = 0; i < st.notes.length; i++) {
      var n = st.notes[i];
      if (n.days && n.days.indexOf(dow) >= 0) {
        any = true;
        var li = document.createElement("li");
        // Contenido principal
        var textEl = document.createElement("div");
        textEl.className = "note-text";
        textEl.textContent = n.text;
        li.appendChild(textEl);
        // En administración mostrar badges de días
        if (!st.settings.kiosk) {
          var daysEl = document.createElement("div");
          daysEl.className = "days-badges";
          var allDays = ["L", "M", "X", "J", "V", "S", "D"];
          var dayIdx = [1, 2, 3, 4, 5, 6, 0];
          for (var d = 0; d < dayIdx.length; d++) {
            if (n.days && n.days.indexOf(dayIdx[d]) >= 0) {
              var b = document.createElement("span");
              b.className = "day-badge";
              b.textContent = allDays[d];
              daysEl.appendChild(b);
            }
          }
          li.appendChild(daysEl);
        }
        // Borrado con clic: deshabilitado en kiosko
        if (!st.settings.kiosk) {
          li.onclick = (function (id) {
            return function () {
              if (confirm("¿Eliminar nota?")) delNote(id);
            };
          })(n.id);
        }
        list.appendChild(li);
      }
    }
    if (window.CCLayout && window.CCLayout.update) window.CCLayout.update();
  }

  window.CCNotes = {
    add: addNote,
    del: delNote,
    renderToday: renderToday,
    getSelectedDays: getSelectedDays,
  };
})();
