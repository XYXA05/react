// src/StatisticsDisplay.js
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './StatisticsDisplay.css'

const API_URL = 'https://79cf-217-31-72-114.ngrok-free.app'

// Якщо потрібно змінити відповідність ролей → модулі, правте тут.
const roleModulesMap = {
  store:                      ['store'],
  store_leader:               ['store'],
  design:                     ['design'],
  design_leader:              ['design'],
  repair_construction:        ['renovation'],
  repair_construction_leader: ['renovation'],
  cliner:                     ['cleaning'],
  cliner_leader:              ['cleaning'],
  rieltor_media_buyer:        ['mediabuyer'],
  rieltor_media_buyer_leader: ['mediabuyer'],
  realtor:                    ['store','design','renovation','cleaning','mediabuyer'],
  team_leader:                ['store','design','renovation','cleaning','mediabuyer'],
}

// Трохи «людські» назви для кожного модуля
const moduleLabels = {
  store:      'Інтернет-магазин',
  design:     'Дизайн',
  renovation: 'Ремонт/Будівництво',
  cleaning:   'Клінінг',
  mediabuyer: 'MediaBuyer',
}

export default function StatisticsDisplay({ userType, token }) {
  const [allowedModules, setAllowedModules] = useState([])
  const [selectedModule, setSelectedModule] = useState('')
  const [stats, setStats]     = useState(null)
  const [loading, setLoading] = useState(false)

  // За замовчуванням беремо всі ключі з moduleLabels:
  const allModules = Object.keys(moduleLabels)

  // Коли змінюється userType — визначаємо, які саме модулі показувати
  useEffect(() => {
    let mods = []

    // Якщо це admin — даємо доступ до всіх
    if (userType === 'admin') {
      mods = allModules.slice()
    } else {
      // Шукаємо прямий збіг у roleModulesMap
      mods = roleModulesMap[userType] || []

      // Якщо «_leader»-версія (наприклад, "store_leader") не знайшлась, 
      // беремо базовий тип без суфіксу "_leader"
      if (mods.length === 0 && userType?.endsWith('_leader')) {
        const base = userType.replace(/_leader$/, '')
        mods = roleModulesMap[base] || []
      }
    }

    setAllowedModules(mods)
    setSelectedModule(mods[0] || '')
    setStats(null)

  }, [userType])

  // Коли обираємо новий модуль (або змінився токен) — тягнемо статистику
  useEffect(() => {
    if (!selectedModule) return

    setLoading(true)
    axios
      .get(`${API_URL}/statistics/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setStats(res.data)
      })
      .catch(err => {
        console.error(err)
        setStats(null)
      })
      .finally(() => setLoading(false))
  }, [selectedModule, token])

  return (
    <div className="statistics-container">
      <h3>📊 Статистика</h3>

      {allowedModules.length === 0 ? (
        <p>У вас немає доступу до статистики.</p>
      ) : (
        <>
          <label className="module-select">
            Оберіть модуль:{' '}
            <select
              value={selectedModule}
              onChange={e => setSelectedModule(e.target.value)}
            >
              {allowedModules.map(m => (
                <option key={m} value={m}>
                  {moduleLabels[m] || m}
                </option>
              ))}
            </select>
          </label>

          {loading ? (
            <p>Завантаження…</p>
          ) : stats ? (
            <div className="stats-block">
              {selectedModule === 'mediabuyer' ? (
                <>
                  <h4>Клієнти</h4>
                  <p>🔑 Оренда: {stats.clients_rental}</p>
                  <p>🏠 Продаж: {stats.clients_sale}</p>
                  <p>📦 Інші: {stats.clients_other}</p>

                  <h4>💰 ЗАРОБІТОК</h4>
                  <p>За день: {stats.earnings_day?.toFixed(2)} $</p>
                  <p>За тиждень: {stats.earnings_week?.toFixed(2)} $</p>
                  <p>За місяць: {stats.earnings_month?.toFixed(2)} $</p>
                  <p>Всього: {stats.earnings_total?.toFixed(2)} $</p>
                </>
              ) : ['store', 'cleaning'].includes(selectedModule) ? (
                <>
                  <p>📦 Всього: {stats.total}</p>
                  <p>⏳ Очікують: {stats.pending}</p>
                  <p>⚙️ В обробці: {stats.processing}</p>
                  <p>✅ Завершено: {stats.completed}</p>
                </>
              ) : ['design', 'renovation'].includes(selectedModule) ? (
                <p>📋 Всього проєктів: {stats.total_projects}</p>
              ) : (
                <pre>{JSON.stringify(stats, null, 2)}</pre>
              )}
            </div>
          ) : (
            <p>Статистика відсутня.</p>
          )}
        </>
      )}
    </div>
  )
}
