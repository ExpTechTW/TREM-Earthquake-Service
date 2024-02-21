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
image.crossOrigin = "anonymous";
const last = document.getElementById("last");
const s = document.getElementById("switch");
const timeline = document.getElementById("timeline");
const t = document.getElementById("time");
if (time) {
  t.style.color = "yellow";
  last.disabled = false;
}

let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");

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
  const YYYY = now.getFullYear().toString();
  const MM = (now.getMonth() + 1).toString().padStart(2, "0");
  const DD = now.getDate().toString().padStart(2, "0");
  const hh = now.getHours().toString().padStart(2, "0");
  const mm = now.getMinutes().toString().padStart(2, "0");
  const ss = now.getSeconds().toString().padStart(2, "0");
  return `${YYYY}/${MM}/${DD} ${hh}:${mm}:${ss}`;
};

let state = true;
let lock = false;
let audio_state = false;
let info_data = [];
let eew_alert = false;
let last_audio_time = 0;
let time_ntp = 0;
let time_local = 0;

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
    if (!time) time = Now().getTime();
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
  time = Now().getTime() - (86400 - timeline.value) * 1000;
  t.textContent = `${time_string(time)} (重播)`;
};
timeline.onmousedown = () => {
  lock = true;
};
timeline.onmouseup = () => {
  lock = false;
};

image.onerror = () => {
  image.src =
    "https://cdn.jsdelivr.net/gh/ExpTechTW/API@master/resource/rts.png";
};
const updateImage = (t) => {
  image.src = t
    ? `https://lb-1.exptech.com.tw/api/v1/trem/rts-image/${t}`
    : `https://lb-1.exptech.com.tw/api/v1/trem/rts-image?t=${Date.now()}`;
};
const updateInfo = async (t) => {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    const res = await fetch(
      t
        ? `https://lb-1.exptech.com.tw/api/v1/eq/eew/${t}`
        : `https://lb-1.exptech.com.tw/api/v1/eq/eew?t=${Date.now()}`,
      {
        signal: controller.signal,
      }
    );
    clearTimeout(timer);
    if (!res.ok) throw new Error("server error");
    info_data = await res.json();
  } catch (err) {
    console.error(err);
  }
};
const ntp = async () => {
  try {
    const t = Date.now();
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 1000);
    const res = await fetch("https://lb-1.exptech.com.tw/ntp", {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error("server error");
    const ans = await res.text();
    time_ntp = Number(ans) + (Date.now() - t) / 2;
    time_local = Date.now();
  } catch (err) {
    console.error(err);
  }
};
function Now() {
  return new Date(time_ntp + (Date.now() - time_local));
}

image.onload = function () {
  canvas.width = image.width;
  canvas.height = image.height;

  ctx.drawImage(image, 0, 0);

  let x = 575;
  let y = 107;

  let imgData = ctx.getImageData(x, y, 1, 1).data;

  let r = imgData[0];
  let g = imgData[1];
  let b = imgData[2];
  let a = imgData[3];

  if (r == 255 && g == 255 && b == 255 && a == 255) {
    if (audio_state && Date.now() - last_audio_time > 1500) {
      last_audio_time = Date.now();
      audio_warn.play();
    }
  }
};

ntp();
setInterval(() => ntp(), 60000);
setInterval(() => {
  if (!lock) {
    timeline.value = 86400 - (!time ? 0 : (Now().getTime() - time) / 1000);
    t.textContent = `${time_string(!time ? Now().getTime() : time)} (${
      t.style.color == "yellow"
        ? "重播"
        : t.style.color == "red"
        ? "暫停"
        : "即時"
    })`;
  }
  if (!state) return;
  if (time) time += 1000;
  updateImage(time);
  updateInfo(time);

  if (info_data) {
    let cwa_eq = false;
    let EQ = {};
    for (const eq of info_data) {
      if (eq.author == "cwa") {
        cwa_eq = true;
        EQ = eq;
        break;
      }
    }

    if (!cwa_eq) cancel();
    else {
      if (!eew_alert) {
        eew_alert = true;
        if (audio_state) audio_alert.play();
      }

      eew_time.textContent = time_string(EQ.eq.time);
      eew_number.textContent = EQ.serial;
      eew_loc.textContent = EQ.eq.loc;
      eew_scale.textContent = EQ.eq.mag.toFixed(1);
      eew_depth.textContent = `${EQ.eq.depth}km`;
      eew_max.textContent = !EQ.eq.max ? "未知" : Intensity[EQ.eq.max].text;
      if (!EQ.eq.max) {
        eew_info.style.color = "yellow";
        if (EQ.eq.max > 4) eew_info.style.color = "red";
      }
      for (const item of document.getElementsByClassName("text-title"))
        item.style.display = "";
    }
  } else {
    cancel();
  }

  function cancel() {
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
