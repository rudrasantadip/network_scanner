// =====================================================
// NETWORK INFO HANDLING
// =====================================================

let networkInfo = null;

/**
 * Loads network-info JSON and updates dropdown + UI.
 */
async function refreshHostInfo() {
  
    const res = await fetch("http://localhost:8000/scanner/host/network-info");
    networkInfo = await res.json();

    const dropdown = document.getElementById("ifaceDropdown");

    // ---------------------------
    // 1. Build a list of valid interfaces (those with IPv4)
    // ---------------------------
    const validIfaces = Object.keys(networkInfo.interfaces);

    if (validIfaces.length === 0) {
        console.error("No valid interfaces found!");
        return;
    }

    // ---------------------------
    // 2. Choose primary interface
    // ---------------------------
    let primaryIface = null;

    // pick real physical interface (skip VM & loopback)
    for (const k of validIfaces) {
        const ip = networkInfo.interfaces[k].ip;

        if (
            !ip.startsWith("127.") &&         
            !ip.startsWith("169.254.") &&     
            !ip.startsWith("192.168.56.") &&  
            !ip.startsWith("192.168.80.") && 
            !ip.startsWith("192.168.190.")    
        ) {
            primaryIface = k;
            break;
        }
    }

    // fallback to first interface
    if (!primaryIface) primaryIface = validIfaces[0];

  

    // ---------------------------
    // 3. Populate dropdown only with VALID interfaces
    // ---------------------------
    dropdown.innerHTML = "";

    validIfaces.forEach(iface => {
        const opt = document.createElement("option");
        opt.value = iface;
        opt.textContent = iface;
        if (iface === primaryIface) opt.selected = true;
        dropdown.appendChild(opt);
    });

    // ---------------------------
    // 4. Load main interface details
    // ---------------------------
    loadInterfaceDetails(primaryIface);

    // ---------------------------
    // 5. Dropdown change handler
    // ---------------------------
    dropdown.onchange = function () {
        loadInterfaceDetails(this.value);
    };
}


/**
 * Updates all UI elements for a selected interface
 */
function loadInterfaceDetails(ifaceName) {
    const data = networkInfo.interfaces[ifaceName];

    if (!data) {
        console.warn("Interface not found:", ifaceName);
        return;
    }

    console.log("Loading interface:", ifaceName, data);

    // Update UI
    document.getElementById("hostIp").innerText        = data.ip;
    document.getElementById("hostInterface").innerText = "Interface: " + ifaceName;
    document.getElementById("hostMac").innerText       = "MAC: " + (data.mac || "—");
    document.getElementById("netmask").innerText       = data.netmask;
    document.getElementById("cidr").innerText          = data.cidr;
    document.getElementById("broadcast").innerText     = data.broadcast;
    document.getElementById("gateway").innerText       = networkInfo.gateway || "—";
}



// =====================================================
// UI EVENT HANDLERS
// =====================================================

document.addEventListener("DOMContentLoaded", () => {
    refreshHostInfo();

    // Copy IP
    document.getElementById("copyBtn").addEventListener("click", async () => {
        const ip = document.getElementById("hostIp").innerText;

        try {
            await navigator.clipboard.writeText(ip);
            const btn = document.getElementById("copyBtn");
            btn.innerText = "Copied ✓";
            setTimeout(() => btn.innerText = "Copy IP", 1200);
        } catch (e) {
            alert("Failed to copy. IP: " + ip);
        }
    });

    // Refresh button
    document.getElementById("refreshBtn").addEventListener("click", async () => {
        await refreshHostInfo();
    });

    // Sidebar
    document.querySelectorAll('.nav-item').forEach((btn, i) => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.nav-item').forEach(x => x.classList.remove('active'));
            btn.classList.add('active');

            const sec = btn.dataset.section;
            document.getElementById("section-placeholder").innerHTML =
                `<h3>${sec}</h3><p>Section "${sec}" content goes here.</p>`;
        });
    });

    // Dock → mimic nav click
    document.querySelectorAll('.dock-item').forEach((dockBtn, i) => {
        dockBtn.addEventListener('click', () => {
            const navItem = document.querySelectorAll('.nav-item')[i];
            if (navItem) navItem.click();
        });
    });

    // Open button
    document.getElementById("openBtn").addEventListener("click", () => {
        const ip = document.getElementById("hostIp").innerText;
        window.open(`http://${ip}:5000`, "_blank");
    });

});



// DASHBOARD

async function fetchDevices() {
  return [
    {
      ip: "192.168.0.102",
      mac: "30:89:4A:61:F5:0D",
      vendor: "Apple, Inc.",
      latency: 12,
      online: true
    },
    {
      ip: "192.168.0.105",
      mac: "00:1A:2B:3C:4D:5E",
      vendor: "Intel Corp.",
      latency: null,
      online: false
    }
  ];
}


async function loadDeviceList() {
  const body = document.getElementById("deviceTableBody");

  body.innerHTML = `
    <tr><td colspan="6" style="text-align:center; color:#6b7280; padding:20px;">
      Scanning network...
    </td></tr>
  `;

  const devices = await fetchDevices();

  if (!devices.length) {
    body.innerHTML = `
      <tr><td colspan="6" style="text-align:center; padding:20px;">
        No devices found.
      </td></tr>
    `;
    return;
  }

  body.innerHTML = "";

  devices.forEach(d => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td><span class="status-dot ${d.online ? "status-online" : "status-offline"}"></span></td>
      <td>${d.ip}</td>
      <td>${d.mac}</td>
      <td>${d.vendor || "Unknown"}</td>
      <td>${d.latency !== null ? d.latency + "ms" : "—"}</td>
      <td>
        <button class="device-action-btn">Ping</button>
        <button class="device-action-btn">Scan</button>
      </td>
    `;

    body.appendChild(row);
  });
}


document.addEventListener("DOMContentLoaded", () => {
  loadDeviceList();

  document.getElementById("refreshDevicesBtn").addEventListener("click", () => {
    loadDeviceList();
  });

})