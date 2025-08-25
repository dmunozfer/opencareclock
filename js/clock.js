(function () {
  var WEEKDAYS = [
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado",
  ];
  var MONTHS = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
  ];
  function pad2(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function dayPart(h) {
    if (h < 6) return "MADRUGADA";
    if (h < 12) return "MAÑANA";
    if (h < 14) return "MEDIODÍA";
    if (h < 20) return "TARDE";
    return "NOCHE";
  }

  function render() {
    var s = window.CCState.state.settings;
    var now = new Date();
    var h = now.getHours(),
      m = now.getMinutes(),
      sc = now.getSeconds();
    var displayH = h,
      ampm = "";
    if (s.hourFormat === 12) {
      ampm = h >= 12 ? " pm" : " am";
      displayH = h % 12;
      if (displayH === 0) displayH = 12;
    }
    var timeTxt =
      pad2(displayH) +
      ":" +
      pad2(m) +
      (s.showSeconds ? ":" + pad2(sc) : "") +
      ampm;

    var timeEl = document.getElementById("time");
    var daypartEl = document.getElementById("daypart");
    var dateEl = document.getElementById("date");
    if (timeEl) timeEl.textContent = timeTxt;
    if (daypartEl) daypartEl.textContent = dayPart(h);
    if (dateEl) {
      var wd = WEEKDAYS[now.getDay()],
        d = now.getDate(),
        mo = MONTHS[now.getMonth()],
        y = now.getFullYear();
      dateEl.textContent = wd + ", " + d + " de " + mo + " de " + y;
    }
  }

  function start() {
    render();
    setInterval(render, 1000);
  }

  window.CCClock = { start: start };
})();
