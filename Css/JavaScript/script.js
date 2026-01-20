const htmlTags = ['div', 'span', 'h1', 'h2', 'p', 'button', 'input', 'img', 'a', 'section', 'ul', 'li', 'br', 'hr', 'script', 'style'];
const cssProps = ['color', 'background', 'font-size', 'margin', 'padding', 'border', 'display', 'width', 'height', 'flex', 'position', 'top', 'border-radius'];

// Files Management with Local Storage
let files = JSON.parse(localStorage.getItem('esmart_files')) || {
    "index.html": "<h1>E-Smart IDE</h1>\n<p>Start coding!</p>",
    "style.css": "h1 { color: #007bff; }",
    "script.js": "console.log('Hello World');"
};

let activeFile = "index.html";
const editor = document.getElementById("main-editor");
const suggBox = document.getElementById("suggestions-box");
const consoleDisplay = document.getElementById("error-console");

function init() {
    renderFileList();
    loadActiveFile();
}

// Render the Sidebar Files
function renderFileList() {
    const listDisplay = document.getElementById("file-list");
    listDisplay.innerHTML = '';
    Object.keys(files).forEach(fileName => {
        const container = document.createElement('div');
        container.className = `file-item-container ${fileName === activeFile ? 'active' : ''}`;
        
        const item = document.createElement('div');
        item.className = `file-item ${fileName === activeFile ? 'active' : ''}`;
        item.innerText = fileName;
        item.onclick = () => switchFile(fileName);
        
        container.appendChild(item);
        if(fileName !== "index.html") {
            const del = document.createElement('span');
            del.innerHTML = '×';
            del.className = 'del-btn';
            del.onclick = (e) => { e.stopPropagation(); deleteFile(fileName); };
            container.appendChild(del);
        }
        listDisplay.appendChild(container);
    });
}

// Switch between files
function switchFile(name) {
    files[activeFile] = editor.value;
    activeFile = name;
    loadActiveFile();
    renderFileList();
    suggBox.style.display = 'none';
}

function loadActiveFile() {
    editor.value = files[activeFile];
    document.getElementById("active-file-name").innerText = activeFile;
    runCode();
}

// Input handling for Suggestions and Auto-save
editor.oninput = () => {
    files[activeFile] = editor.value;
    localStorage.setItem('esmart_files', JSON.stringify(files));
    runCode();
    handleSuggestions();
};

function handleSuggestions() {
    const val = editor.value.substring(0, editor.selectionStart);
    const words = val.split(/[ \n<:;{}]+/);
    const lastWord = words.pop().toLowerCase();

    if (lastWord.length > 0) {
        let list = activeFile.endsWith('.html') ? htmlTags : (activeFile.endsWith('.css') ? cssProps : []);
        const matches = list.filter(item => item.startsWith(lastWord));

        if (matches.length > 0) {
            suggBox.innerHTML = '';
            matches.forEach(match => {
                const item = document.createElement('div');
                item.className = 'sugg-item';
                item.innerText = activeFile.endsWith('.html') ? `<${match}>` : match;
                item.onclick = () => {
                    const start = editor.selectionStart;
                    const before = editor.value.substring(0, start - lastWord.length);
                    const after = editor.value.substring(start);
                    if(activeFile.endsWith('.html')) editor.value = before + match + '></' + match + '>' + after;
                    else editor.value = before + match + ': ;' + after;
                    suggBox.style.display = 'none';
                    editor.focus();
                    saveAndRun();
                };
                suggBox.appendChild(item);
            });
            suggBox.style.display = 'block';
        } else { suggBox.style.display = 'none'; }
    } else { suggBox.style.display = 'none'; }
}

function saveAndRun() {
    localStorage.setItem('esmart_files', JSON.stringify(files));
    runCode();
}

function runCode() {
    const html = files["index.html"] || "";
    const css = `<style>${files["style.css"] || ""}</style>`;
    const js = files["script.js"] || "";
    const output = document.getElementById("output-window").contentWindow.document;
    
    try {
        output.open();
        output.write(html + css + `<script>${js}<\/script>`);
        output.close();
        consoleDisplay.innerText = "Ready.";
        consoleDisplay.style.color = "#888";
    } catch (err) {
        consoleDisplay.innerText = "Error: " + err.message;
        consoleDisplay.style.color = "#ff4444";
    }
}

function deleteFile(name) {
    if(confirm("Delete " + name + "?")) {
        delete files[name];
        if(activeFile === name) activeFile = "index.html";
        saveAndRun();
        renderFileList();
        loadActiveFile();
    }
}

function addNewFile() {
    const n = prompt("File name (e.g., about.html):");
    if(n) { files[n] = ""; switchFile(n); }
}

function insertChar(c) {
    const s = editor.selectionStart;
    editor.value = editor.value.substring(0, s) + c + editor.value.substring(editor.selectionEnd);
    editor.focus();
    editor.selectionStart = editor.selectionEnd = s + 1;
    saveAndRun();
}

function toggleSearch() {
    const bar = document.getElementById("search-bar");
    bar.style.display = (bar.style.display === "flex") ? "none" : "flex";
}

function replaceCode() {
    const find = document.getElementById("find-input").value;
    const replace = document.getElementById("replace-input").value;
    if(!find) return;
    editor.value = editor.value.split(find).join(replace);
    saveAndRun();
}

function downloadProject() {
    const blob = new Blob([JSON.stringify(files, null, 2)], {type: "application/json"});
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "esmart_project.json";
    a.click();
}

function openFullScreen() {
    const out = document.getElementById("output-window");
    if(out.requestFullscreen) out.requestFullscreen();
    else if(out.webkitRequestFullscreen) out.webkitRequestFullscreen();
}

init();
  
