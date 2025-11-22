// Portscan front-end logic (Scan & Scan All with SSE progress)

document.addEventListener("DOMContentLoaded", () => {
  const ipInput = document.getElementById("scanIp");
  const portsInput = document.getElementById("scanPorts");
  const startBtn = document.getElementById("startScanBtn");
  const scanAllBtn = document.getElementById("scanAllBtn");
  const output = document.getElementById("scanResult");
  const progressBox = document.getElementById("scanProgress");
  const progressBar = document.getElementById("progressBar");
  const progressText = document.querySelector(".progress-text");

  // prefill if server passed ip
  if (typeof passedIp !== "undefined" && passedIp) {
    ipInput.value = passedIp;
  }

  // Regular (custom ports) scan
  startBtn.addEventListener("click", async () => {
    const ip = ipInput.value.trim();
    const ports = portsInput.value.trim();

    if (!ip) {
      output.innerText = "Enter an IP address.";
      return;
    }

    progressBox.classList.add("hidden");
    output.innerHTML = "Scanning specified ports...";

    try {
      const url = `/scanner/portscan?ip=${encodeURIComponent(ip)}&ports=${encodeURIComponent(ports)}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.error) {
        output.innerText = data.error;
        return;
      }

      // show results table
      let html = `<h3>Scan Results for ${data.ip}</h3>
        <table>
          <thead><tr><th>Port</th><th>Status</th></tr></thead><tbody>`;

      data.results.forEach(r => {
        html += `<tr><td>${r.port}</td><td>${r.open ? "<i class='fa-solid fa-check'></i> Open" : "<i class='fa-solid fa-x'></i> Closed"}</td></tr>`;
      });

      html += "</tbody></table>";
      output.innerHTML = html;

    } catch (err) {
      output.innerText = "Scan failed: " + (err.message || err);
    }
  });

  // Full scan with SSE progress
  scanAllBtn.addEventListener("click", () => {
    const ip = ipInput.value.trim();
    if (!ip) {
      output.innerText = "Enter an IP address.";
      return;
    }

    output.innerHTML = "";
    progressBox.classList.remove("hidden");
    progressBar.style.width = "0%";
    progressText.innerText = "Starting full scan (1–65535)...";

    // Open SSE connection
    const sseUrl = `/scanner/portscan/full?ip=${encodeURIComponent(ip)}`;
    const evt = new EventSource(sseUrl);

    // accumulate open ports in UI (we will show final at done)
    evt.onmessage = function (e) {
      try {
        const data = JSON.parse(e.data);

        if (data.done) {
          // final event with open_ports
          evt.close();
          progressBar.style.width = "100%";
          progressText.innerText = `Completed. ${data.open_ports.length} open port(s) found.`;

          if (!data.open_ports.length) {
            output.innerHTML = `<p>No open ports found.</p>`;
            return;
          }

          let html = `<h3>Open ports on ${ip}</h3><table><thead><tr><th>Port</th><th>Status</th></tr></thead><tbody>`;
          data.open_ports.forEach(p => {
            html += `<tr><td>${p}</td><td>🟢 Open</td></tr>`;
          });
          html += `</tbody></table>`;
          output.innerHTML = html;
          return;
        }

        // interim progress update
        if (typeof data.progress === "number") {
          progressBar.style.width = `${data.progress}%`;
        }
        progressText.innerText = `Scanning port ${data.current_port} (${data.scanned}/${data.total}) — ${data.progress.toFixed(2)}%`;

      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    evt.onerror = function () {
      progressText.innerText = "Scan error or connection lost.";
      evt.close();
    };
  });

});
