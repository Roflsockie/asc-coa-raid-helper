document.addEventListener('DOMContentLoaded', async () => {
  try {
    await checkAuth()

    if (!supabaseReady()) {
      document.getElementById('create-form').innerHTML =
        '<div class="empty-state"><div class="empty-icon">⚠️</div><h3>Configure Supabase</h3><p class="page-subtitle">Edit <code>js/config.js</code> first.</p></div>'
      return
    }

    if (!currentUser) {
      document.getElementById('create-form').classList.add('hidden')
      const msg = document.getElementById('not-manager')
      msg.classList.remove('hidden')
      msg.querySelector('h3').textContent = 'Login Required'
      msg.querySelector('.page-subtitle').textContent = 'Login with Discord first.'
      return
    }

    if (!isManager) {
      document.getElementById('create-form').classList.add('hidden')
      document.getElementById('not-manager').classList.remove('hidden')
      return
    }

    document.getElementById('date').value = new Date().toISOString().split('T')[0]
    document.getElementById('time').value = '20:00'

    document.getElementById('create-form').addEventListener('submit', async (e) => {
      e.preventDefault()

      const title = document.getElementById('title').value.trim()
      const date = document.getElementById('date').value

      if (!title) { showToast('Enter a title', 'error'); return }
      if (!date) { showToast('Select a date', 'error'); return }

      const { error } = await supa.from('raids').insert({
        title,
        description: document.getElementById('description').value.trim(),
        date,
        time: document.getElementById('time').value,
        tank_limit: parseInt(document.getElementById('tank_limit').value) || 0,
        healer_limit: parseInt(document.getElementById('healer_limit').value) || 0,
        melee_limit: parseInt(document.getElementById('melee_limit').value) || 0,
        range_limit: parseInt(document.getElementById('range_limit').value) || 0,
        created_by: currentUser.discordId,
        created_by_name: currentUser.discordName,
        status: 'active'
      })

      if (error) {
        showToast('Error: ' + error.message, 'error')
      } else {
        showToast('Raid created!', 'success')
        setTimeout(() => { window.location.href = 'index.html' }, 1000)
      }
    })
  } catch (e) {
    console.error(e)
    showToast('Failed to load page', 'error')
  }
  hideLoader()
})
