(function () {
  var KEY = "cc_state_v2";
  var api = {
    state: {
      settings: {
        theme: "dark",
        scale: 140,
        showSeconds: true,
        hourFormat: 24,
        kiosk: false,
      },
      notes: [],
      reminders: [],
    },
    load: load,
    save: save,
  };
  window.CCState = api;

  function migrateFromV1() {
    try {
      var raw = localStorage.getItem("cc_state_v1");
      if (!raw) return;
      var obj = JSON.parse(raw);
      if (obj) {
        if (obj.settings) api.state.settings = obj.settings;
        if (obj.notes) api.state.notes = obj.notes;
        if (obj.reminders) {
          for (var i = 0; i < obj.reminders.length; i++) {
            var r = obj.reminders[i];
            if (!r.days) r.days = [0, 1, 2, 3, 4, 5, 6];
            api.state.reminders.push(r);
          }
        }
        save();
      }
    } catch (e) {}
  }

  function load() {
    try {
      var raw = localStorage.getItem(KEY);
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.settings) api.state.settings = obj.settings;
        if (obj && obj.notes) api.state.notes = obj.notes;
        if (obj && obj.reminders) api.state.reminders = obj.reminders;
      } else {
        migrateFromV1();
      }
    } catch (e) {}
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(api.state));
    } catch (e) {}
  }
})();
