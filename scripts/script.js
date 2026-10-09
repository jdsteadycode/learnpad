// initial data store (central place to hold data).
const dataStore = {
    "rawText": "",
    "generatedNotesArr": [],
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
/*
* Transition from input mode -> output mode.
i/p: textarea view
o/p: article reading view
*/
function toggleOutput() {
    // check log.
    // console.log("Toggle Output!");

    // save and store the existing input element value to data store's rawText.
    dataStore["rawText"] = noteEditorEl.value.trim();

    // get the outcome after parsing of raw text to various steps.
    const result = parseRawText(dataStore["rawText"], getIdentifiedBlockBoundaries, getNewLineStr, generateUpdatedBoundaries, generateStructuredArray);

    // when error
    if(result["error"]){
        // simply show the error in console.
        console.error(result["error"]);
    }
    // otherwise proceed with parsed structure array!
    else {
        // save to dataStore as single source of truth.
        dataStore.generatedNotesArr = result["data"] ?? [];
    }


    // check log.
    console.log(dataStore.generatedNotesArr);

    // grab the intended original raw-text from data source & update the existing output element to build the view.
    buildNoteView(dataStore.generatedNotesArr, noteEditorOutputEl);

    // switch the display of noteEditor Input element off, & display of noteEditor Output element on.
    toggleElementClasses([
        {"element": noteEditorEl, "class": "hidden", "to": "add"},
        {"element": noteEditorOutputEl, "class": "hidden", "to": "remove"},
    ]);

    // attach event to note editor Output element with app. handler.
    attachElementEvent(noteEditorOutputEl, "onclick", toggleInput);
};

// () -> to toggle input.
/*
* Transition from output mode -> input mode.
i/p: textarea view
o/p: article reading view
*/
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

// () -> identify and get code block boundary details.
/*
* o/p: [{blockType, startPos, endPos }, {..}]
*/
function getIdentifiedBlockBoundaries(initialSplittedArray = []) {
    // when incoming data is empty?
    if(initialSplittedArray.length == 0) return [];

    // initial boundary array.
    const boundaryArray = [];

    // initial actual detail obj.
    let detailsObj = {};

    // iterate over the array.
    for(let i = 0; i < initialSplittedArray.length; i ++) {

        // when current ith value is opening html tag?
        if(initialSplittedArray[i] === "<html>") {
            // set the block type as html.
            detailsObj["blockType"] = "html";

            // set the starting position (index).
            detailsObj["startPos"] = i;
        }

        // when current ith value is closing html tag?
        if(initialSplittedArray[i] === "</html>") {
            // set the ending position (index).
            detailsObj["endPos"] = i;
        }

        // when current ith value is opening script or js tag?
        if(initialSplittedArray[i] === "<script>" || initialSplittedArray[i] === "\x3Cscript>") {
            // set the block type as js.
            detailsObj["blockType"] = "js";

            // set the starting position (index).
            detailsObj["startPos"] = i;
        }

        // when current ith value is closing js tag?
        if(initialSplittedArray[i] === ("<" + "/" + "script>") || initialSplittedArray[i] === "\x3C/script>") {
            // set the ending position (index).
            detailsObj["endPos"] = i;
        }

        // check if current obj is constructed fully for current block?
        if("blockType" in detailsObj && "startPos" in detailsObj && "endPos" in detailsObj) {

            // push current details obj in boundary array.
            boundaryArray.push(detailsObj);

            // empty the current details obj data instantly!
            detailsObj = {};
        }
    };

    // get the final boundary arr.
    return boundaryArray;
}

// () -> parse the raw notes text and do processing and structure it and get it in final result
/*
* o/p: either {"error": "message"} or {"data": [..]}
*/
function parseRawText(rawTextInput, identifierCallback, getNewLineStrCallback, boundaryDataUpdaterCallback, getStructuredArrCallback) {
  // when inputs are not provided properly?
  if (! rawTextInput || ! identifierCallback || ! getNewLineStrCallback || ! boundaryDataUpdaterCallback || ! getStructuredArrCallback) {
    return {"error": "Inputs are not provided properly or missing!"};
  }
  // when type of inputs are invalid?
  else if (typeof (rawTextInput) !== "string" || typeof (identifierCallback) !== "function" || typeof (getNewLineStrCallback) !== "function" || typeof(boundaryDataUpdaterCallback) !== "function" || typeof(getStructuredArrCallback) !== "function") {
    return {"error": "One or more inputs provided have invalid input type!"};
  }

  // otherwise, proceed further..

  // split the rawTextInput via `\n` chars.
  const rawTextArr = rawTextInput.split("\n");

  // get the block boundaries.
  const boundaries = identifierCallback(rawTextArr);
  // console.log(boundaries);

  // generate the initial raw string array with intended new line character.
  const initialRawTextArr = rawTextArr.map(getNewLineStrCallback);
  // ignore this**
  // console.log(rawTextArr.length, rawTextArr[13], rawTextArr[12]);
  // console.log(initialRawTextArr);

  // get updated boundaries.
  const updatedBoundaries = boundaryDataUpdaterCallback(boundaries, initialRawTextArr);
  // console.log(updatedBoundaries);

  // get initial notes structured array and return in proper format. i.e., {"data": []} etc.
  const structuredNotesArr = getStructuredArrCallback(updatedBoundaries, initialRawTextArr);
  return {"data": structuredNotesArr};
}

// () -> get new line added string.
function getNewLineStr(value, index, array) {
  // check log**
  // console.log(value, index, array);

  // when current value is last one in array?
  if (index === (array.length - 1)) {
    return value;
  }
  // otherwise, add new-line char to each value and return it!
  else {
    return value + "\n";
  }
};

// () -> generate fresh updated boundaries data with merged code strings.
function generateUpdatedBoundaries(boundaryData = [], rawTextArr = []) {

    // when incoming array are empty?
    if (boundaryData.length == 0 || rawTextArr.length == 0) return [];

    // initial data.
    let data = [];

    // iterate over the boundary data array
    for(let i = 0; i < boundaryData.length; i ++) {

        // initial obj
        let obj = boundaryData[i];

        // get the code block.
        let codeBlockString = rawTextArr.slice(obj["startPos"], (obj["endPos"]+1)).join("");

        // generate the code block from start -> end including it and push into data array as new obj with existing intel + new codeblock
        data.push({
         ...obj,
            "codeBlockString": codeBlockString,
        });
    }

    // get the final data.
    return data;
};

// () -> generate final structured Array of notes.
function generateStructuredArray(boundaries = [], initialArr = []) {
    // initial structured arr.
    let structuredArr = [];
    
    // initial index for boundaries array.
    let boundaryIndex = 0;

    // initial index for initial array.
    let arrayIndex = 0;


    // until index is reaches initial array's length.
    while(arrayIndex < initialArr.length) {

        // check log.
        //console.log(initialArr[arrayIndex]);
        //console.log(boundaries[boundaryIndex]["startPos"], boundaries[boundaryIndex]["codeBlockString"]);

        // when boundaryIndex ain't reached end of boundaries array.
        if(boundaryIndex < boundaries.length) {

            // when current arrayindex matches the current boundary data's starting index.
            if(arrayIndex === boundaries[boundaryIndex]["startPos"]) {

                // check log.
                // console.log(initialArr[arrayIndex]);
                // console.log(boundaries[boundaryIndex]["codeBlockString"]);

                // push the current code block string into structured array.
                structuredArr.push(boundaries[boundaryIndex]["codeBlockString"]);

                // update the current array index as of the endPos + 1.
                arrayIndex = boundaries[boundaryIndex]["endPos"]+1;
    
                // then, hence update the boundary index.
                boundaryIndex++;

                // check log the updated indexes
                // console.log(arrayIndex);
                // console.log(boundaryIndex);

                // continue.
                continue;
            }
        }

        // check log the initial array element.
        // console.log(initialArr[arrayIndex]);

        // push current array's normal element into structured array.
        structuredArr.push(initialArr[arrayIndex]);

        // update and increment the arrayIndex
        arrayIndex++;
    }

    // check log**
    // console.log(structuredArr);

    // get this final structured array.
    return structuredArr;
}

// () -> build the clear reading view for notes written.
/*
* i.e., either null or build the UI systematically from proper notes structure for existing element.
*/
function buildNoteView(notesStructure = [], existingEl = null) {
  // when incoming array is un-available or empty!
  if (! notesStructure || notesStructure.length == 0 || ! existingEl) {
    return null;
  }

  // empty the existing element content.
  // console.log(existingEl.innerHTML);
  existingEl.innerHTML = "";

  // iterate over the notes array structure.
  for(let i = 0; i < notesStructure.length; i ++) {

      // when current element is an html code block.
      if(notesStructure[i].startsWith("<html>") && (notesStructure[i].endsWith("</html>\n") || notesStructure[i].endsWith("</html>"))) {
          // console.log("code block", notesStructure[i]);

          // build one pre element for code block.
          let preEl = document.createElement("pre");

          // add class attribute.
          preEl.setAttribute("class", "html-code-block");

          // add the current html code string as inner text of it.
          preEl.innerText = notesStructure[i];

          // finally, append this pre element into existing element.
          existingEl.insertAdjacentElement("beforeend", preEl);
      }

       // when current element is js code block
       else if((notesStructure[i].startsWith("<script>") || notesStructure[i].startsWith("\x3Cscript>")) && (notesStructure[i].endsWith(("<" + "/" + "script>\n")) || notesStructure[i].endsWith(("<" + "/" + "script>")) || notesStructure[i].endsWith("\x3C/script>") || notesStructure[i].endsWith("\x3C/script>\n"))) {
          // console.log("code block", notesStructure[i]);

          // build one pre element for code block.
          let preEl = document.createElement("pre");

          // add class attribute.
          preEl.setAttribute("class", "js-code-block");

          // add the current js code string as inner text of it.
          preEl.innerText = notesStructure[i];

          // finally, append this pre element into existing element.
          existingEl.insertAdjacentElement("beforeend", preEl);
      }
      // otherwise a normal raw note string.
      else {
          // console.log("a normal raw note string", notesStructure[i]);
          // add the current raw text string as text to existing element.
          existingEl.insertAdjacentText("beforeend", notesStructure[i]);
      }
  }
};

// attach event to note editor input element.
attachElementEvent(noteEditorEl, "onblur", toggleOutput);