(function () {
  var DOW_ORDER = [1, 2, 3, 4, 5, 6, 0];
  var DOW_LETTER = { 0: "D", 1: "L", 2: "M", 3: "X", 4: "J", 5: "V", 6: "S" };
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function getSelectedDays() {
    var boxes = document.getElementsByName("remDay");
    var out = [];
    for (var i = 0; i < boxes.length; i++) {
      if (boxes[i].checked) {
        out.push(parseInt(boxes[i].value, 10));
      }
    }
    return out.length ? out : [0, 1, 2, 3, 4, 5, 6];
  }

  function addReminder(time, label, days) {
    if (!time || !label) return;
    var st = window.CCState.state;
    st.reminders.push({
      id: "r" + new Date().getTime(),
      time: time,
      label: label,
      enabled: true,
      days: days && days.length ? days : [0, 1, 2, 3, 4, 5, 6],
    });
    window.CCState.save();
    renderReminders();
  }

  function toggleReminder(id) {
    var st = window.CCState.state;
    for (var i = 0; i < st.reminders.length; i++) {
      if (st.reminders[i].id === id) {
        st.reminders[i].enabled = !st.reminders[i].enabled;
        break;
      }
    }
    window.CCState.save();
    renderReminders();
  }

  function delReminder(id) {
    var st = window.CCState.state;
    for (var i = 0; i < st.reminders.length; i++) {
      if (st.reminders[i].id === id) {
        st.reminders.splice(i, 1);
        break;
      }
    }
    window.CCState.save();
    renderReminders();
  }

  function formatDays(days) {
    if (!days || days.length === 7) return "Diario";
    var out = [];
    for (var i = 0; i < DOW_ORDER.length; i++) {
      var d = DOW_ORDER[i];
      if (days.indexOf(d) >= 0) {
        out.push(DOW_LETTER[d]);
      }
    }
    return out.join("-");
  }

  function renderReminders() {
    var st = window.CCState.state;
    var remList = document.getElementById("reminders");
    if (!remList) return;
    remList.innerHTML = "";
    for (var i = 0; i < st.reminders.length; i++) {
      var r = st.reminders[i];
      if (!r.days) r.days = [0, 1, 2, 3, 4, 5, 6];
      var li = document.createElement("li");
      li.className = "pill";

      var chk = document.createElement("input");
      chk.type = "checkbox";
      chk.checked = !!r.enabled;
      chk.onchange = (function (id) {
        return function () {
          toggleReminder(id);
        };
      })(r.id);

      var span = document.createElement("span");
      span.textContent = r.time + " · " + r.label + " · " + formatDays(r.days);

      var del = document.createElement("button");
      del.className = "del";
      del.textContent = "×";
      del.title = "Eliminar";
      del.onclick = (function (id) {
        return function () {
          delReminder(id);
        };
      })(r.id);

      li.appendChild(chk);
      li.appendChild(span);
      li.appendChild(del);
      remList.appendChild(li);
    }
  }

  var lastMinute = -1;
  function checkReminders() {
    var st = window.CCState.state;
    var now = new Date();
    var cur = pad2(now.getHours()) + ":" + pad2(now.getMinutes());
    var dow = now.getDay();
    if (now.getMinutes() !== lastMinute) {
      lastMinute = now.getMinutes();
      for (var i = 0; i < st.reminders.length; i++) {
        var r = st.reminders[i];
        var days = r.days || [0, 1, 2, 3, 4, 5, 6];
        if (r.enabled && r.time === cur && days.indexOf(dow) >= 0) {
          triggerAlert(r.label);
        }
      }
    }
  }

  function triggerAlert(text) {
    var alertEl = document.getElementById("alert");
    var ding = document.getElementById("ding");
    if (alertEl) {
      alertEl.textContent = "⏰ " + text;
      alertEl.className = "alert show";
      setTimeout(function () {
        alertEl.className = "alert";
      }, 12000);
    }
    try {
      if (ding) {
        ding.currentTime = 0;
        ding.play();
      }
    } catch (e) {}
  }

  function startReminderLoop() {
    setInterval(checkReminders, 1000);
  }

  // Exponer API global
  window.CCReminders = {
    add: addReminder,
    del: delReminder,
    toggle: toggleReminder,
    render: renderReminders,
    getSelectedDays: getSelectedDays,
    start: startReminderLoop,
  };
})();
