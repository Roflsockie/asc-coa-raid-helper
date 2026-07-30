let supa = null

function initSupabase() {
  if (typeof window.supabase === 'undefined') return false
  if (!CONFIG.SUPABASE_URL || CONFIG.SUPABASE_URL.indexOf('your-project') !== -1) return false
  if (!CONFIG.SUPABASE_ANON_KEY || CONFIG.SUPABASE_ANON_KEY.indexOf('your-anon') !== -1) return false
  try {
    supa = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
    return true
  } catch (e) {
    return false
  }
}

function supabaseReady() {
  return supa !== null
}

initSupabase()

function hideLoader() {
  const el = document.getElementById('page-loader')
  if (el) el.classList.add('hidden')
}

window.addEventListener('error', hideLoader)

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function showToast(message, type) {
  const container = document.getElementById('toast-container')
  if (!container) return
  const toast = document.createElement('div')
  toast.className = 'toast toast-' + (type || 'info')
  toast.textContent = message
  container.appendChild(toast)
  setTimeout(() => toast.remove(), 4000)
}
