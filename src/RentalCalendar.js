import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './CalendarView.css';
import { BASE_URL } from './ApartmentService';

/**
 * RentalCalendar accepts the following props:
 *  - propertyId: the record's ID for which the calendar is displayed.
 *  - category: a string indicating which calendar endpoint to use.
 *      For example:
 *         "Дизайн"             => calls `${BASE_URL}/design/calendar/{propertyId}/{year}/{month}`
 *         "Ремонт/Будівництво" => calls `${BASE_URL}/renovation/calendar/{propertyId}/{year}/{month}`
 *         "Клінінг"            => calls `${BASE_URL}/cleaning/calendar/{propertyId}/{year}/{month}`
 *         "Інтернет-магазин"   => calls `${BASE_URL}/store_calendar/{propertyId}/{year}/{month}`
 *  - onBack: a callback function that returns to the previous view.
 */
const RentalCalendar = ({ propertyId, category, onBack }) => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [calendarData, setCalendarData] = useState(null);
  const [error, setError] = useState('');
  
  // States for free days filter inputs.
  const [freeFrom, setFreeFrom] = useState('');
  const [freeTo, setFreeTo] = useState('');

  // Build the proper endpoint based on the category passed.
  const getEndpoint = () => {
    switch (category) {
      case 'Дизайн':
        return `${BASE_URL}/design/calendar/${propertyId}/${year}/${month}`;
      case 'Ремонт/Будівництво':
        return `${BASE_URL}/renovation/calendar/${propertyId}/${year}/${month}`;
      case 'Клінінг':
        return `${BASE_URL}/cleaning/calendar/${propertyId}/${year}/${month}`;
      case 'Інтернет-магазин':
        return `${BASE_URL}/store_calendar/${propertyId}/${year}/${month}`;
      default:
        return `${BASE_URL}/calendar/${propertyId}/${year}/${month}`;
    }
  };

  // Fetch calendar data from the backend.
  const fetchCalendar = async () => {
    if (!propertyId) return;
    try {
      const params = {};
      if (freeFrom) params.freeFrom = freeFrom;
      if (freeTo) params.freeTo = freeTo;
      const endpoint = getEndpoint();
      const res = await axios.get(endpoint, { params });
      setCalendarData(res.data);
      setError('');
    } catch (err) {
      console.error(err);
      setError('Failed to load calendar.');
    }
  };

  useEffect(() => {
    fetchCalendar();
  }, [propertyId, year, month, freeFrom, freeTo, category]);

  // Handlers for month navigation.
  const goToPrevMonth = () => {
    if (calendarData?.navigation?.prev) {
      setYear(calendarData.navigation.prev.year);
      setMonth(calendarData.navigation.prev.month);
    }
  };

  const goToNextMonth = () => {
    if (calendarData?.navigation?.next) {
      setYear(calendarData.navigation.next.year);
      setMonth(calendarData.navigation.next.month);
    }
  };

  // Handlers to add or remove busy days.
  const addBusyDay = async (day) => {
    try {
      await axios.post(`${BASE_URL}/busy_day/${propertyId}`, { day, month, year });
      fetchCalendar();
    } catch (err) {
      console.error(err);
      alert('Failed to add busy day.');
    }
  };

  const removeBusyDay = async (day) => {
    try {
      await axios.delete(`${BASE_URL}/busy_day/${propertyId}`, { data: { day, month, year } });
      fetchCalendar();
    } catch (err) {
      console.error(err);
      alert('Failed to remove busy day.');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchCalendar();
  };

  return (
    <div className="calendar-view">
      <button onClick={onBack} className="back-button">← Back to Properties List</button>
      <h3>
        Calendar for {category} (ID: {propertyId}) – {calendarData?.apartment?.title || ''}
      </h3>
      {error && <p className="error">{error}</p>}
      <form onSubmit={handleSearch} className="calendar-search">
        <div>
          <label htmlFor="freeFrom">Free Days From:</label>
          <input
            id="freeFrom"
            type="date"
            value={freeFrom}
            onChange={(e) => setFreeFrom(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="freeTo">Free Days To:</label>
          <input
            id="freeTo"
            type="date"
            value={freeTo}
            onChange={(e) => setFreeTo(e.target.value)}
          />
        </div>
        <button type="submit">Search</button>
      </form>
      {calendarData ? (
        <div>
          <div className="calendar-navigation">
            <button onClick={goToPrevMonth}>Previous Month</button>
            <span>
              {calendarData.navigation.current.month} / {calendarData.navigation.current.year}
            </span>
            <button onClick={goToNextMonth}>Next Month</button>
          </div>
          <table className="calendar-table">
            <thead>
              <tr>
                <th>Mon</th>
                <th>Tue</th>
                <th>Wed</th>
                <th>Thu</th>
                <th>Fri</th>
                <th>Sat</th>
                <th>Sun</th>
              </tr>
            </thead>
            <tbody>
              {calendarData.weeks.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  {week.map((cell, cellIndex) => (
                    <td key={cellIndex} className={cell.day === 0 ? 'empty' : (cell.busy ? 'busy' : 'free')}>
                      {cell.day !== 0 && (
                        <div className="day-cell">
                          <span>{cell.day}</span>
                          <div className="day-actions">
                            {cell.busy ? (
                              <button onClick={() => removeBusyDay(cell.day)}>Free</button>
                            ) : (
                              <button onClick={() => addBusyDay(cell.day)}>Busy</button>
                            )}
                          </div>
                        </div>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p>Loading calendar...</p>
      )}
    </div>
  );
};

export default RentalCalendar;
