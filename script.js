
"use strict";

// =====================================
// FOYDALI.UZ - TO'LIQ JAVASCRIPT
// =====================================


// 1. XIZMATLARNI OCHISH

function openTool(id) {
    document.querySelectorAll(".tool-content").forEach(tool => {
        tool.classList.remove("active");
    });

    const selectedTool = document.getElementById(id);

    if (!selectedTool) return;

    selectedTool.classList.add("active");
    document.getElementById("workspace").classList.add("active");

    const titles = {
        calculator: "🧮 Kalkulyator",
        notes: "📝 Onlayn bloknot",
        tasks: "✅ Vazifalar",
        qr: "🔳 QR kod yaratish",
        text: "✍️ Matn muharriri",
        ai: "🤖 AI yordamchi"
    };

    document.getElementById("toolTitle").textContent =
        titles[id] || "Xizmat";

    document.getElementById("workspace").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}


function closeTool() {
    document.getElementById("workspace").classList.remove("active");
}


// 2. XIZMATLARNI QIDIRISH

const searchInput = document.getElementById("searchInput");

searchInput.addEventListener("input", function () {
    const value = this.value.toLowerCase().trim();

    document.querySelectorAll(".tool-card").forEach(card => {
        const name = card.dataset.name.toLowerCase();

        card.style.display =
            name.includes(value) ? "block" : "none";
    });
});


// 3. QORA VA OQ DIZAYN

const themeBtn = document.getElementById("themeBtn");

function loadTheme() {
    const theme = localStorage.getItem("siteTheme");

    if (theme === "dark") {
        document.body.classList.add("dark");
        themeBtn.textContent = "☀️";
    } else {
        document.body.classList.remove("dark");
        themeBtn.textContent = "🌙";
    }
}

themeBtn.addEventListener("click", function () {
    document.body.classList.toggle("dark");

    const dark = document.body.classList.contains("dark");

    localStorage.setItem(
        "siteTheme",
        dark ? "dark" : "light"
    );

    themeBtn.textContent = dark ? "☀️" : "🌙";
});

loadTheme();


// 4. KALKULYATOR

let calcExpression = "";

const calcDisplay = document.getElementById("calcDisplay");

function updateCalc() {
    calcDisplay.value = calcExpression || "0";
}

function calcAdd(value) {
    if (calcExpression.length >= 40) return;

    calcExpression += value;
    updateCalc();
}

function calcClear() {
    calcExpression = "";
    updateCalc();
}

function calcDelete() {
    calcExpression = calcExpression.slice(0, -1);
    updateCalc();
}

function calcCalculate() {
    try {
        if (!calcExpression ||
            !/^[0-9+\-*/.() ]+$/.test(calcExpression)) {
            throw new Error("Noto'g'ri ifoda");
        }

        const result = Function(
            '"use strict"; return (' + calcExpression + ')'
        )();

        if (!Number.isFinite(result)) {
            throw new Error("Noto'g'ri natija");
        }

        calcExpression = String(
            Number(result.toPrecision(12))
        );

        updateCalc();

    } catch (error) {
        calcDisplay.value = "Xatolik";
        calcExpression = "";
    }
}


// 5. ONLAYN BLOKNOT

const noteArea = document.getElementById("noteArea");

noteArea.value = localStorage.getItem("myNotes") || "";

function saveNotes() {
    try {
        localStorage.setItem("myNotes", noteArea.value);

        document.getElementById("noteStatus").textContent =
            "✅ Yozuvlaringiz muvaffaqiyatli saqlandi!";
    } catch {
        document.getElementById("noteStatus").textContent =
            "Xatolik: yozuvni saqlab bo'lmadi.";
    }
}


// 6. VAZIFALAR RO'YXATI

let tasks = [];

try {
    tasks = JSON.parse(
        localStorage.getItem("myTasks") || "[]"
    );

    if (!Array.isArray(tasks)) tasks = [];
} catch {
    tasks = [];
}

function saveTasks() {
    localStorage.setItem("myTasks", JSON.stringify(tasks));
}

function renderTasks() {
    const list = document.getElementById("taskList");

    list.innerHTML = "";

    tasks.forEach((task, index) => {
        const li = document.createElement("li");

        if (task.done) {
            li.classList.add("done");
        }

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";
        checkbox.checked = task.done;
        checkbox.style.width = "20px";

        checkbox.addEventListener("change", function () {
            tasks[index].done = this.checked;

            saveTasks();
            renderTasks();
        });

        const span = document.createElement("span");

        span.textContent = task.text;

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "✕";
        deleteButton.className = "delete-task";
        deleteButton.title = "Vazifani o'chirish";

        deleteButton.addEventListener("click", function () {
            tasks.splice(index, 1);

            saveTasks();
            renderTasks();
        });

        li.append(checkbox, span, deleteButton);

        list.appendChild(li);
    });
}

function addTask() {
    const input = document.getElementById("taskInput");

    const value = input.value.trim();

    if (!value) {
        alert("Iltimos, vazifani yozing!");
        return;
    }

    tasks.push({
        text: value,
        done: false
    });

    input.value = "";

    saveTasks();
    renderTasks();
}

document.getElementById("taskInput").addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            addTask();
        }
    }
);

renderTasks();


// 7. QR KOD YARATISH

function generateQR() {
    const value = document.getElementById("qrInput").value.trim();

    const result = document.getElementById("qrResult");

    if (!value) {
        alert("Matn yoki havola kiriting!");
        return;
    }

    result.innerHTML = "QR kod tayyorlanmoqda...";

    const image = document.createElement("img");

    image.alt = "QR kod";

    image.onload = function () {
        result.innerHTML = "";
        result.appendChild(image);

        const download = document.createElement("a");

        download.href = image.src;
        download.download = "foydali-qr.png";
        download.textContent = "⬇ QR kodni yuklab olish";

        download.className = "main-btn";
        download.style.display = "inline-block";
        download.style.marginTop = "15px";

        result.appendChild(document.createElement("br"));
        result.appendChild(download);
    };

    image.onerror = function () {
        result.textContent =
            "QR kod yaratilmadi. Internetni tekshiring.";
    };

    image.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=" +
        encodeURIComponent(value);
}


// 8. MATN MUHARRIRI

function changeText(type) {
    const editor = document.getElementById("textEditor");

    if (type === "upper") {
        editor.value = editor.value.toUpperCase();
    }

    else if (type === "lower") {
        editor.value = editor.value.toLowerCase();
    }

    else if (type === "clear") {
        editor.value = "";
    }
}

async function copyText() {
    const editor = document.getElementById("textEditor");

    const status = document.getElementById("textStatus");

    try {
        await navigator.clipboard.writeText(editor.value);

        status.textContent = "✅ Matn nusxalandi!";

    } catch {
        editor.select();

        const copied = document.execCommand("copy");

        status.textContent = copied
            ? "✅ Matn nusxalandi!"
            : "Nusxalash amalga oshmadi.";
    }
}


// 9. HAQIQIY AI YORDAMCHI

async function sendAI() {
    const input = document.getElementById("aiInput");

    const result = document.getElementById("aiResult");

    const question = input.value.trim();

    if (!question) {
        alert("Savolingizni yozing!");
        return;
    }

    if (question.length > 10000) {
        alert("Savol juda uzun!");
        return;
    }

    input.disabled = true;

    result.textContent = "🤖 AI o'ylamoqda...";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: question
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || "Server bilan bog'lanishda xatolik"
            );
        }

        result.textContent = data.reply || "AI javob qaytarmadi.";

        input.value = "";

    } catch (error) {
        result.textContent =
            "❌ Xatolik: " + error.message;

    } finally {
        input.disabled = false;
        input.focus();
    }
}


// ENTER TUGMASI BILAN AI GA SAVOL YUBORISH

document.getElementById("aiInput").addEventListener(
    "keydown",
    function (event) {
        if (event.key === "Enter") {
            event.preventDefault();

            sendAI();
        }
    }
);


// 10. SAYT ISHLASHI

console.log(
    "%c✦ FOYDALI.UZ ISHGA TUSHDI!",
    "color:#6657ed;font-size:20px;font-weight:bold;"
);
