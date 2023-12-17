import dayjs from "dayjs";
import "./styles/style.scss";

// utility functions

function id(idName: string): HTMLElement {
    return document.getElementById(idName);
}

function classes(className: string): HTMLCollectionOf<Element> {
    return document.getElementsByClassName(className);
}

// modal functions

id("modal-container").onclick = (event) => {
    console.log(event.target);
    if ((event.target as HTMLElement).id === "modal-container") {
        document.getElementById("modal-container").style.display = "none";
    }
}

id("settings-button").onclick = (event) => {
    document.getElementById("modal-container").style.display = "flex";
}

// bookmark functions

const bookmarks = localStorage.getItem("bookmarks");

if (bookmarks === null || bookmarks.length === 0) {
    id("bookmarks-list").innerHTML += `
        <div class="no-bookmarks">no bookmarks added yet</div>
    `;
} else {
    const bookmarksArray: Bookmark[] = JSON.parse(bookmarks);
    if (bookmarksArray === null) {
        // do nothing
        id("bookmarks-list").innerHTML += `
        <div class="no-bookmarks">no bookmarks added yet</div>
    `;
    } else {
        bookmarksArray.forEach((bookmark: Bookmark) => {
            id("bookmarks-list").innerHTML += `
                <div class="bookmark-link">
                    <a href="${bookmark.url}">${bookmark.name}</a>
                </div>
            `;
        });
    }
}

function createBookmark(name: string, url: string) {
    const currItem = localStorage.getItem("bookmarks");
    console.log(currItem);
    let bookmarksArray: Bookmark[] = currItem === null ? [] : JSON.parse(currItem);
    if (bookmarksArray === null) bookmarksArray = [];
    if (bookmarksArray.filter(bookmark => bookmark.name === name).length > 0) {
        throw `bookmark of name "${name}" already exists`;
    }
    const newBookmark: Bookmark = {
        name,
        url
    }
    bookmarksArray.push(newBookmark);
    localStorage.setItem("bookmarks", JSON.stringify(bookmarksArray));
    id("bookmarks-terminal-body").innerHTML += `
        <div class="terminal-output success">
            bookmark "${name}" added successfully!
        </div>
    `;
}

function deleteBookmark(name: string) {
    const currItem = localStorage.getItem("bookmarks");
    if (currItem === null) {
        throw "there are no bookmarks to delete";
    }

    let bookmarksArray: Bookmark[] = currItem === null ? [] : JSON.parse(currItem);
    if (bookmarksArray.filter(bookmark => bookmark.name === name).length === 0) {
        throw `bookmark of name "${name}" does not exist`;
    }
    let newArr = bookmarksArray.filter(bookmark => bookmark.name !== name);
    localStorage.setItem("bookmarks", newArr.length > 0 ? JSON.stringify(newArr) : null);
    id("bookmarks-terminal-body").innerHTML += `
        <div class="terminal-output success">
            bookmark "${name}" has been successfully removed!
        </div>
    `;
}

function purgeBookmarks() {
    localStorage.setItem("bookmarks", null);
}

function listBookmarks() {
    const bookmarks: Bookmark[] = JSON.parse(localStorage.getItem("bookmarks"));
    const outputNode = document.createElement("div");
    outputNode.className = "terminal-output";
    if (bookmarks === null) {
        outputNode.innerHTML += `<div class="no-bookmarks">no bookmarks added yet</div>`;
    } else {
        bookmarks.forEach(bookmark => {
            outputNode.innerHTML += `<div class="bookmark-link">
                <a href="${bookmark.url}">${bookmark.name}</a>
            </div>`;
        });
    }
    
    id("bookmarks-terminal-body").appendChild(outputNode);
}

function processBookmarkCommand(event: SubmitEvent, value: string) {
    event.preventDefault();
    let splitCommand = value.split(" ");
    if (splitCommand.length < 2) {
        // too few elements
        throw "not enough elements";
    } else if (splitCommand[0] !== "bookmarks") {
        // not a bookmark command
        throw "not a bookmark command"
    } else {
        switch (splitCommand[1]) {
            case "add":
                if (splitCommand.length > 4) {
                    throw "too many elements provided";
                } else if (/(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})? /.test(splitCommand[3]) === false) {
                    throw "invalid url provided";
                } else {
                    createBookmark(splitCommand[2], splitCommand[3]);
                }
                break;
            case "help":
                id("bookmarks-terminal-body").innerHTML += `
                    <div class="terminal-output terminal-note">
                        <q>bookmarks help</q> receive this output<br />
                        <q>bookmarks list</q> list all bookmarks<br />
                        <q>bookmarks add [name] [url]</q> add a bookmark<br />
                        <q>bookmarks delete [name]</q> remove a bookmark<br />
                        <q>bookmarks purge</q> delete all bookmarks<br />
                    </div>
                `;
                break;
            case "purge":
                purgeBookmarks();
                break;
            case "list":
                listBookmarks();
                break;
            case "delete":
                deleteBookmark(splitCommand[2]);
                break;
            default:
                // not a proper command
                throw "not a proper bookmark command";
        }
    }
}

function bookmarkCommand(event: SubmitEvent) {
    const { value } = (classes("bookmarks-textbox")[classes("bookmarks-textbox").length - 1] as HTMLInputElement);
    try {
        processBookmarkCommand(event, value);
    } catch (e) {
        id("bookmarks-terminal-body").innerHTML += `
            <div class="terminal-output error">
                <strong>error:</strong> ${e}
            </div>
        `
    } finally {
        // create a new textbox
        const formEl = id("bookmarks-terminal-body").getElementsByTagName("form")[0];
        let newElement = document.createElement("div");
        newElement.className = "terminal-command-text";
        let text = document.createTextNode(value);
        newElement.appendChild(text);
        formEl.replaceWith(newElement);
        const templateContent = (id("add-bookmark-template") as HTMLTemplateElement).content.cloneNode(true);
        id("bookmarks-terminal-body").appendChild(templateContent);
        id("bookmarks-terminal-body").getElementsByTagName("form")[0].onsubmit = bookmarkCommand;
        (classes("bookmarks-textbox")[0] as HTMLInputElement).focus();
    }
}

(classes("create-bookmark")[classes("create-bookmark").length - 1] as HTMLFormElement).onsubmit = bookmarkCommand;

// misc functions

setInterval(() => {
    id("date-button").innerHTML = dayjs().format("h:mmA");
}, 1000);

const terminalWindows = classes("terminal-window") as HTMLCollectionOf<HTMLElement>;

for (let i = 0; i < terminalWindows.length; i++) {
    dragElement(terminalWindows[i]);
}

function dragElement(el: HTMLElement) {
   let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

   if (id(el.id + "-header")) {
        // if the header is present, drag via the header
        id(el.id + "-header").onmousedown = dragMouseDown;
   } else {
        // otherwise, use the whole window
        el.onmousedown = dragMouseDown;
   }
   
   
    function dragMouseDown(event: MouseEvent) {
        event.preventDefault();

        pos3 = event.clientX;
        pos4 = event.clientY;
        document.onmouseup = closeDragElement;
        document.onmousemove = elementDrag;
    }

    function elementDrag(event: MouseEvent) {
        const { innerWidth, innerHeight } = window;
        event.preventDefault();

        pos1 = pos3 - event.clientX;
        pos2 = pos4 - event.clientY;
        pos3 = event.clientX;
        pos4 = event.clientY;

        // the conditional is to prevent the terminal window from going out of bounds
        el.style.top = (el.offsetTop - pos2 <= 0 ? 0 : el.offsetTop - pos2 >= innerHeight ? innerHeight : el.offsetTop - pos2) + "px";
        el.style.left = (el.offsetLeft - pos1 <= 0 ? 0 : el.offsetLeft - pos1 >= innerWidth ? innerWidth : el.offsetLeft - pos1) + "px";
    }

    function closeDragElement() {
        document.onmouseup = null;
        document.onmousemove = null;
    }
}


