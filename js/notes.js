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

    st.notes.push({
      id: "n" + new Date().getTime(),
      text: text,
      days: days,
      active: true,
    });
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

  function toggleActive(id) {
    var st = window.CCState.state;
    for (var i = 0; i < st.notes.length; i++) {
      if (st.notes[i].id === id) {
        st.notes[i].active = !st.notes[i].active;
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

    // KIOSKO: solo notas del día actual y activas
    if (st.settings.kiosk) {
      for (var i = 0; i < st.notes.length; i++) {
        var n = st.notes[i];
        if (n.days && n.days.indexOf(dow) >= 0 && n.active !== false) {
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
      // ADMINISTRACIÓN: mostrar TODAS las notas (activas e inactivas)
      var notesCard = document.getElementById("notesCard");
      if (notesCard) {
        notesCard.style.display = "";
      }

      // Mostrar todas las notas, sin filtrar por día ni estado activo
      for (var i = 0; i < st.notes.length; i++) {
        var n = st.notes[i];
        var li = document.createElement("li");

        // Aplicar clase si está inactiva
        if (n.active === false) {
          li.classList.add("inactive");
        }

        // Checkbox de activo/inactivo
        var checkboxEl = document.createElement("input");
        checkboxEl.type = "checkbox";
        checkboxEl.checked = n.active !== false;
        checkboxEl.className = "active-checkbox";
        checkboxEl.onclick = (function (id) {
          return function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            toggleActive(id);
            return false;
          };
        })(n.id);
        li.appendChild(checkboxEl);

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

        // Borrado con clic (pero no en el checkbox)
        li.onclick = (function (id) {
          return function (e) {
            // No borrar si se hizo click en el checkbox o sus elementos hijos
            if (
              e.target &&
              (e.target.type === "checkbox" ||
                e.target.closest(".active-checkbox"))
            ) {
              return;
            }
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
    toggleActive: toggleActive,
    renderToday: renderToday,
    getSelectedDays: getSelectedDays,
  };
})();
