import dayjs from "dayjs";
import "./styles/style.scss";

setInterval(() => {
    document.getElementById("date-button").innerHTML = dayjs().format("h:mmA");
}, 1000);
