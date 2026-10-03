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
function toggleOutput() {
    // check log.
    // console.log("Toggle Output!");

    // save and store the existing input element value to data store's rawText.
    dataStore["rawText"] = noteEditorEl.value.trim();

    // transform the text and get structured array.
    const notesArr = transformRawText(dataStore["rawText"], getIdentifiedBlockBoundaries, getNewLineStr, updateAndGetBoundaryData, getStructuredNoteArray);
    // check log.
    console.log(notesArr);

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

        // when current ith value is opening html block!
        if(initialSplittedArray[i] === "<html>") {
            // set the block type as html.
            detailsObj["blockType"] = "html";

            // set the starting position (index).
            detailsObj["startPos"] = i;
        }

        // when current ith value is closing html block!
        if(initialSplittedArray[i] === "</html>") {
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

// () -> transform the raw text.
function transformRawText(rawTextInput, identifierCallback, getNewLineStrCallback, boundaryDataUpdaterCallback, getStructuredArrCallback) {
  // when inputs are not provided properly?
  if (!rawTextInput || !identifierCallback) {
    return null;
  }
  // when type of inputs are invalid?
  else if (typeof (rawTextInput) !== "string" && typeof (identifierCallback) !== "function") {
    return null;
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

  // get initial notes structured array.
  const notesStructureArr = getStructuredArrCallback(updatedBoundaries, initialRawTextArr);
  return notesStructureArr;
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

// () -> get updated boundary data with merged code strings.
function updateAndGetBoundaryData(boundaryData = [], rawTextArr = []) {

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

// () -> get final structured Array of notes.
function getStructuredNoteArray(updatedBoundaryData, array) {
    // initial updated raw text array.
    const updatedRawTextArray = [];

    // initial starting index for boundary data.
    let boundaryIndex = 0;

    // initial starting index for array.
    let startingArrayIndex = 0;

    // until boundary data's end is reached!
    while(boundaryIndex < updatedBoundaryData.length) {

        // check log.
        // console.log(updatedBoundaryData[boundaryIndex]);
        // console.log(array.slice(startingArrayIndex, updatedBoundaryData[boundaryIndex]["startPos"]).join(" "));
        // console.log(startingArrayIndex, updatedBoundaryData[boundaryIndex]["startPos"]);

        // prepare the normal raw string.
        let rawString = array.slice(startingArrayIndex, updatedBoundaryData[boundaryIndex]["startPos"]).join(" ");

        // push the raw string and then code block string into array.
        updatedRawTextArray.push(rawString, updatedBoundaryData[boundaryIndex]["codeBlockString"]);

        // instantly, update the starting array index as of end position + 1 of boundary data.
        startingArrayIndex = updatedBoundaryData[boundaryIndex]["endPos"]+1;

        // update and increment the boundary index.
        boundaryIndex++;
    };

    // check log**
    console.log(updatedRawTextArray);
};

// () -> build the view.
function buildNoteView(notesStructure = [], existingEl) {
  // when incoming array is empty?
  if (notesStructure.length == 0) return [];

  // iterate over the notes array structure.
  for(let i = 0; i < notesStructure.length; i ++) {

      // when current element is code block.
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