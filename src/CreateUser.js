import React, { useState } from 'react';
import axios from 'axios';

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('realtor');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Choose endpoint based on userType
      const endpoint = userType === 'realtor' ? 'http://127.0.0.1:8000/register/realtor' : 'http://127.0.0.1:8000/register/team_leader';
      const payload = { username, password, name };
      const response = await axios.post(endpoint, payload);
      setMessage(`User ${response.data.username} created successfully!`);
      // Clear form if needed
      setUsername('');
      setPassword('');
      setName('');
    } catch (error) {
      console.error(error);
      setMessage('Error creating user: ' + error.response?.data.detail || error.message);
    }
  };

  return (
    <div>
      <h1>Create New User</h1>
      <form onSubmit={handleSubmit}>
         <div>
            <label>Username:</label>
            <input 
              type="text" 
              value={username} 
              onChange={(e)=>setUsername(e.target.value)} 
              required 
            />
         </div>
         <div>
            <label>Password:</label>
            <input 
              type="password" 
              value={password} 
              onChange={(e)=>setPassword(e.target.value)} 
              required 
            />
         </div>
         <div>
            <label>Name:</label>
            <input 
              type="text" 
              value={name} 
              onChange={(e)=>setName(e.target.value)} 
            />
         </div>
         <div>
            <label>User Type:</label>
            <select 
              value={userType} 
              onChange={(e)=>setUserType(e.target.value)}
            >
                <option value="realtor">Realtor</option>
                <option value="team_leader">Team Leader</option>
            </select>
         </div>
         <button type="submit">Create User</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};
export default CreateUser;
