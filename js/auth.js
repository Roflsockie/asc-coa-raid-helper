var currentUser = null
var isManager = false

async function checkAuth() {
  if (!supabaseReady()) return

  const { data: { session } } = await supa.auth.getSession()

  if (session) {
    const meta = session.user.user_metadata || {}
    currentUser = {
      id: session.user.id,
      discordId: meta.provider_id || session.user.id,
      discordName: meta.full_name || meta.name || 'Unknown',
      avatar: meta.avatar_url || null,
      providerToken: session.provider_token
    }
    isManager = await checkManagerRole()
    updateUI()
  }
}

async function loginWithDiscord() {
  if (!supabaseReady()) {
    showToast('Supabase not configured.', 'error')
    return
  }

  await supa.auth.signInWithOAuth({
    provider: 'discord',
    options: {
      scopes: 'identify',
      redirectTo: window.location.origin + window.location.pathname
    }
  })
}

async function logout() {
  if (supa) await supa.auth.signOut()
  currentUser = null
  isManager = false
  window.location.reload()
}

async function checkManagerRole() {
  if (!currentUser) return false
  if (CONFIG.MANAGER_USER_IDS && CONFIG.MANAGER_USER_IDS.includes(currentUser.discordId)) return true
  try {
    const { data } = await supa.from('managers').select('discord_id').eq('discord_id', currentUser.discordId).maybeSingle()
    if (data) return true
  } catch {}
  return false
}

function toggleManagerPanel() {
  var panel = document.getElementById('manager-panel')
  if (!panel) return
  panel.classList.toggle('hidden')
  if (!panel.classList.contains('hidden')) renderManagerPanel()
}

async function renderManagerPanel() {
  if (!isManager) return
  var list = document.getElementById('manager-list')
  if (!list) return
  list.innerHTML = '<div class="loading"><div class="spinner"></div></div>'

  var { data: dbManagers } = await supa.from('managers').select('*')
  dbManagers = dbManagers || []

  var html = ''
  var configIds = CONFIG.MANAGER_USER_IDS || []

  configIds.forEach(function(id) {
    var initial = id.charAt(0)
    html += '<div class="manager-item">' +
      '<div class="manager-avatar">' + initial + '</div>' +
      '<div class="manager-info">' +
        '<div class="manager-id">' + id + '</div>' +
        '<div class="manager-source">Config</div>' +
      '</div>' +
      '<span style="font-size:0.75rem;color:var(--text-muted)">hardcoded</span>' +
    '</div>'
  })

  dbManagers.forEach(function(m) {
    var initial = m.discord_id.charAt(0)
    html += '<div class="manager-item">' +
      '<div class="manager-avatar">' + initial + '</div>' +
      '<div class="manager-info">' +
        '<div class="manager-id">' + m.discord_id + '</div>' +
        '<div class="manager-source">added by ID ' + m.added_by + '</div>' +
      '</div>' +
      '<button class="btn btn-danger btn-sm" onclick="removeManager(\'' + m.discord_id + '\')">✕</button>' +
    '</div>'
  })

  list.innerHTML = html || '<div style="text-align:center;padding:20px;color:var(--text-muted)">No managers added yet</div>'
}

async function addManager() {
  if (!isManager) return
  var input = document.getElementById('manager-input')
  var id = input ? input.value.trim() : ''
  if (!id) { showToast('Enter a Discord ID', 'error'); return }
  if (!/^\d+$/.test(id)) { showToast('ID must be digits only', 'error'); return }

  var { error } = await supa.from('managers').insert({
    discord_id: id,
    added_by: currentUser.discordId
  })
  if (error) {
    if (error.code === '23505') { showToast('This user is already a manager', 'error'); return }
    showToast('Error: ' + error.message, 'error')
    return
  }
  showToast('Manager added', 'success')
  if (input) input.value = ''
  await renderManagerPanel()
}

async function removeManager(id) {
  if (!isManager) return
  if (!confirm('Remove this manager?')) return
  var { error } = await supa.from('managers').delete().eq('discord_id', id)
  if (error) { showToast('Error: ' + error.message, 'error'); return }
  showToast('Manager removed', 'success')
  await renderManagerPanel()
}

function updateUI() {
  const loginBtn = document.getElementById('login-btn')
  const userInfo = document.getElementById('user-info')
  const createBtn = document.getElementById('create-raid-btn')

  if (currentUser) {
    if (loginBtn) loginBtn.classList.add('hidden')
    if (userInfo) {
      userInfo.classList.remove('hidden')
      const nameEl = userInfo.querySelector('.user-name')
      if (nameEl) nameEl.textContent = currentUser.discordName
      const idEl = userInfo.querySelector('.user-discord-id')
      if (idEl) idEl.textContent = 'ID: ' + currentUser.discordId
      const avatar = userInfo.querySelector('.user-avatar')
      if (avatar && currentUser.avatar) {
        avatar.src = currentUser.avatar.indexOf('http') === 0
          ? currentUser.avatar
          : 'https://cdn.discordapp.com/avatars/' + currentUser.discordId + '/' + currentUser.avatar + '.png'
      }
      const badge = userInfo.querySelector('.manager-badge')
      if (badge) badge.classList.toggle('hidden', !isManager)
      userInfo.setAttribute('data-id', currentUser.discordId)
    }
  } else {
    if (loginBtn) loginBtn.classList.remove('hidden')
    if (userInfo) userInfo.classList.add('hidden')
  }

  if (createBtn) {
    createBtn.classList.toggle('hidden', !currentUser || !isManager)
  }

  const mgrBtn = document.getElementById('manage-managers-btn')
  if (mgrBtn) mgrBtn.classList.toggle('hidden', !isManager)
}
