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

    // Debug: ver qué días se están pasando
    console.log("Añadiendo nota:", text, "con días:", days);

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

    // KIOSKO: solo notas del día actual
    if (st.settings.kiosk) {
      for (var i = 0; i < st.notes.length; i++) {
        var n = st.notes[i];
        if (n.days && n.days.indexOf(dow) >= 0) {
          any = true;
          var li = document.createElement("li");
          var textEl = document.createElement("div");
          textEl.className = "note-text";
          textEl.textContent = n.text;
          li.appendChild(textEl);
          list.appendChild(li);
        }
      }
      // Ocultar tarjeta si no hay notas de hoy
      var notesCard = document.getElementById("notesCard");
      if (notesCard) {
        if (!any) notesCard.style.display = "none";
        else notesCard.style.display = "";
      }
    } else {
      // ADMINISTRACIÓN: mostrar todas las notas con badges de días
      // En administración siempre mostrar la tarjeta, aunque no haya notas
      var notesCard = document.getElementById("notesCard");
      if (notesCard) {
        notesCard.style.display = "";
      }
      for (var i = 0; i < st.notes.length; i++) {
        var n = st.notes[i];
        var li = document.createElement("li");

        // Contenido principal
        var textEl = document.createElement("div");
        textEl.className = "note-text";
        textEl.textContent = n.text;
        li.appendChild(textEl);

        // Badges de todos los días, inactivos atenuados
        var daysEl = document.createElement("div");
        daysEl.className = "days-badges";
        var allDays = ["L", "M", "X", "J", "V", "S", "D"];
        var dayIdx = [1, 2, 3, 4, 5, 6, 0];
        for (var d = 0; d < dayIdx.length; d++) {
          var b = document.createElement("span");
          var active = n.days && n.days.indexOf(dayIdx[d]) >= 0;
          b.className = active ? "day-badge" : "day-badge muted";
          b.textContent = allDays[d];
          daysEl.appendChild(b);
        }
        li.appendChild(daysEl);

        // Borrado con clic
        li.onclick = (function (id) {
          return function () {
            if (confirm("¿Eliminar nota?")) delNote(id);
          };
        })(n.id);

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
