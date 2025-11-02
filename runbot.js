const zipInput = document.getElementById('zipInput');
const uploadBtn = document.getElementById('uploadBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const uptimeEl = document.getElementById('uptime');
const memEl = document.getElementById('mem');
const pingEl = document.getElementById('ping');
const logsEl = document.getElementById('logs');

let pollInterval = null;

uploadBtn.addEventListener('click', async () => {
  const f = zipInput.files[0];
  if (!f) { alert('Pilih file ZIP dulu'); return; }
  uploadBtn.disabled = true;
  statusEl.textContent = 'Mengunggah...';
  const fd = new FormData();
  fd.append('zip', f, f.name);
  try {
    const res = await fetch('/api/run-bot', { method: 'POST', body: fd });
    const j = await res.json();
    if (res.ok) {
      statusEl.textContent = 'Bot started (id: ' + j.jobId + ')';
      stopBtn.disabled = false;
      startPolling();
    } else {
      statusEl.textContent = 'Error: ' + (j.message || res.status);
      uploadBtn.disabled = false;
    }
  } catch (e) {
    statusEl.textContent = 'Upload failed: ' + e.message;
    uploadBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', async () => {
  stopBtn.disabled = true;
  try {
    await fetch('/api/stop-bot', { method: 'POST' });
    statusEl.textContent = 'Stopping...';
  } catch (e) {
    statusEl.textContent = 'Stop failed: ' + e.message;
  }
});

function startPolling() {
  if (pollInterval) clearInterval(pollInterval);
  pollInterval = setInterval(async () => {
    try {
      const t0 = performance.now();
      const res = await fetch('/api/status');
      const t1 = performance.now();
      const data = await res.json();
      pingEl.textContent = (t1 - t0).toFixed(0) + ' ms';
      statusEl.textContent = data.running ? 'Running' : 'Stopped';
      uptimeEl.textContent = data.uptime_str || '-';
      memEl.textContent = data.memory || '-';
      logsEl.textContent = (data.recent_logs || []).join('\n') + '\n' + logsEl.textContent;
      if (!data.running) {
        clearInterval(pollInterval);
        pollInterval = null;
        uploadBtn.disabled = false;
        stopBtn.disabled = true;
      }
    } catch (e) {
      console.error(e);
    }
  }, 2000);
}
