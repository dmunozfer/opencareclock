(function () {
  function addNote(text) {
    if (!text) return;
    var st = window.CCState.state;
    st.notes.push({ id: "n" + new Date().getTime(), text: text });
    window.CCState.save();
    renderNotes();
  }

  function delNote(id) {
    var st = window.CCState.state;
    for (var i = 0; i < st.notes.length; i++) {
      if (st.notes[i].id === id) {
        st.notes.splice(i, 1);
        break;
      }
    }
    window.CCState.save();
    renderNotes();
  }

  function renderNotes() {
    var st = window.CCState.state;
    var notesEl = document.getElementById("notes");
    if (!notesEl) return;
    notesEl.innerHTML = "";
    for (var i = 0; i < st.notes.length; i++) {
      var n = st.notes[i];
      var li = document.createElement("li");
      li.className = "pill";
      var span = document.createElement("span");
      span.textContent = n.text;
      var b = document.createElement("button");
      b.className = "del";
      b.title = "Eliminar";
      b.textContent = "×";
      b.onclick = (function (id) {
        return function () {
          delNote(id);
        };
      })(n.id);
      li.appendChild(span);
      li.appendChild(b);
      notesEl.appendChild(li);
    }
  }

  window.CCNotes = { add: addNote, del: delNote, render: renderNotes };
})();
