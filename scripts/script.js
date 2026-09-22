// grab the html element(s).
const noteEditorEl = document.querySelector(".note-editor");
// check log.
// console.log(noteEditorEl);

// () -> attach event to an element!
function attachElementEvent(element, event, callback) {
    // just attach the simple event needed!
    element[event] = callback;
};



