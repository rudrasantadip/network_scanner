document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById("pingBtn");
    const input = document.getElementById("pingInput");
    const resultBox = document.getElementById("pingResult");

    if (typeof passedIp !== "undefined" && passedIp !== "") {
        input.value = passedIp;
        runPing(passedIp);
    }

    btn.addEventListener("click", () => {
        runPing(input.value.trim());
    });
});

async function runPing(ip) {
    const resultBox = document.getElementById("pingResult");

    if (!ip) {
        resultBox.innerText = "Enter an IP.";
        return;
    }

    resultBox.innerText = "Pinging...";

    try {
        const res = await fetch(`http://localhost:8000/scanner/ping?ip=${ip}`);
        const data = await res.json();
        resultBox.innerText = data.output || data.error || "No response";
    } catch (e) {
        resultBox.innerText = "Ping failed.";
    }
}
