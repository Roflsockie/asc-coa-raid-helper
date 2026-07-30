document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkAuth()
    if (supabaseReady()) {
      await loadRaids()
      listenRaids()
    } else {
      document.getElementById('raid-list').innerHTML =
        '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Configure Supabase</h3><p class="page-subtitle">Edit <code>js/config.js</code> with your project details.</p></div>'
    }
  } catch (e) {
    console.error(e)
    document.getElementById('raid-list').innerHTML =
      '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Something went wrong</h3><p class="page-subtitle">Check the console for details.</p></div>'
  }
  hideLoader()
})

async function loadRaids() {
  const { data: raids, error: raidErr } = await supa
    .from('raids')
    .select('*')
    .order('date', { ascending: true })
    .order('time', { ascending: true })

  if (raidErr) throw raidErr

  const container = document.getElementById('raid-list')
  const empty = document.getElementById('empty-state')

  if (!raids || raids.length === 0) {
    container.innerHTML = ''
    empty.classList.remove('hidden')
    return
  }

  empty.classList.add('hidden')

  const { data: signups } = await supa
    .from('signups')
    .select('raid_id, role')

  const counts = {}
  if (signups) {
    signups.forEach(s => {
      if (!counts[s.raid_id]) counts[s.raid_id] = { tank: 0, healer: 0, melee: 0, range: 0 }
      counts[s.raid_id][s.role]++
    })
  }

  container.onclick = function(e) {
    var card = e.target.closest('.raid-card')
    if (card) {
      sessionStorage.setItem('raidId', card.dataset.id)
      window.location.href = 'raid.html'
    }
  }

  container.innerHTML = raids.map(raid => {
    const c = counts[raid.id] || { tank: 0, healer: 0, melee: 0, range: 0 }
    const total = c.tank + c.healer + c.melee + c.range
    const active = raid.status === 'active'

    return '<div class="raid-card" data-id="' + raid.id + '">' +
        '<div class="raid-card-info">' +
          '<div class="raid-card-title">' + escapeHtml(raid.title) + '</div>' +
          '<div class="raid-card-meta">' +
            '<span>📅 ' + raid.date + ' at ' + raid.time + '</span>' +
            '<span>👥 ' + total + '</span>' +
            '<span class="raid-card-status status-' + raid.status + '">' + raid.status + '</span>' +
          '</div>' +
        '</div>' +
        '<div class="raid-card-stats">' +
          (active
            ? '<span class="stat-badge stat-tank ' + (c.tank >= raid.tank_limit ? 'stat-full' : '') + '">🛡️ ' + c.tank + '/' + raid.tank_limit + '</span>' +
              '<span class="stat-badge stat-healer ' + (c.healer >= raid.healer_limit ? 'stat-full' : '') + '">💚 ' + c.healer + '/' + raid.healer_limit + '</span>' +
              '<span class="stat-badge stat-melee ' + (c.melee >= raid.melee_limit ? 'stat-full' : '') + '">⚔️ ' + c.melee + '/' + raid.melee_limit + '</span>' +
              '<span class="stat-badge stat-range ' + (c.range >= raid.range_limit ? 'stat-full' : '') + '">🏹 ' + c.range + '/' + raid.range_limit + '</span>'
            : '') +
        '</div>' +
      '</div>'
  }).join('')
}

function listenRaids() {
  supa
    .channel('raid-list')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'raids' }, () => loadRaids())
    .on('postgres_changes', { event: '*', schema: 'public', table: 'signups' }, () => loadRaids())
    .subscribe()
}
