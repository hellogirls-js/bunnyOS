import dayjs from "dayjs";
import _ from "lodash";
import axios from "axios";
import aalib from "aalib.js";
import dotenv from "dotenv";

import "./styles/style.scss";
import env from "./data/env.json";

// utility functions

function id(idName: string): HTMLElement {
    return document.getElementById(idName);
}

function classes(className: string): HTMLCollectionOf<Element> {
    return document.getElementsByClassName(className);
}

// modal functions

id("reset-settings").onclick = (event) => {
    localStorage.clear();
}

id("modal-container").onclick = (event) => {
    if ((event.target as HTMLElement).id === "modal-container") {
        document.getElementById("modal-container").style.display = "none";
    }
}

id("settings-button").onclick = (event) => {
    document.getElementById("modal-container").style.display = "flex";
}

const bgType: "solid" | "gradient" | "image" | null = localStorage.getItem("bgType") as "solid" | "gradient" | "image" | null;
const bgValue = localStorage.getItem("bgValue") ?? "#ffffff";

if (bgType === "image") {
    (id("image-bg") as HTMLInputElement).checked = true;
    id("image-container").style.display = "block";
} else if (bgType === "gradient") {
    (id("gradient-bg") as HTMLInputElement).checked = true;
    id("gradient-container").style.display = "block";
} else {
    (id("solid-color-bg") as HTMLInputElement).checked = true;
    id("solid-color-container").style.display = "block";
}

for (let i = 0; i < classes("modal-background-type").length; i++) {
    classes("modal-background-type")[i].addEventListener("input", function (event: InputEvent) {
        const target: HTMLInputElement = event.target as HTMLInputElement;
        let idArr = target.id.split("-");

        idArr.pop();
        idArr.push("container");

        const idName = idArr.join("-");

        for (let j = 0; j < classes("picker-container").length; j++) {
            (classes("picker-container")[j] as HTMLElement).style.display = "none";
        }
    
        id(idName).style.display = "block";

        localStorage.setItem("bgType", idArr[0]);
    });
}

(id("solid-color-picker") as HTMLInputElement).value = bgType === "solid" && bgValue !== null ? bgValue : "#ffffff";

(id("solid-color-picker") as HTMLInputElement).addEventListener("input", _.debounce(function (event: InputEvent) {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    id("desktop-bg").style.backgroundColor = target.value;
    localStorage.setItem("bgValue", target.value);
}, 500));

(id("gradient-picker-1") as HTMLInputElement).addEventListener("input", _.debounce(function (event: InputEvent) {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    let gradString = `linear-gradient(${(id("gradient-picker-2") as HTMLInputElement).value}, ${target.value})`;
    id("desktop-bg").style.backgroundImage = gradString;
    localStorage.setItem("bgValue", gradString);
}, 500));

(id("gradient-picker-2") as HTMLInputElement).addEventListener("input", _.debounce(function (event: InputEvent) {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    let gradString = `linear-gradient(${(id("gradient-picker-1") as HTMLInputElement).value}, ${target.value})`;
    id("desktop-bg").style.backgroundImage = gradString;
    localStorage.setItem("bgValue", gradString);
}, 500));

(id("image-picker") as HTMLInputElement).addEventListener("change", function (event: InputEvent) {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    const file = target.files[0];
    let imgSrc;

    const reader = new FileReader();
    reader.addEventListener("load", function(event): void {
        imgSrc = event.target.result;
        let imgUrlString = `url("${imgSrc}")`;
        const img = new Image();
        img.src = imgSrc as string;
        const ratio = img.width / 300
        id("desktop-bg").style.backgroundImage = imgUrlString;
        (id("bg-preview-thumbnail") as HTMLImageElement).src = imgSrc as string;
        (id("bg-preview-thumbnail") as HTMLImageElement).height = img.height * ratio;
        localStorage.setItem("bgValue", imgUrlString);
    }, false);

    if (file) {
        console.log(reader.readAsDataURL(file));
    }
});

if (bgType === "gradient" || bgType === "image") {
    id("desktop-bg").style.backgroundImage = bgValue;

    if (bgType === "image") {
        const img = new Image();
        img.src = bgValue.split('"')[1];
        const ratio = 300 / img.width;
        (id("bg-preview-thumbnail") as HTMLImageElement).src = img.src;
        (id("bg-preview-thumbnail") as HTMLImageElement).height = img.height * ratio;
    }
} else {
    id("desktop-bg").style.backgroundColor = bgValue;
}


// bookmark functions

const userName = localStorage.getItem("username") || "null";
const deviceName = localStorage.getItem("deviceName") || "computer";

(id("modal-user-name") as HTMLInputElement).value = localStorage.getItem("username") || "";
(id("modal-device-name") as HTMLInputElement).value = localStorage.getItem("deviceName") || "";

id("modal-device-name").addEventListener("input", _.debounce(function (event: InputEvent) {
    localStorage.setItem("deviceName", (event.target as HTMLInputElement).value);
    for (let i = 0; i < classes("terminal-user-name").length; i++) {
        classes("terminal-device-name")[i].textContent = (event.target as HTMLInputElement).value.length > 0 ? (event.target as HTMLInputElement).value : "computer";
    }
}, 500));

id("modal-user-name").addEventListener("input", _.debounce(function (event: InputEvent) {
    localStorage.setItem("username", (event.target as HTMLInputElement).value);
    for (let i = 0; i < classes("terminal-user-name").length; i++) {
        classes("terminal-user-name")[i].textContent = (event.target as HTMLInputElement).value.length > 0 ? (event.target as HTMLInputElement).value : "null";
    }
}, 500));

for (let i = 0; i < classes("terminal-user-name").length; i++) {
    classes("terminal-user-name")[i].textContent = userName;
    classes("terminal-device-name")[i].textContent = deviceName;
}

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
                if (/(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?\/[a-zA-Z0-9]{2,}|((https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z]{2,}(\.[a-zA-Z]{2,})(\.[a-zA-Z]{2,})?)|(https:\/\/www\.|http:\/\/www\.|https:\/\/|http:\/\/)?[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}\.[a-zA-Z0-9]{2,}(\.[a-zA-Z0-9]{2,})? /.test(splitCommand[splitCommand.length - 1]) === false) {
                    throw "invalid url provided";
                } else {
                    const url = splitCommand.pop();
                    const command = splitCommand.slice(2);
                    createBookmark(command.join(" "), url);
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
                const name = splitCommand.splice(2);
                deleteBookmark(name.join(" "));
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
        const savedUserName = localStorage.getItem("username") || "null";
        const savedDeviceName = localStorage.getItem("deviceName") || "computer";
        const formEl = id("bookmarks-terminal-body").getElementsByTagName("form")[0];
        let newElement = document.createElement("div");
        newElement.className = "terminal-command-text";
        let text = document.createTextNode(value);
        newElement.appendChild(text);
        formEl.replaceWith(newElement);
        const templateContent = (id("add-bookmark-template") as HTMLTemplateElement).content.cloneNode(true);
        id("bookmarks-terminal-body").appendChild(templateContent);
        for (let i = 0; i < classes("terminal-user-name").length; i++) {
            classes("terminal-user-name")[i].textContent = savedUserName;
            classes("terminal-device-name")[i].textContent = savedDeviceName;
        }
        id("bookmarks-terminal-body").getElementsByTagName("form")[0].onsubmit = bookmarkCommand;
        (classes("bookmarks-textbox")[0] as HTMLInputElement).focus();
    }
}

(classes("create-bookmark")[classes("create-bookmark").length - 1] as HTMLFormElement).onsubmit = bookmarkCommand;

// weather functions

let temp_c: number; let temp_f: number; let locationInfo: LocationObject;

if (localStorage.getItem("locationId") !== null) {
    axios.get(`${process.env.WEATHER_API_URL}search.json?key=${process.env.WEATHER_API_KEY}&q=${localStorage.getItem("locationId")}`).then(res => res.data).then(locations => {
        (id("modal-user-location") as HTMLInputElement).value = (locations as LocationObject[])[0].name.toLocaleLowerCase(); 
        locationInfo = (locations as LocationObject[])[0];
    }).catch(err => console.error(err));

    axios.get(`${process.env.WEATHER_API_URL}current.json?key=${process.env.WEATHER_API_KEY}&q=${localStorage.getItem("locationId")}`).then(res => res.data).then(data => {
        const { current } = data;
        const tempUnit = localStorage.getItem("temperatureUnit");

        // put weather data in the navbar
        id("weather-button").getElementsByTagName("i")[0].classList.replace("ti-temperature-off", tempUnit === null || tempUnit === "celsius" ? "ti-temperature-celsius" : "ti-temperature-fahrenheit");
        id("weather-button-temp").innerHTML = tempUnit === null || tempUnit === "celsius" ? current.temp_c : current.temp_f;
        temp_c = current.temp_c;
        temp_f = current.temp_f;

        // put weather data in the terminal window
        id("weather-content").innerHTML = `
            <pre id="weather-icon">
            </pre>
            <div id="weather-information">
                <div id="weather-location">${locationInfo.name.toLowerCase()}${locationInfo.region ? `, ${locationInfo.region.toLocaleLowerCase()}` : ""}</div>
                <div id="weather-temp">${tempUnit === null || tempUnit === "celsius" ? `${temp_c}°C` : `${temp_f}°F`}</div>
                <div id="weather-desc">${current.condition.text.toLowerCase()}</div>
            </div>
        `;

        aalib.read.image.fromURL(current.condition.icon)
            .map(aalib.aa({
                width: 35,
                height: 15,
                colored: false
            }))
            .map(aalib.render.html({
                el: id("weather-icon"),
                background: "transparent",
                color: "hsl(227, 70%, 87%)"
            })).subscribe();

    }).catch(err => console.error(err))
}

if (localStorage.getItem("temperatureUnit") !== null) {
    if (localStorage.getItem("temperatureUnit") === "fahrenheit") {
        (id("radio-f") as HTMLInputElement).checked = true;
    } else {
        (id("radio-c") as HTMLInputElement).checked = true;
    }
} else {
    (id("radio-c") as HTMLInputElement).checked = true;
}

function setTempUnit(event: InputEvent) {
    const target: HTMLInputElement = event.target as HTMLInputElement;
    localStorage.setItem("temperatureUnit", target.value);
    id("weather-button").getElementsByTagName("i")[0].classList.replace(target.value === "fahrenheit" ? "ti-temperature-celsius" : "ti-temperature-fahrenheit", target.value === "celsius" ? "ti-temperature-celsius" : "ti-temperature-fahrenheit");
    id("weather-button-temp").innerHTML = localStorage.getItem("temperatureUnit") === null || localStorage.getItem("temperatureUnit") === "celsius" ? `${temp_c}` : `${temp_f}`;
    id("weather-temp").textContent = localStorage.getItem("temperatureUnit") === null || localStorage.getItem("temperatureUnit") === "celsius" ? `${temp_c}°C` : `${temp_f}°F`;
}

id("radio-f").oninput = setTempUnit;
id("radio-c").oninput = setTempUnit;

function selectLocation(event: MouseEvent) {
    let target: HTMLElement = event.target as HTMLElement;
    const RESULT_CONTAINER = "location-search-results";
    if (target.className === "location-name" || target.className === "location-info") {
        target = target.parentElement;
    }
    localStorage.setItem("locationId", target.dataset.locationId);
    axios.get(`${process.env.WEATHER_API_URL}search.json?key=${process.env.WEATHER_API_KEY}&q=${target.dataset.locationId}`).then(res => res.data).then(locations => {
        (id("modal-user-location") as HTMLInputElement).value = (locations as LocationObject[])[0].name.toLocaleLowerCase(); 
    }).catch(err => console.error(err));
    
    id(RESULT_CONTAINER).style.display = "none";
}  

id("modal-user-location").addEventListener("input", _.debounce((event: InputEvent) => {
    const RESULT_CONTAINER = "location-search-results";
    const input: HTMLInputElement = event.target as HTMLInputElement;
    if (input.value.length === 0) {
        id(RESULT_CONTAINER).style.display = "none";
    } else {
        axios.get(`${process.env.WEATHER_API_URL}search.json?key=${process.env.WEATHER_API_KEY}&q=${input.value}`)
         .then(res => {
            if (res.status !== 200 && res.status !== 201) {
                throw  `could not fetch locations (status code: ${res.status})`;
            }
            return res.data;
         })
         .then(locations => {
            id(RESULT_CONTAINER).style.display = "block";
            id(RESULT_CONTAINER).innerHTML = "";
            if (locations.length === 0) {
                id(RESULT_CONTAINER).innerHTML = `
                    <div style="padding: 4px">no results found :(</div>
                `;
            } else {
               locations.forEach((loc: LocationObject) => {
                    const templateContent = (id("location-result-template") as HTMLTemplateElement).content.cloneNode(true);
                    id(RESULT_CONTAINER).appendChild(templateContent);
                    classes("location-name")[classes("location-name").length - 1].innerHTML = loc.name.toLocaleLowerCase();
                    classes("location-info")[classes("location-info").length - 1].innerHTML = `${loc.region ? loc.region.toLocaleLowerCase() : ""}, ${loc.country.toLocaleLowerCase()}, (${loc.lat}, ${loc.lon})`;
                    (classes("location-result")[classes("location-result").length - 1] as HTMLElement).onclick = selectLocation;
                    (classes("location-result")[classes("location-result").length - 1] as HTMLElement).setAttribute("data-location-id", `id:${loc.id}`);
                }); 
            }
            
            id(RESULT_CONTAINER).style.bottom = `-${id(RESULT_CONTAINER).offsetHeight}px`;
         }).catch(err => {
            id(RESULT_CONTAINER).style.display = "block";
            id(RESULT_CONTAINER).innerHTML = `
                <div id="location-search-error">
                    ${err}
                </div>
            `;
         });
    }
}, 500));

// search functions

id("google-search-form").onsubmit = (event) => {
    event.preventDefault();

    window.location.href = `https://google.com/search?q=${(id("google-search-text") as HTMLInputElement).value.replaceAll(" ", "+")}`;
}

// misc functions

let showColon = true;
setInterval(() => {
    showColon = !showColon;
    id("date-button").innerHTML = dayjs().format("h:mmA");
    id("clock-content").innerHTML = `${dayjs().format("h") + `<span style="visibility: ${showColon ? "visible" : "hidden"}">:</span>` + dayjs().format("mmA")} <div class="clock-date">${dayjs().format("ddd MMMM D, YYYY")}</div>`;
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


