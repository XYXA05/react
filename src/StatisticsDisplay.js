// src/StatisticsDisplay.js
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import './StatisticsDisplay.css'

const API_URL = 'http://localhost:8000'

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
  const [stats, setStats]                   = useState(null)
  const [loading, setLoading]               = useState(false)

  // figure out which modules this userType can see
  useEffect(() => {
    let mods = roleModulesMap[userType] || []
    if (mods.length === 0) {
      const base = userType?.replace(/_leader$/, '')
      mods = roleModulesMap[base] || []
    }
    setAllowedModules(mods)
    setSelectedModule(mods[0] || '')
    setStats(null)
  }, [userType])

  // fetch whenever selectedModule changes
  useEffect(() => {
    if (!selectedModule) return

    setLoading(true)
    axios
      .get(`${API_URL}/statistics/${selectedModule}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => setStats(res.data))
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
