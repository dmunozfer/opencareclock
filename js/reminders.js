(function () {
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
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

  function toggleComplete(id) {
    var st = window.CCState.state;
    var key = st.lastSeenDate;
    if (!st.completedByDate[key]) st.completedByDate[key] = {};
    st.completedByDate[key][id] = !st.completedByDate[key][id];
    window.CCState.save();
    renderToday();
  }

  function isCompleted(id) {
    var st = window.CCState.state;
    var key = st.lastSeenDate;
    return !!(st.completedByDate[key] && st.completedByDate[key][id]);
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
    return rem.days && rem.days.indexOf(dow) >= 0;
  }

  function renderToday() {
    var st = window.CCState.state;
    var ul = document.getElementById("reminders");
    if (!ul) return;
    ul.innerHTML = "";

    // Filtrar solo los de hoy y ordenar por hora
    var todayRems = [];
    for (var i = 0; i < st.reminders.length; i++) {
      var r = st.reminders[i];
      if (applicableToday(r)) todayRems.push(r);
    }
    todayRems.sort(function (a, b) {
      return a.time < b.time ? -1 : a.time > b.time ? 1 : 0;
    });

    // Mostrar primero pendientes (future/missed), los completados al final
    var pending = [],
      completed = [];
    for (var j = 0; j < todayRems.length; j++) {
      var rr = todayRems[j];
      if (isCompleted(rr.id)) completed.push(rr);
      else pending.push(rr);
    }
    var finalList = pending.concat(completed);

    for (var k = 0; k < finalList.length; k++) {
      var r = finalList[k];
      var li = document.createElement("li");
      li.className = "reminder " + statusFor(r);

      // Columna 1: icono
      var iconWrap = document.createElement("div");
      iconWrap.className = "icon-wrap";
      var icon = document.createElement("div");
      icon.className = "icon";
      icon.textContent = isCompleted(r.id)
        ? "✓"
        : statusFor(r) === "future"
        ? "⏰"
        : "!";
      iconWrap.appendChild(icon);

      // Columna 2: hora
      var t = document.createElement("div");
      t.className = "time";
      t.textContent = r.time;

      // Columna 3: texto
      var l = document.createElement("div");
      l.className = "label";
      l.textContent = r.label;

      // Columna 4: botón ✓
      var btn = document.createElement("button");
      btn.className = "done-btn";
      btn.title = "Marcar como hecho";
      btn.textContent = isCompleted(r.id) ? "✓" : "✓";
      btn.onclick = (function (id) {
        return function () {
          toggleComplete(id);
        };
      })(r.id);

      // Componer fila
      li.appendChild(iconWrap);
      li.appendChild(t);
      li.appendChild(l);
      li.appendChild(btn);

      // Click largo para eliminar: deshabilitar en kiosko
      if (!st.settings.kiosk) {
        (function (id, el) {
          var timer;
          el.onmousedown = function () {
            timer = setTimeout(function () {
              if (confirm("¿Eliminar recordatorio?")) delReminder(id);
            }, 1200);
          };
          el.onmouseup = el.onmouseleave = function () {
            clearTimeout(timer);
          };
          el.ontouchstart = function () {
            timer = setTimeout(function () {
              if (confirm("¿Eliminar recordatorio?")) delReminder(id);
            }, 1200);
          };
          el.ontouchend = el.ontouchcancel = function () {
            clearTimeout(timer);
          };
        })(r.id, li);
      }

      ul.appendChild(li);
    }

    if (window.CCLayout && window.CCLayout.update) window.CCLayout.update();
  }

  // Bucles: alertas y refresco de estado por minuto
  var lastMinute = -1;
  function checkAlerts() {
    var st = window.CCState.state;
    var now = new Date();
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
    renderToday: renderToday,
    start: start,
    getSelectedDays: getSelectedDays,
  };
})();
