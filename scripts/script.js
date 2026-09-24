// initial data store (central place to hold data).
const dataStore = {
    "rawText": "",
};

// grab the html element(s).
const noteEditorEl = document.querySelector(".note-editor");
const noteEditorOutputEl = document.querySelector(".note-editor-output");
// check log.
// console.log(noteEditorEl);

// () -> toggle classes for elements.
function toggleElementClasses(data){
    // when no data is available or passed?
    if(! data || data.length == 0) return null;

    // initial structure of coming data.
    /* 
    [
     {element, class, to},
     {element, class, to}
    ]
    */
    // i.e., element - name of element to work on
    // class - name of class already existing in internal or external css file.
    // to - A flag representating -> what action i.e., add or remove.

    // iterate over the data array of object.
    for(let i = 0; i < data.length; i ++) {

        // if the current element is asked to add?
        if(data[i]["to"] === "add") {

            // add the classlist to element.
            data[i]["element"].classList.add(data[i]["class"]);
        }

        // if the current element is asked to remove?
        if(data[i]["to"] === "remove") {

            // remove  the classlist to element.
            data[i]["element"].classList.remove(data[i]["class"]);
        }
    }

    // return null.
    return null;
};

// () -> attach event to an element!
function attachElementEvent(element, event, callback) {
    // just attach the simple event needed!
    element[event] = callback;
};

// () -> to toggle output.
function toggleOutput() {
    // check log.
    // console.log("Toggle Output!");

    // save and store the existing input element value to data store's rawText.
    dataStore["rawText"] = noteEditorEl.value.trim();

    // grab the intended original raw-text from data source & update the html of output element with it..
    noteEditorOutputEl.innerHTML = dataStore["rawText"];

    // switch the display of noteEditor Input element off, & display of noteEditor Output element on.
    toggleElementClasses([
        {"element": noteEditorEl, "class": "hidden", "to": "add"},
        {"element": noteEditorOutputEl, "class": "hidden", "to": "remove"},
    ]);

    // attach event to note editor Output element with app. handler.
    attachElementEvent(noteEditorOutputEl, "onclick", toggleInput);
};

// () -> to toggle input.
function toggleInput() {
    // check log.
    // console.log("Toggle Input!");

    // from og data store - raw-text, update node editor Input element's value.
    noteEditorEl.value = dataStore["rawText"];

    // switch the display of noteEditor Input element on, & display of noteEditor Output element off.
    toggleElementClasses([
        {"element": noteEditorEl, "class": "hidden", "to": "remove"},
        {"element": noteEditorOutputEl, "class": "hidden", "to": "add"},
    ]);

    // focus the input.
    noteEditorEl.focus();
};


// attach event to note editor input element.
attachElementEvent(noteEditorEl, "onblur", toggleOutput);