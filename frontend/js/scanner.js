const statusEl = document.getElementById("status");

function onScanSuccess(decodedText) {
  try {
    const qrData = JSON.parse(decodedText);

    if (!qrData.empId || !qrData.secret) {
      throw new Error("Invalid QR format");
    }

    markAttendance(qrData.empId, qrData.secret);
  } catch (err) {
    statusEl.textContent = "Invalid QR Code";
    statusEl.className = "error";
  }
}

async function markAttendance(empId, secret) {
  const response = await fetch(`${window.location.origin}/mark-attendance`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empId, secret })
  });

  const result = await response.json();

  if (response.ok) {
    statusEl.textContent = "Attendance marked successfully";
    statusEl.className = "success";
  } else {
    statusEl.textContent = result.message || "Attendance failed";
    statusEl.className = "error";
  }
}

// Start camera
const html5QrCode = new Html5Qrcode("reader");

Html5Qrcode.getCameras().then(devices => {
  if (devices && devices.length) {
    html5QrCode.start(
      devices[0].id,
      { fps: 10, qrbox: 250 },
      onScanSuccess
    );
  }
}).catch(err => {
  statusEl.textContent = "Camera access denied";
  statusEl.className = "error";
});
