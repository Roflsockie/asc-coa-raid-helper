let raidData = null
let signups = []
let mySignup = null
let selectedRole = null

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkAuth()

    var raidId = new URLSearchParams(window.location.search).get('id')
    if (!raidId) raidId = sessionStorage.getItem('raidId')
    if (!raidId) {
      document.getElementById('not-found').classList.remove('hidden')
      return
    }

    if (!supabaseReady()) {
      document.getElementById('raid-content').classList.add('hidden')
      document.getElementById('not-found').classList.remove('hidden')
      document.getElementById('not-found').querySelector('h3').textContent = 'Configure Supabase'
      return
    }

    const { data, error } = await supa.from('raids').select('*').eq('id', raidId).single()
    if (error || !data) {
      document.getElementById('raid-content').classList.add('hidden')
      document.getElementById('not-found').classList.remove('hidden')
      return
    }

    raidData = data
    document.getElementById('raid-title').textContent = data.title
    document.getElementById('raid-meta').innerHTML =
      '<span>📅 <strong>' + data.date + '</strong> at <strong>' + data.time + '</strong></span>' +
      '<span class="raid-card-status status-' + data.status + '">' + data.status + '</span>' +
      '<span>👤 by <strong>' + escapeHtml(data.created_by_name || 'Unknown') + '</strong></span>'
    document.getElementById('raid-description').textContent = data.description || 'No description.'

    const loadingEl = document.querySelector('#raid-content > .loading')
    if (loadingEl) loadingEl.remove()

    await loadSignups(raidId)
    renderRoster()
    renderActions(raidId)
    setupSignupForm()
    listenChanges(raidId)

  } catch (e) {
    console.error(e)
    showToast('Error loading raid', 'error')
  }
  hideLoader()
})

async function loadSignups(raidId) {
  const { data } = await supa
    .from('signups')
    .select('*')
    .eq('raid_id', raidId)
    .order('signed_at', { ascending: true })

  signups = data || []
  mySignup = currentUser ? signups.find(s => s.discord_id === currentUser.discordId) : null
}

function renderRoster() {
  const roles = [
    { id: 'tank', label: '🛡️ Tanks', color: '#4a9eff' },
    { id: 'healer', label: '💚 Healers', color: '#22c55e' },
    { id: 'melee', label: '⚔️ Melee DPS', color: '#ef4444' },
    { id: 'range', label: '🏹 Range DPS', color: '#eab308' }
  ]

  const limits = {
    tank: raidData.tank_limit || 0,
    healer: raidData.healer_limit || 0,
    melee: raidData.melee_limit || 0,
    range: raidData.range_limit || 0
  }

  document.getElementById('roster-grid').innerHTML = roles.map(r => {
    const entries = signups.filter(s => s.role === r.id)
    const count = entries.length
    const full = limits[r.id] > 0 && count >= limits[r.id]

    return '<div class="roster-column" style="border-color:' + r.color + '33">' +
      '<div class="roster-column-header" style="color:' + r.color + '">' +
        '<span>' + r.label + '</span>' +
        '<span class="count">' + count + (limits[r.id] > 0 ? '/' + limits[r.id] : '') + '</span>' +
      '</div>' +
      (full ? '<div style="text-align:center;font-size:0.75rem;color:var(--danger);font-weight:600">FULL</div>' : '') +
      (entries.length === 0
        ? '<div class="roster-empty">— empty —</div>'
        : entries.map(s => {
            const color = CLASS_COLOR_MAP[s.class] || '#888'
            const own = currentUser && s.discord_id === currentUser.discordId
            const canRemove = isManager || own
            return '<div class="roster-entry">' +
              '<span class="class-dot" style="background:' + color + '"></span>' +
              '<span class="char-name" style="color:' + color + '">' + escapeHtml(s.character_name) + (own ? ' (you)' : '') + '</span>' +
              '<span class="char-spec">' + escapeHtml(s.spec) + '</span>' +
              '<span class="char-class" style="color:' + color + '">' + escapeHtml(s.class) + '</span>' +
              (canRemove ? '<div class="entry-actions"><button class="btn btn-sm btn-danger" onclick="removeSignup(' + s.id + ')" style="padding:2px 8px;font-size:0.75rem">✕</button></div>' : '') +
            '</div>'
          }).join('')
      ) +
    '</div>'
  }).join('')
}

function renderActions(raidId) {
  const actions = document.getElementById('raid-actions')
  actions.innerHTML = ''

  if (!isManager || raidData.status !== 'active') return

  const cancel = document.createElement('button')
  cancel.className = 'btn btn-danger btn-sm'
  cancel.textContent = 'Cancel Raid'
  cancel.onclick = () => setStatus(raidId, 'cancelled')
  actions.appendChild(cancel)

  const complete = document.createElement('button')
  complete.className = 'btn btn-sm'
  complete.textContent = 'Mark Completed'
  complete.onclick = () => setStatus(raidId, 'completed')
  actions.appendChild(complete)

  if (signups.length > 0) {
    const clear = document.createElement('button')
    clear.className = 'btn btn-danger btn-sm'
    clear.textContent = 'Clear All'
    clear.onclick = () => clearAll(raidId)
    actions.appendChild(clear)
  }
}

function setupSignupForm() {
  const section = document.getElementById('signup-section')
  if (!currentUser || !raidData || raidData.status !== 'active') {
    section.classList.add('hidden')
    return
  }
  section.classList.remove('hidden')

  const form = document.getElementById('signup-form')
  const already = document.getElementById('already-signed')

  if (mySignup) {
    form.classList.add('hidden')
    already.classList.remove('hidden')
    document.getElementById('signed-character').textContent =
      mySignup.character_name + ' (' + mySignup.class + ' - ' + mySignup.spec + ')'
    return
  }

  form.classList.remove('hidden')
  already.classList.add('hidden')

  const classSel = document.getElementById('class-select')
  classSel.innerHTML = '<option value="">— Select Class —</option>' +
    CLASS_LIST.map(c => '<option value="' + c.name + '">' + c.name + '</option>').join('')

  const specSel = document.getElementById('spec-select')
  specSel.innerHTML = '<option value="">— Select Spec —</option>'

  classSel.onchange = function () {
    const specs = getClassSpecs(this.value) || []
    specSel.innerHTML = specs.length
      ? specs.map(s => '<option value="' + s + '">' + s + '</option>').join('')
      : '<option value="">— Select Spec —</option>'
  }

  selectedRole = null
  document.getElementById('role-selector').innerHTML = ROLES.map(r => {
    const limit = raidData[r.id + '_limit'] || 0
    const count = signups.filter(s => s.role === r.id).length
    const full = limit > 0 && count >= limit
    return '<div class="role-option role-' + r.id + (full ? ' role-full' : '') + '" data-role="' + r.id + '" onclick="' + (full ? '' : "pickRole('" + r.id + "')") + '">' +
      '<span class="role-icon">' + r.icon + '</span>' + r.label +
      (limit > 0 ? '<br><small>' + count + '/' + limit + '</small>' : '') +
      (full ? '<br><small style="color:var(--danger)">FULL</small>' : '') +
    '</div>'
  }).join('')
}

function pickRole(id) {
  selectedRole = id
  document.querySelectorAll('.role-option').forEach(el => {
    el.classList.toggle('selected', el.dataset.role === id)
  })
}

async function handleSignup() {
  const name = document.getElementById('char-name').value.trim()
  const cls = document.getElementById('class-select').value
  const spec = document.getElementById('spec-select').value
  const role = selectedRole

  if (!name) { showToast('Enter character name', 'error'); return }
  if (!cls) { showToast('Select a class', 'error'); return }
  if (!spec) { showToast('Select a specialization', 'error'); return }
  if (!role) { showToast('Select a role', 'error'); return }

  const limit = raidData[role + '_limit']
  const count = signups.filter(s => s.role === role).length
  if (limit > 0 && count >= limit) { showToast('Role is full!', 'error'); return }

  const { error } = await supa.from('signups').insert({
    raid_id: raidData.id,
    discord_id: currentUser.discordId,
    discord_name: currentUser.discordName,
    character_name: name,
    class: cls,
    spec: spec,
    role: role
  })

  if (error) {
    showToast(error.code === '23505' ? 'Already signed up!' : error.message, 'error')
    return
  }

  showToast('Signed up as ' + name, 'success')
  await loadSignups(raidData.id)
  renderRoster()
  setupSignupForm()
}

async function handleUnsign() {
  if (!mySignup) return
  if (!confirm('Unsign ' + mySignup.character_name + '?')) return

  await supa.from('signups').delete().eq('id', mySignup.id)
  mySignup = null
  await loadSignups(raidData.id)
  renderRoster()
  setupSignupForm()
}

async function removeSignup(id) {
  const s = signups.find(x => x.id === id)
  if (!s) return
  const own = currentUser && s.discord_id === currentUser.discordId
  if (!own && !isManager) return
  if (!confirm(own ? 'Unsign?' : 'Remove ' + s.character_name + '?')) return

  await supa.from('signups').delete().eq('id', id)
  if (own) mySignup = null
  await loadSignups(raidData.id)
  renderRoster()
  setupSignupForm()
}

async function setStatus(raidId, status) {
  if (!confirm('Mark as ' + status + '?')) return
  await supa.from('raids').update({ status }).eq('id', raidId)
  raidData.status = status
  showToast('Raid ' + status, 'info')
  renderActions(raidId)
  renderRoster()
  setupSignupForm()
}

async function clearAll(raidId) {
  if (!confirm('Clear all signups?')) return
  await supa.from('signups').delete().eq('raid_id', raidId)
  mySignup = null
  await loadSignups(raidId)
  renderRoster()
  renderActions(raidId)
  setupSignupForm()
}

function listenChanges(raidId) {
  supa.channel('raid-' + raidId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'signups', filter: 'raid_id=eq.' + raidId },
      async () => { await loadSignups(raidId); renderRoster(); setupSignupForm() })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'raids', filter: 'id=eq.' + raidId },
      async () => { location.reload() })
    .subscribe()
}
