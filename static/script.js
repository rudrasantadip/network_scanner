/* =======================================================
   NETWORK INFO + HOST INFO
======================================================= */

let networkInfo = null;

async function refreshHostInfo() {
  const res = await fetch("http://localhost:8000/scanner/host/network-info");
  networkInfo = await res.json();

  const dropdown = document.getElementById("ifaceDropdown");

  const validIfaces = Object.keys(networkInfo.interfaces);
  if (validIfaces.length === 0) return;

  let primaryIface = validIfaces.find(k => {
    const ip = networkInfo.interfaces[k].ip;
    return (
      !ip.startsWith("127.") &&
      !ip.startsWith("169.254.") &&
      !ip.startsWith("192.168.56.") &&
      !ip.startsWith("192.168.80.") &&
      !ip.startsWith("192.168.190.")
    );
  }) || validIfaces[0];

  dropdown.innerHTML = "";
  validIfaces.forEach(iface => {
    const opt = document.createElement("option");
    opt.value = iface;
    opt.textContent = iface;
    if (iface === primaryIface) opt.selected = true;
    dropdown.appendChild(opt);
  });

  loadInterfaceDetails(primaryIface);

  dropdown.onchange = () => loadInterfaceDetails(dropdown.value);
}

function loadInterfaceDetails(ifaceName) {
  const data = networkInfo.interfaces[ifaceName];
  if (!data) return;

  document.getElementById("hostIp").innerText = data.ip;
  document.getElementById("hostInterface").innerText = "Interface: " + ifaceName;
  document.getElementById("hostMac").innerText = "MAC: " + data.mac;
  document.getElementById("netmask").innerText = data.netmask;
  document.getElementById("cidr").innerText = data.cidr;
  document.getElementById("broadcast").innerText = data.broadcast;
  document.getElementById("gateway").innerText = networkInfo.gateway || "—";
}


/* =======================================================
   DEVICE LIST + SCANNER
======================================================= */

async function fetchDevices() {
  try {
    const res = await fetch("http://localhost:8000/scanner/scan", { cache: "no-store" });
    if (!res.ok) throw new Error("Scan failed");
    return await res.json();
  } catch (error) {
    console.error(error);
    return [];
  }
}

function pingDevice(ip) {
  window.location.href = `/ping?ip=${encodeURIComponent(ip)}`;
}

function scanDevice(ip){
  window.location.href=`/portscan?ip=${encodeURIComponent(ip)}`
}

async function loadDeviceList() {
  const body = document.getElementById("deviceTableBody");

  body.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center;">Scanning...</td></tr>`;

  const devices = await fetchDevices();
  if (!devices.length) {
    body.innerHTML = `<tr><td colspan="6" style="padding:20px; text-align:center;">No devices found.</td></tr>`;
    return;
  }

  body.innerHTML = "";
  devices.forEach(d => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td><span class="status-dot ${d.online ? "status-online" : "status-offline"}"></span></td>
      <td>${d.ip}</td>
      <td>${d.mac}</td>
      <td>
        <button class="device-action-btn" onclick="pingDevice('${d.ip}')">Ping</button>
        <button class="device-action-btn" onclick="scanDevice('${d.ip}')">Scan</button>
      </td>
    `;
    body.appendChild(row);
  });
}


/* =======================================================
   PAGE NAVIGATION (Sidebar)
======================================================= */

function showPage(pageId) {
  document.querySelectorAll(".page").forEach(p => p.classList.add("hidden"));
  document.getElementById(pageId).classList.remove("hidden");
}


/* =======================================================
   DOM READY
======================================================= */

document.addEventListener("DOMContentLoaded", () => {

  refreshHostInfo();
  loadDeviceList();

  document.getElementById("refreshDevicesBtn").addEventListener("click", loadDeviceList);

  // Copy IP
  document.getElementById("copyBtn").addEventListener("click", async () => {
    const ip = document.getElementById("hostIp").innerText;
    await navigator.clipboard.writeText(ip);
  });

  // Sidebar navigation
  document.querySelectorAll(".nav-item").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".nav-item").forEach(x => x.classList.remove("active"));
      btn.classList.add("active");

      const page = btn.dataset.section + "Page";
      showPage(page);
    });
  });
});
