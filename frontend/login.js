const API = "http://localhost:5000";

document.getElementById("sendOtpBtn").onclick = async () => {
  const email = document.getElementById("email").value;

  await fetch(`${API}/api/auth/send-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  alert("OTP sent");
  document.getElementById("otpBox").style.display = "block";
};

document.getElementById("verifyOtpBtn").onclick = async () => {
  const email = document.getElementById("email").value;
  const otp = document.getElementById("otp").value;

  const res = await fetch(`${API}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, otp })
  });

  const data = await res.json();

  if (!res.ok) return alert(data.message);

  localStorage.setItem("user", JSON.stringify(data.user));
  localStorage.setItem("token", data.token);

  window.location.href = "index.html";
};
