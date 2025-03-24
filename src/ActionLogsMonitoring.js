import React, { useEffect, useState } from 'react';

const ActionLogsMonitoring = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search state for each column
  const [idFilter, setIdFilter] = useState("");
  const [userIdFilter, setUserIdFilter] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("");
  const [methodFilter, setMethodFilter] = useState("");
  const [pathFilter, setPathFilter] = useState("");
  const [queryParamsFilter, setQueryParamsFilter] = useState("");
  const [timestampFilter, setTimestampFilter] = useState("");

  const API_URL = "http://localhost:8000";

  // Fetch logs from the backend API
  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch(`${API_URL}/action_logs`);
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        const data = await response.json();
        setLogs(data);
        setFilteredLogs(data);
      } catch (err) {
        console.error("Error fetching logs:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  // Update filteredLogs whenever any filter or logs change
  useEffect(() => {
    const lowerCaseFilter = (str) => (str || "").toString().toLowerCase();
    const newFiltered = logs.filter(log => {
      const logId = log.id.toString();
      const logUserId = (log.user_id ?? "").toString();
      const logUserRole = log.user_role ?? "";
      const logMethod = log.method ?? "";
      const logPath = log.path ?? "";
      const logQueryParams = log.query_params ?? "";
      const logTimestamp = new Date(log.timestamp).toLocaleString();

      return (
        logId.includes(idFilter) &&
        lowerCaseFilter(logUserId).includes(userIdFilter.toLowerCase()) &&
        lowerCaseFilter(logUserRole).includes(userRoleFilter.toLowerCase()) &&
        lowerCaseFilter(logMethod).includes(methodFilter.toLowerCase()) &&
        lowerCaseFilter(logPath).includes(pathFilter.toLowerCase()) &&
        lowerCaseFilter(logQueryParams).includes(queryParamsFilter.toLowerCase()) &&
        lowerCaseFilter(logTimestamp).includes(timestampFilter.toLowerCase())
      );
    });
    setFilteredLogs(newFiltered);
  }, [logs, idFilter, userIdFilter, userRoleFilter, methodFilter, pathFilter, queryParamsFilter, timestampFilter]);

  if (loading) return <div>Loading logs...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div style={{ padding: "1rem" }}>
      <h1>Action Logs Monitoring</h1>
      <table style={{ width: "100%", borderCollapse: "collapse" }} border="1" cellPadding="8" cellSpacing="0">
        <thead>
          <tr>
            <th>ID</th>
            <th>User ID</th>
            <th>User Role</th>
            <th>Method</th>
            <th>Path</th>
            <th>Query Params</th>
            <th>Timestamp</th>
          </tr>
          <tr>
            <th>
              <input 
                type="text" 
                value={idFilter} 
                onChange={e => setIdFilter(e.target.value)} 
                placeholder="Search ID" 
                style={{ width: "90%" }}
              />
            </th>
            <th>
              <input 
                type="text" 
                value={userIdFilter} 
                onChange={e => setUserIdFilter(e.target.value)} 
                placeholder="Search User ID" 
                style={{ width: "90%" }}
              />
            </th>
            <th>
              <input 
                type="text" 
                value={userRoleFilter} 
                onChange={e => setUserRoleFilter(e.target.value)} 
                placeholder="Search Role" 
                style={{ width: "90%" }}
              />
            </th>
            <th>
              <input 
                type="text" 
                value={methodFilter} 
                onChange={e => setMethodFilter(e.target.value)} 
                placeholder="Search Method" 
                style={{ width: "90%" }}
              />
            </th>
            <th>
              <input 
                type="text" 
                value={pathFilter} 
                onChange={e => setPathFilter(e.target.value)} 
                placeholder="Search Path" 
                style={{ width: "90%" }}
              />
            </th>
            <th>
              <input 
                type="text" 
                value={queryParamsFilter} 
                onChange={e => setQueryParamsFilter(e.target.value)} 
                placeholder="Search Query Params" 
                style={{ width: "90%" }}
              />
            </th>
            <th>
              <input 
                type="text" 
                value={timestampFilter} 
                onChange={e => setTimestampFilter(e.target.value)} 
                placeholder="Search Timestamp" 
                style={{ width: "90%" }}
              />
            </th>
          </tr>
        </thead>
        <tbody>
          {filteredLogs.map(log => (
            <tr key={log.id}>
              <td>{log.id}</td>
              <td>{log.user_id || "N/A"}</td>
              <td>{log.user_role || "N/A"}</td>
              <td>{log.method}</td>
              <td>{log.path}</td>
              <td>{log.query_params || "-"}</td>
              <td>{new Date(log.timestamp).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredLogs.length === 0 && <p>No logs found matching the search criteria.</p>}
    </div>
  );
};

export default ActionLogsMonitoring;
