(function () {
  var KEY = "occ_state_v1";

  var api = {
    state: {
      settings: {
        theme: "dark",
        showSeconds: true,
        hourFormat: 24,
        kiosk: false,
        kioskPinEnabled: false,
        kioskPin: "", // opcional, 4 dígitos
        accessibility: "normal", // normal, high, extreme
      },
      notes: [
        // { id:'n1', text:'Beber agua', days:[1,2,3,4,5,6,0], active:true }
      ],
      reminders: [
        // { id:'r1', label:'Pastillas comida', time:'14:00', days:[1,2,3,4,5,6,0], active:true }
      ],
      // completados por fecha: { 'YYYY-MM-DD': { reminderId: true } }
      completedByDate: {},
      // para limpiar al cambiar de día
      lastSeenDate: "",
    },
    load: load,
    save: save,
  };

  window.CCState = api;

  function todayKey() {
    var d = new Date();
    return (
      d.getFullYear() + "-" + pad2(d.getMonth() + 1) + "-" + pad2(d.getDate())
    );
  }
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function load() {
    var hadRaw = false;
    try {
      var raw = localStorage.getItem(KEY);
      hadRaw = !!raw;
      if (raw) {
        var obj = JSON.parse(raw);
        if (obj && obj.settings) api.state.settings = obj.settings;
        if (obj && obj.notes) api.state.notes = obj.notes;
        if (obj && obj.reminders) api.state.reminders = obj.reminders;
        if (obj && obj.completedByDate)
          api.state.completedByDate = obj.completedByDate;
        if (obj && obj.lastSeenDate) api.state.lastSeenDate = obj.lastSeenDate;
      }
    } catch (e) {}
    // reset diario si cambia la fecha
    var tk = todayKey();
    if (api.state.lastSeenDate !== tk) {
      api.state.completedByDate = {}; // limpiar completados de días anteriores
      api.state.lastSeenDate = tk;
      save();
    }

    // Primera ejecución: asegurar modo configuración (no kiosko)
    if (!hadRaw) {
      api.state.settings.kiosk = false;
      save();
    }
  }

  function save() {
    try {
      localStorage.setItem(KEY, JSON.stringify(api.state));
    } catch (e) {}
  }
})();
