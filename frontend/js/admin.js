console.log("PAGE LOADED:", new Date().toLocaleTimeString());

document.getElementById("genBtn").addEventListener("click", generateQR);
document.getElementById("resetBtn").addEventListener("click", resetForm);

async function generateQR() {
  console.log("GENERATE CLICKED");

  const empId = document.getElementById("empId").value;
  const name = document.getElementById("name").value;
  const dept = document.getElementById("dept").value;

  if (!empId || !name) {
    alert("Employee ID and Name required");
    return;
  }

  const response = await fetch(`${window.location.origin}/register-employee`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ empId, name, dept })
  });

  const data = await response.json();

  const qrDiv = document.getElementById("qr");

  // ❗ DO NOT clear again after this
  qrDiv.innerHTML = "";

  new QRCode(qrDiv, {
    text: data.qrData,
    width: 200,
    height: 200
  });

  console.log("QR GENERATED");
}



function resetForm() {
  document.getElementById("empId").value = "";
  document.getElementById("name").value = "";
  document.getElementById("dept").value = "";
  document.getElementById("qr").innerHTML = "";
  console.log("FORM RESET");
}
