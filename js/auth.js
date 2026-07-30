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

async function manageManagers() {
  if (!isManager) return
  const action = prompt('Enter Discord ID to add (or -ID to remove):')
  if (!action) return
  if (action.startsWith('-')) {
    await supa.from('managers').delete().eq('discord_id', action.slice(1))
  } else {
    await supa.from('managers').insert({ discord_id: action, added_by: currentUser.discordId })
  }
  showToast('Done', 'success')
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
