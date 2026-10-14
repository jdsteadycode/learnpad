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
function toggleElementClasses(data) {
    // when no data is available or passed?
    if (!data || data.length == 0) return null;

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
    for (let i = 0; i < data.length; i++) {

        // if the current element is asked to add?
        if (data[i]["to"] === "add") {

            // add the classlist to element.
            data[i]["element"].classList.add(data[i]["class"]);
        }

        // if the current element is asked to remove?
        if (data[i]["to"] === "remove") {

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
    if (result["error"]) {
        // simply show the error in console.
        console.error(result["error"]);

        // simply add the normal whitespace as in array as fallback
        dataStore.generatedNotesArr = [" "];
    }
    // otherwise proceed with parsed structure array!
    else {
        // save to dataStore as single source of truth.
        dataStore.generatedNotesArr = result["data"] ?? [];
    }


    // check log.
    // console.log(dataStore.generatedNotesArr);

    // grab the intended original raw-text from data source & update the existing output element to build the view.
    buildNoteView(dataStore.generatedNotesArr, noteEditorOutputEl);

    // switch the display of noteEditor Input element off, & display of noteEditor Output element on.
    toggleElementClasses([
        { "element": noteEditorEl, "class": "hidden", "to": "add" },
        { "element": noteEditorOutputEl, "class": "hidden", "to": "remove" },
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
        { "element": noteEditorEl, "class": "hidden", "to": "remove" },
        { "element": noteEditorOutputEl, "class": "hidden", "to": "add" },
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
    if (initialSplittedArray.length == 0) return [];

    // initial boundary array.
    const boundaryArray = [];

    // initial actual detail obj.
    let detailsObj = {};

    // iterate over the array.
    for (let i = 0; i < initialSplittedArray.length; i++) {

        // when current ith value is opening html tag?
        if (initialSplittedArray[i] === "<html>") {
            // set the block type as html.
            detailsObj["blockType"] = "html";

            // set the starting position (index).
            detailsObj["startPos"] = i;
        }

        // when current ith value is closing html tag?
        if (initialSplittedArray[i] === "</html>") {
            // set the ending position (index).
            detailsObj["endPos"] = i;
        }

        // when current ith value is opening script or js tag?
        if (initialSplittedArray[i] === "<script>" || initialSplittedArray[i] === "\x3Cscript>") {
            // set the block type as js.
            detailsObj["blockType"] = "js";

            // set the starting position (index).
            detailsObj["startPos"] = i;
        }

        // when current ith value is closing js tag?
        if (initialSplittedArray[i] === ("<" + "/" + "script>") || initialSplittedArray[i] === "\x3C/script>") {
            // set the ending position (index).
            detailsObj["endPos"] = i;
        }

        // when current ith value is opening output tag?
        if (initialSplittedArray[i] === "<output>") {
            // set the block type as output.
            detailsObj["blockType"] = "output";

            // set the starting position (index).
            detailsObj["startPos"] = i;
        }

        // when current ith value is closing output tag?
        if (initialSplittedArray[i] === "</output>") {

            // set the starting position (index).
            detailsObj["endPos"] = i;
        }

        // check if current obj is constructed fully for current block?
        if ("blockType" in detailsObj && "startPos" in detailsObj && "endPos" in detailsObj) {

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
    if (!rawTextInput || !identifierCallback || !getNewLineStrCallback || !boundaryDataUpdaterCallback || !getStructuredArrCallback) {
        return { "error": "Inputs are not provided properly or missing!" };
    }
    // when type of inputs are invalid?
    else if (typeof (rawTextInput) !== "string" || typeof (identifierCallback) !== "function" || typeof (getNewLineStrCallback) !== "function" || typeof (boundaryDataUpdaterCallback) !== "function" || typeof (getStructuredArrCallback) !== "function") {
        return { "error": "One or more inputs provided have invalid input type!" };
    }

    // otherwise, proceed further..

    // split the rawTextInput via `\n` chars.
    const rawTextArr = rawTextInput.split("\n");
    // check log**
    // console.log(rawTextArr);

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
    return { "data": structuredNotesArr };
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
    for (let i = 0; i < boundaryData.length; i++) {

        // initial obj
        let obj = boundaryData[i];

        // get the code block.
        let codeBlockString = rawTextArr.slice(obj["startPos"], (obj["endPos"] + 1)).join("");

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
    while (arrayIndex < initialArr.length) {

        // check log.
        //console.log(initialArr[arrayIndex]);
        //console.log(boundaries[boundaryIndex]["startPos"], boundaries[boundaryIndex]["codeBlockString"]);

        // when boundaryIndex ain't reached end of boundaries array.
        if (boundaryIndex < boundaries.length) {

            // when current arrayindex matches the current boundary data's starting index.
            if (arrayIndex === boundaries[boundaryIndex]["startPos"]) {

                // check log.
                // console.log(initialArr[arrayIndex]);
                // console.log(boundaries[boundaryIndex]["codeBlockString"]);

                // push the current code block string into structured array.
                structuredArr.push(boundaries[boundaryIndex]["codeBlockString"]);

                // update the current array index as of the endPos + 1.
                arrayIndex = boundaries[boundaryIndex]["endPos"] + 1;

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
    if (!notesStructure || notesStructure.length == 0 || !existingEl) {
        return null;
    }

    // empty the existing element content.
    // console.log(existingEl.innerHTML);
    existingEl.innerHTML = "";

    // iterate over the notes array structure.
    for (let i = 0; i < notesStructure.length; i++) {

        // when current element is an html code block.
        if (isCodeBlock(notesStructure[i], "html")) {
            // console.log("code block", notesStructure[i]);

            // A parent section code block container element.
            let codeBlockContainerEl = generateElementWithAttributes("section", [
                { "attribute": "class", "value": "code-block-container", "type": "css-class" },
                { "attribute": "class", "value": "html-code-block", "type": "css-class" },
            ]);
            // check log.
            console.log(codeBlockContainerEl);

            // A header section element for parent code block container.
            let codeBlockHeaderEl = generateElementWithAttributes("section", [
                { "attribute": "class", "value": "code-block-header", "type": "css-class" },
            ]);

            // A span element as child element of Header El denoting code block as emoji.
            let spanWithEmojiEl = generateElementWithAttributes("span", [
                { "attribute": "class", "value": "code-block-emoji", "type": "css-class" },
                { "attribute": "innerHTML", "value": "🌐", "type": "property" },
            ]);

            // A span element as child element of Header El denoting code block as text.
            let spanWithTextEl = generateElementWithAttributes("span", [
                { "attribute": "class", "value": "code-block-type", "type": "css-class" },
                { "attribute": "innerHTML", "value": "html", "type": "property" },
            ]);

            // A pre element for parent code block container containing actual code block content.
            let preEl = generateElementWithAttributes("pre", [
                { "attribute": "class", "value": "code-block-content", "type": "css-class" }, { "attribute": "innerText", "value": notesStructure[i], "type": "property" },
            ]);

            // build the container element accordingly.
            /* 
            <div class="code-block-container html-code-block">
                <div class="code-block-header">
                    <span class="code-block-emoji">Emoji Symbol</span>
                    <span class="code-block-type">Text</span>
                </div>
                <pre class="code-block-content">Code Block Content</pre>
            </div>
            *
            **/

            // append the span elements as child of the header element
            codeBlockHeaderEl.appendChild(spanWithEmojiEl);
            codeBlockHeaderEl.appendChild(spanWithTextEl);

            // then, lastly append the header and pre element one after another in container.
            codeBlockContainerEl.appendChild(codeBlockHeaderEl);
            codeBlockContainerEl.appendChild(preEl);

            // finally, append this container element into existing element.
            existingEl.insertAdjacentElement("beforeend", codeBlockContainerEl);
        }

        // when current element is js code block
        else if (isCodeBlock(notesStructure[i], "js")) {
            // console.log("code block", notesStructure[i]);

            // A parent section code block container element.
            let codeBlockContainerEl = generateElementWithAttributes("section", [
                { "attribute": "class", "value": "code-block-container", "type": "css-class" },
                { "attribute": "class", "value": "js-code-block", "type": "css-class" },
            ]);
            // check log.
            console.log(codeBlockContainerEl);

            // A header section element for parent code block container.
            let codeBlockHeaderEl = generateElementWithAttributes("section", [
                { "attribute": "class", "value": "code-block-header", "type": "css-class" },
            ]);

            // A span element as child element of Header El denoting code block as emoji.
            let spanWithEmojiEl = generateElementWithAttributes("span", [
                { "attribute": "class", "value": "code-block-emoji", "type": "css-class" },
                { "attribute": "innerHTML", "value": "🟨", "type": "property" },
            ]);

            // A span element as child element of Header El denoting code block as text.
            let spanWithTextEl = generateElementWithAttributes("span", [
                { "attribute": "class", "value": "code-block-type", "type": "css-class" },
                { "attribute": "innerHTML", "value": "js", "type": "property" },
            ]);

            // A pre element for parent code block container containing actual code block content.
            let preEl = generateElementWithAttributes("pre", [
                { "attribute": "class", "value": "code-block-content", "type": "css-class" }, { "attribute": "innerText", "value": notesStructure[i], "type": "property" },
            ]);

            // build the container element accordingly.
            /* 
            <div class="code-block-container <code>-code-block">
                <div class="code-block-header">
                    <span class="code-block-emoji">Emoji Symbol</span>
                    <span class="code-block-type">Text</span>
                </div>
                <pre class="code-block-content">Code Block Content</pre>
            </div>
            *
            **/

            // append the span elements as child of the header element
            codeBlockHeaderEl.appendChild(spanWithEmojiEl);
            codeBlockHeaderEl.appendChild(spanWithTextEl);

            // then, lastly append the header and pre element one after another in container.
            codeBlockContainerEl.appendChild(codeBlockHeaderEl);
            codeBlockContainerEl.appendChild(preEl);

            // finally, append this container element into existing element.
            existingEl.insertAdjacentElement("beforeend", codeBlockContainerEl);
        }

        // when current element is output code block
        else if (isCodeBlock(notesStructure[i], "output")) {
            // console.log("code block", notesStructure[i]);

            // A parent section code block container element.
            let codeBlockContainerEl = generateElementWithAttributes("section", [
                { "attribute": "class", "value": "code-block-container", "type": "css-class" },
                { "attribute": "class", "value": "output-code-block", "type": "css-class" },
            ]);
            // check log.
            console.log(codeBlockContainerEl);

            // A header section element for parent code block container.
            let codeBlockHeaderEl = generateElementWithAttributes("section", [
                { "attribute": "class", "value": "code-block-header", "type": "css-class" },
            ]);

            // A span element as child element of Header El denoting code block as emoji.
            let spanWithEmojiEl = generateElementWithAttributes("span", [
                { "attribute": "class", "value": "code-block-emoji", "type": "css-class" },
                { "attribute": "innerHTML", "value": "📋", "type": "property" },
            ]);

            // A span element as child element of Header El denoting code block as text.
            let spanWithTextEl = generateElementWithAttributes("span", [
                { "attribute": "class", "value": "code-block-type", "type": "css-class" },
                { "attribute": "innerHTML", "value": "output", "type": "property" },
            ]);

            //  prepare proper value for output content in pre element i.e., excluding opening tag & a newline extra character.
            let outputContent = notesStructure[i].replace("<output>", "").replace("\n", "");

            // initial value
            let value = "";
            // when output content contains closing tag + \n
            if (outputContent.includes("</output>\n")) {
                // console.log("closing tag with new line");
                value += outputContent.replace("</output>\n", "");
            }
            // or if it only contains
            else {
                // console.log("just closing tag");
                value += outputContent.replace("</output>", "");
            }
            // check log**
            // console.log(JSON.stringify(value));

            // A pre element for parent code block container containing actual code block content 
            let preEl = generateElementWithAttributes("pre", [
                { "attribute": "class", "value": "code-block-content", "type": "css-class" }, 
                { "attribute": "innerText", "value": value, "type": "property" },
            ]);

            // build the container element accordingly.
            /* 
            <div class="code-block-container <code>-code-block">
                <div class="code-block-header">
                    <span class="code-block-emoji">Emoji Symbol</span>
                    <span class="code-block-type">Text</span>
                </div>
                <pre class="code-block-content">Code Block Content</pre>
            </div>
            *
            **/

            // append the span elements as child of the header element
            codeBlockHeaderEl.appendChild(spanWithEmojiEl);
            codeBlockHeaderEl.appendChild(spanWithTextEl);

            // then, lastly append the header and pre element one after another in container.
            codeBlockContainerEl.appendChild(codeBlockHeaderEl);
            codeBlockContainerEl.appendChild(preEl);

            // finally, append this container element into existing element.
            existingEl.insertAdjacentElement("beforeend", codeBlockContainerEl);
        }
        // otherwise a normal raw note string.
        else {
            // console.log("a normal raw note string", notesStructure[i]);
            // add the current raw text string as text to existing element.
            existingEl.insertAdjacentText("beforeend", notesStructure[i]);
        }
    }
};

// () -> is a code block!
/*
* i/p: param1: value (current element or value) [string], param2: toCheck: representation of code block to check! (html | js | any) [string]
* o/p: true | false
**/
function isCodeBlock(value, toCheck = "") {
    // when incoming parameter inputs are invalid.
    if (!value || toCheck === "") return false;

    // using switch case approach...
    switch (toCheck) {

        // for html case!
        case "html":
            if (value.startsWith("<html>") && (value.endsWith("</html>\n") || value.endsWith("</html>"))) return true;
            break;

        // for js case!
        case "js":
            if ((value.startsWith("<script>") || value.startsWith("\x3Cscript>")) && (value.endsWith(("<" + "/" + "script>\n")) || value.endsWith(("<" + "/" + "script>")) || value.endsWith("\x3C/script>") || value.endsWith("\x3C/script>\n"))) return true;
            break;

        // for output case!
        case "output":
            if (value.startsWith("<output>") && (value.endsWith("</output>\n") || value.endsWith("</output>"))) return true;
            break;

        // default case!
        default:
            break;
    };
    return false;
};

// () -> generate an html element with attributes.
/*
* i/p: (element, [{"attribute": attribute, "value": value, "type": attribute | event handler | dom-property | boolean }])
i.e., types:-
1. attribute: standard attributes like href, rel etc which cannot be duplicate i.e., more than one.
2. event handlers: like onmouseenter, onblur, onclick, ondoubleclick etc.
3. dom-property: like innerText, textContent, outerHTML, innerHTML etc.
4. boolean: like checked, disabled, readonly etc.
5. css-class: for adding up the existing class declarations etc which can be `n` or more than one.

**note**: if passing event then, value for handler should be existing function not string!

o/p: null | element
**/
function generateElementWithAttributes(element, array) {
    // when inputs ain't proper.
    if (!element || typeof (element) !== "string" || !Array.isArray(array) || array.length == 0) return null;

    // create the initial element.
    const elem = document.createElement(element);

    // iterate the content array to set the stuff.
    for (let i = 0; i < array.length; i++) {

        // when type is css based class attribute.
        if(array[i]["type"] === "css-class") {

            // add the class value in the existing class list!
            elem.classList.add(array[i]["value"]);
        }

        // when type is normal attribute or its boolean
        if (array[i]["type"] === "attribute" || array[i]["type"] === "boolean") {

            // set the attribute content.
            elem.setAttribute(array[i]["attribute"], array[i]["value"]);
        }
        // or when type is event handler
        else if (array[i]["type"] === "eventHdr") {

            // set the event and attach the content.
            elem[("on" + array[i]["attribute"])] = array[i]["value"];
        }
        // or when it's dom property
        else if (array[i]["type"] === "property") {

            // set the event handler and attach the content.
            elem[array[i]["attribute"]] = array[i]["value"];
        }

        // othewise do nothing...
        else {
        }
    }

    // at the end return the generated element.
    return elem;
};


// attach event to note editor input element.
attachElementEvent(noteEditorEl, "onblur", toggleOutput);