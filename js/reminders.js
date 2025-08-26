(function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }
  function todayKey() {
    var d = new Date();
    return (
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate())
    );
  }

  function createIconSVG(kind) {
    // kind: 'check' | 'clock' | 'alert'
    var svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");
    var path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("fill", "currentColor");
    if (kind === "check") {
      path.setAttribute("d", "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z");
    } else if (kind === "clock") {
      // use a bell instead for better recognition
      path.setAttribute(
        "d",
        "M12 22a2 2 0 002-2h-4a2 2 0 002 2zm6-6V11a6 6 0 10-12 0v5l-2 2v1h16v-1l-2-2z"
      );
    } else {
      // alert icon: outlined triangle + exclamation mark
      var tri = document.createElementNS("http://www.w3.org/2000/svg", "path");
      tri.setAttribute("d", "M12 3L2 21h20L12 3z");
      tri.setAttribute("fill", "none");
      tri.setAttribute("stroke", "currentColor");
      tri.setAttribute("stroke-width", "3");
      tri.setAttribute("stroke-linejoin", "round");

      var line = document.createElementNS("http://www.w3.org/2000/svg", "path");
      line.setAttribute("d", "M12 9v6");
      line.setAttribute("fill", "none");
      line.setAttribute("stroke", "currentColor");
      line.setAttribute("stroke-width", "3");
      line.setAttribute("stroke-linecap", "round");

      var dot = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );
      dot.setAttribute("cx", "12");
      dot.setAttribute("cy", "17");
      dot.setAttribute("r", "1.2");
      dot.setAttribute("fill", "currentColor");

      svg.appendChild(tri);
      svg.appendChild(line);
      svg.appendChild(dot);
      return svg;
    }
    svg.appendChild(path);
    return svg;
  }

  function getSelectedDays() {
    var boxes = document.getElementsByName("remDay");
    var out = [];
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) out.push(parseInt(boxes[i].value, 10));
    }
    return out.length ? out : [0, 1, 2, 3, 4, 5, 6];
  }

  function addReminder(time, label, days) {
    // Bloquear en modo kiosko
    if (
      window.CCState &&
      window.CCState.state &&
      window.CCState.state.settings &&
      window.CCState.state.settings.kiosk
    )
      return;
    if (!time || !label) return;
    var st = window.CCState.state;
    st.reminders.push({
      id: "r" + new Date().getTime(),
      time: time,
      label: label,
      days: days,
      active: true,
    });
    window.CCState.save();
    renderToday();
  }

  function delReminder(id) {
    // Bloquear en modo kiosko
    if (
      window.CCState &&
      window.CCState.state &&
      window.CCState.state.settings &&
      window.CCState.state.settings.kiosk
    )
      return;
    var st = window.CCState.state;
    for (var i = 0; i < st.reminders.length; i++) {
      if (st.reminders[i].id === id) {
        st.reminders.splice(i, 1);
        break;
      }
    }
    window.CCState.save();
    renderToday();
  }

  function toggleActive(id) {
    var st = window.CCState.state;
    for (var i = 0; i < st.reminders.length; i++) {
      if (st.reminders[i].id === id) {
        st.reminders[i].active = !st.reminders[i].active;
        break;
      }
    }
    window.CCState.save();
    renderToday();
  }

  function toggleComplete(id) {
    var st = window.CCState.state;
    var key = st.lastSeenDate;
    if (!st.completedByDate[key]) st.completedByDate[key] = {};
    // Guardar hora HH:MM al marcar; borrar al desmarcar
    if (st.completedByDate[key][id]) {
      st.completedByDate[key][id] = null;
      delete st.completedByDate[key][id];
    } else {
      var now = new Date();
      var timeStr = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
      st.completedByDate[key][id] = timeStr;
    }
    window.CCState.save();
    renderToday();
  }

  function isCompleted(id) {
    var st = window.CCState.state;
    var key = st.lastSeenDate;
    return !!(st.completedByDate[key] && st.completedByDate[key][id]);
  }

  function completedTime(id) {
    var st = window.CCState.state;
    var key = st.lastSeenDate;
    if (st.completedByDate[key] && st.completedByDate[key][id])
      return st.completedByDate[key][id];
    return null;
  }

  function statusFor(rem) {
    // 'future' | 'missed' | 'completed'
    if (isCompleted(rem.id)) return "completed";
    var now = new Date();
    var cur = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    if (rem.time > cur) return "future";
    return "missed";
  }

  function applicableToday(rem) {
    var dow = new Date().getDay();
    return rem.days && rem.days.indexOf(dow) >= 0 && rem.active !== false;
  }

  function renderToday() {
    var st = window.CCState.state;
    var ul = document.getElementById("reminders");
    if (!ul) return;
    ul.innerHTML = "";
    // Marcar vista de administración para estilos unificados
    if (ul.classList) {
      if (st.settings.kiosk) ul.classList.remove("admin-reminders");
      else ul.classList.add("admin-reminders");
    }

    // En kiosko: filtrar solo los de hoy y activos
    // En administración: mostrar todos
    var todayRems = [];
    if (st.settings.kiosk) {
      for (var i = 0; i < st.reminders.length; i++) {
        var r = st.reminders[i];
        if (applicableToday(r)) todayRems.push(r);
      }
    } else {
      // En administración mostrar todos los recordatorios
      for (var i = 0; i < st.reminders.length; i++) {
        var r = st.reminders[i];
        todayRems.push(r);
      }
    }
    todayRems.sort(function (a, b) {
      return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    });

    // En kiosko: ocultar tarjeta solo si hoy no hay ningún recordatorio
    var remCard = document.getElementById("remindersCard");
    if (remCard) {
      if (st.settings.kiosk && todayRems.length === 0)
        remCard.style.display = "none";
      else remCard.style.display = "";
    }

    // Separar pendientes (future/missed) y completados
    var pending = [],
      completed = [];
    for (var j = 0; j < todayRems.length; j++) {
      var rr = todayRems[j];
      if (isCompleted(rr.id)) completed.push(rr);
      else pending.push(rr);
    }
    // Nota: no ocultamos la tarjeta en kiosko aunque no haya pendientes

    var ul = document.getElementById("reminders");
    // ADMINISTRACIÓN: lista única sin encabezados ni iconos
    if (!st.settings.kiosk) {
      for (var a = 0; a < todayRems.length; a++) {
        var ra = todayRems[a];
        var lia = document.createElement("li");
        lia.className = "reminder admin";

        // Aplicar clase si está inactivo
        if (ra.active === false) {
          lia.classList.add("inactive");
        }

        // Checkbox de activo/inactivo
        var checkboxEl = document.createElement("input");
        checkboxEl.type = "checkbox";
        checkboxEl.checked = ra.active !== false;
        checkboxEl.className = "active-checkbox";
        checkboxEl.onclick = (function (id) {
          return function (e) {
            e.preventDefault();
            e.stopPropagation();
            e.stopImmediatePropagation();
            toggleActive(id);
            return false;
          };
        })(ra.id);
        lia.appendChild(checkboxEl);

        var ta = document.createElement("div");
        ta.className = "time";
        ta.textContent = ra.time;

        var la = document.createElement("div");
        la.className = "label";
        var cta = completedTime(ra.id);
        la.textContent = ra.label + (cta ? " — Hecho " + cta : "");

        var actionEla = document.createElement("div");
        actionEla.className = "days-badges";
        var allDaysA = ["L", "M", "X", "J", "V", "S", "D"];
        var dayIdxA = [1, 2, 3, 4, 5, 6, 0];
        for (var da = 0; da < dayIdxA.length; da++) {
          var ba = document.createElement("span");
          var activeA = ra.days && ra.days.indexOf(dayIdxA[da]) >= 0;
          ba.className = activeA ? "day-badge" : "day-badge muted";
          ba.textContent = allDaysA[da];
          actionEla.appendChild(ba);
        }

        lia.appendChild(ta);
        lia.appendChild(la);
        lia.appendChild(actionEla);

        // Borrado en administración (pero no en el checkbox)
        (function (id, el) {
          el.onclick = function (e) {
            // No borrar si se hizo click en el checkbox o sus elementos hijos
            if (
              e.target &&
              (e.target.type === "checkbox" ||
                e.target.closest(".active-checkbox"))
            ) {
              return;
            }
            if (confirm("¿Eliminar recordatorio?")) delReminder(id);
          };
        })(ra.id, lia);

        ul.appendChild(lia);
      }

      if (window.CCLayout && window.CCLayout.update) window.CCLayout.update();
      return;
    }

    // KIOSKO: encabezado PENDIENTES solo si hay pendientes
    if (pending.length) {
      var pendingHeader = document.createElement("li");
      pendingHeader.className = "section-header";
      pendingHeader.textContent = "Pendientes hoy";
      ul.appendChild(pendingHeader);
    }

    for (var k = 0; k < pending.length; k++) {
      var r = pending[k];
      var li = document.createElement("li");
      // En administración no aplicar clases de estado para evitar colores
      li.className = st.settings.kiosk
        ? "reminder " + statusFor(r)
        : "reminder admin";

      // Columna 1: icono (solo kiosko)
      var iconWrap;
      if (st.settings.kiosk) {
        iconWrap = document.createElement("div");
        iconWrap.className = "icon-wrap";
        var icon = document.createElement("div");
        icon.className = "icon";
        var svgKind = isCompleted(r.id)
          ? "check"
          : statusFor(r) === "future"
          ? "clock"
          : "alert";
        icon.appendChild(createIconSVG(svgKind));
        iconWrap.appendChild(icon);
      }

      // Columna 2: hora
      var t = document.createElement("div");
      t.className = "time";
      t.textContent = r.time;

      // Columna 3: texto
      var l = document.createElement("div");
      l.className = "label";
      l.textContent = r.label;

      // Columna 4: botón ✓ (kiosko) o badges de días (administración)
      var actionEl;
      if (st.settings.kiosk) {
        actionEl = document.createElement("div");
        actionEl.className = "action-wrap";
        var btn = document.createElement("button");
        btn.className = "done-btn";
        btn.title = "Marcar como hecho";
        btn.textContent = "";
        btn.onclick = (function (id) {
          return function (e) {
            if (e && e.stopPropagation) e.stopPropagation();
            toggleComplete(id);
          };
        })(r.id);
        actionEl.appendChild(btn);
      } else {
        actionEl = document.createElement("div");
        actionEl.className = "days-badges";
        var allDays = ["L", "M", "X", "J", "V", "S", "D"];
        var dayIdx = [1, 2, 3, 4, 5, 6, 0];
        for (var d = 0; d < dayIdx.length; d++) {
          var b = document.createElement("span");
          var active = r.days && r.days.indexOf(dayIdx[d]) >= 0;
          b.className = active ? "day-badge" : "day-badge muted";
          b.textContent = allDays[d];
          actionEl.appendChild(b);
        }
      }
      // Componer fila
      // En administración ocultamos icono y unificamos color más tarde con clase
      if (st.settings.kiosk && iconWrap) li.appendChild(iconWrap);
      li.appendChild(t);
      li.appendChild(l);
      li.appendChild(actionEl);

      // Borrado unificado: click con confirmación (deshabilitado en kiosko)
      if (!st.settings.kiosk) {
        (function (id, el) {
          el.onclick = function (e) {
            // No borrar si se hizo click en el botón de completar
            if (
              e.target &&
              (e.target.className === "done-btn" ||
                e.target.closest(".done-btn"))
            ) {
              return;
            }
            if (confirm("¿Eliminar recordatorio?")) delReminder(id);
          };
        })(r.id, li);
      }

      ul.appendChild(li);
    }

    // KIOSKO: sección HECHOS HOY
    if (completed.length) {
      var total = pending.length + completed.length;
      var doneCount = completed.length;
      var compHeader = document.createElement("li");
      compHeader.className = "section-header";
      compHeader.textContent = "Hechos hoy (" + doneCount + "/" + total + ")";
      ul.appendChild(compHeader);

      for (var c = 0; c < completed.length; c++) {
        var rc = completed[c];
        var li2 = document.createElement("li");
        li2.className = "reminder completed";

        var iconWrap2 = document.createElement("div");
        iconWrap2.className = "icon-wrap";
        var icon2 = document.createElement("div");
        icon2.className = "icon";
        icon2.appendChild(createIconSVG("check"));
        iconWrap2.appendChild(icon2);

        var t2 = document.createElement("div");
        t2.className = "time";
        t2.textContent = rc.time;

        var l2 = document.createElement("div");
        l2.className = "label";
        var ct = completedTime(rc.id);
        l2.textContent = rc.label + (ct ? " — Hecho " + ct : "");

        var actionEl2 = document.createElement("div");
        actionEl2.className = "action-wrap";
        var btn2 = document.createElement("button");
        btn2.className = "done-btn";
        btn2.title = "Marcar como hecho";
        btn2.textContent = "";
        btn2.onclick = (function (id) {
          return function (e) {
            if (e && e.stopPropagation) e.stopPropagation();
            toggleComplete(id);
          };
        })(rc.id);
        actionEl2.appendChild(btn2);

        li2.appendChild(iconWrap2);
        li2.appendChild(t2);
        li2.appendChild(l2);
        li2.appendChild(actionEl2);

        ul.appendChild(li2);
      }
    }

    if (window.CCLayout && window.CCLayout.update) window.CCLayout.update();
  }

  // Bucles: alertas y refresco de estado por minuto
  var lastMinute = -1;
  function checkAlerts() {
    var st = window.CCState.state;
    var now = new Date();
    // Cambio de día en caliente (sin recargar la app)
    var tk = todayKey();
    if (st.lastSeenDate !== tk) {
      st.completedByDate = {};
      st.lastSeenDate = tk;
      window.CCState.save();
      // Re-render para aplicar filtro de día en notas y recordatorios
      if (window.CCNotes && window.CCNotes.renderToday)
        window.CCNotes.renderToday();
      renderToday();
      if (window.CCLayout && window.CCLayout.update) window.CCLayout.update();
    }
    var cur = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    if (now.getMinutes() !== lastMinute) {
      lastMinute = now.getMinutes();
      for (var i = 0; i < st.reminders.length; i++) {
        var r = st.reminders[i];
        if (!applicableToday(r)) continue;
        if (r.time === cur && !isCompleted(r.id)) {
          // Mostrar alerta
          var alertEl = document.getElementById("alert");
          if (alertEl) {
            alertEl.textContent = "⏰ " + r.label + " (" + r.time + ")";
            alertEl.className = "alert show";
            setTimeout(function () {
              alertEl.className = "alert";
            }, 12000);
          }
          var ding = document.getElementById("ding");
          try {
            if (ding) {
              ding.currentTime = 0;
              ding.play();
            }
          } catch (e) {}
        }
      }
      renderToday(); // refrescar estados (future->missed)
    }
  }

  function start() {
    setInterval(checkAlerts, 1000);
  }

  window.CCReminders = {
    add: addReminder,
    del: delReminder,
    toggleActive: toggleActive,
    renderToday: renderToday,
    start: start,
    getSelectedDays: getSelectedDays,
  };
})();
