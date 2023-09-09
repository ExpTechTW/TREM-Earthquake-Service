for (const item of document.getElementsByClassName("text-title"))
    item.style.display = "none";

let time = 0;
const urlSearchParams = new URLSearchParams(window.location.search);
const params = Object.fromEntries(urlSearchParams.entries());
time = Number(params.time);
if (isNaN(time)) time = 0;
const audio_warn = document.getElementById("audio_warn");
const audio_alert = document.getElementById("audio_alert");
const audio = document.getElementById("audio");

const image = document.getElementById("img");
const last = document.getElementById("last");
const s = document.getElementById("switch");
const timeline = document.getElementById("timeline");
const t = document.getElementById("time");
if (time) {
    t.style.color = "yellow";
    last.disabled = false;
}

const eew_info = document.getElementById("eew-info");
const eew_time = document.getElementById("eew-time");
const eew_number = document.getElementById("eew-number");
const eew_loc = document.getElementById("eew-loc");
const eew_scale = document.getElementById("eew-scale");
const eew_depth = document.getElementById("eew-depth");
const eew_max = document.getElementById("eew-max");

const Intensity = [
    { value: 0, text: "０級", label: "0", color: "#A6ADAD" },
    { value: 1, text: "１級", label: "1", color: "#6B7878" },
    { value: 2, text: "２級", label: "2", color: "#1E6EE6" },
    { value: 3, text: "３級", label: "3", color: "#32B464" },
    { value: 4, text: "４級", label: "4", color: "#FFE05D" },
    { value: 5, text: "５弱", label: "5⁻", color: "#FFAA13" },
    { value: 6, text: "５強", label: "5⁺", color: "#EF700F" },
    { value: 7, text: "６弱", label: "6⁻", color: "#E60000" },
    { value: 8, text: "６強", label: "6⁺", color: "#A00000" },
    { value: 9, text: "７級", label: "7", color: "#5D0090" },
];

const time_string = (time) => {
    const now = new Date(time);
    let Now = now.getFullYear().toString();
    Now += "/";
    if (now.getMonth() + 1 < 10)
        Now += "0" + (now.getMonth() + 1).toString();
    else Now += (now.getMonth() + 1).toString();
    Now += "/";
    if (now.getDate() < 10) Now += "0" + now.getDate().toString();
    else Now += now.getDate().toString();
    Now += " ";
    if (now.getHours() < 10) Now += "0" + now.getHours().toString();
    else Now += now.getHours().toString();
    Now += ":";
    if (now.getMinutes() < 10) Now += "0" + now.getMinutes().toString();
    else Now += now.getMinutes().toString();
    Now += ":";
    if (now.getSeconds() < 10) Now += "0" + now.getSeconds().toString();
    else Now += now.getSeconds().toString();
    return Now;
};

let state = true;
let lock = false;
let audio_state = false;
let info_data = {};
let eew_alert = false;
let last_audio_time = 0;

audio.onclick = () => {
    audio_state = !audio_state;
    if (audio_state) {
        audio.classList.add("danger");
        audio.textContent = "關閉音效";
        audio_warn.play();
        audio_alert.play();
    } else {
        audio.classList.remove("danger");
        audio.textContent = "開啟音效";
    }
};
last.onclick = () => {
    last.disabled = true;
    time = 0;
    t.style.color = "white";
};
s.onclick = () => {
    state = !state;
    if (state) {
        t.style.color = "yellow";
        last.disabled = false;
        s.textContent = "暫停";
    } else {
        t.style.color = "red";
        last.disabled = true;
        if (!time) time = Date.now();
        s.textContent = "播放";
    }
};
timeline.oninput = () => {
    if (timeline.value == 86400) {
        t.style.color = "white";
        last.disabled = true;
    } else {
        last.disabled = false;
        t.style.color = "yellow";
    }
    time = Date.now() - (86400 - timeline.value) * 1000;
    t.textContent = `${time_string(time)} (重播)`;
};
timeline.onmousedown = () => {
    lock = true;
};
timeline.onmouseup = () => {
    lock = false;
};

image.onerror = () => {
    image.src = "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/resource/rts.png";
}
const updateImage = () => {
    image.src = `https://exptech.com.tw/api/v1/trem/rts-image?v=${Date.now()}${time ? `&time=${time}` : ""}`;
};
const updateInfo = () => {
    fetch(
        `https://exptech.com.tw/api/v1/earthquake/info?time=${!time ? 0 : Math.floor(time / 1000)
        }`
    )
        .then(async (res) => (info_data = await res.json()))
        .catch((err) => console.error(err));
};
setInterval(() => {
    if (!lock) {
        timeline.value = 86400 - (!time ? 0 : (Date.now() - time) / 1000);
        t.textContent = `${time_string(!time ? Date.now() : time)} (${t.style.color == "yellow"
            ? "重播"
            : t.style.color == "red"
                ? "暫停"
                : "即時"
            })`;
    }
    if (!state) return;
    if (time) time += 1000;
    updateImage();
    updateInfo();
    if (info_data.rts) {
        if (audio_state && Date.now() - last_audio_time > 1500) {
            last_audio_time = Date.now();
            audio_warn.play();
        }
    }
    if (info_data.eew && info_data.eew.length) {
        if (!eew_alert) {
            eew_alert = true;
            if (audio_state) audio_alert.play();
        }
        eew_time.textContent = time_string(info_data.eew[0].time);
        eew_number.textContent = info_data.eew[0].number;
        eew_loc.textContent = info_data.eew[0].location;
        eew_scale.textContent = info_data.eew[0].scale;
        eew_depth.textContent = `${info_data.eew[0].depth}km`;
        eew_max.textContent =
            info_data.eew[0].max == undefined
                ? "未知"
                : Intensity[info_data.eew[0].max].text;
        if (info_data.eew[0].max != undefined) {
            eew_info.style.color = "yellow";
            if (info_data.eew[0].max > 4) eew_info.style.color = "red";
        }
        for (const item of document.getElementsByClassName("text-title"))
            item.style.display = "";
    } else {
        eew_time.textContent = "";
        eew_number.textContent = "";
        eew_loc.textContent = "";
        eew_scale.textContent = "";
        eew_depth.textContent = "";
        eew_max.textContent = "";
        eew_alert = false;
        for (const item of document.getElementsByClassName("text-title"))
            item.style.display = "none";
    }
}, 1000);
