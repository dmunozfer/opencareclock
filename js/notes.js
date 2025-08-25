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
        li.textContent = n.text;
        // Botón eliminar con clic: deshabilitar en kiosko
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
