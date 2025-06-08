import React, { useState } from 'react';
import axios from 'axios';

const CreateUser = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [userType, setUserType] = useState('realtor');
  const [message, setMessage] = useState('');
  const [chat_id, setChat_id] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Choose endpoint based on userType
      const endpoint = userType === 'realtor' ? 'https://79cf-217-31-72-114.ngrok-free.app/register/realtor' : 'https://79cf-217-31-72-114.ngrok-free.app/register/team_leader';
      const payload = { username, password, name, chat_id };
      const response = await axios.post(endpoint, payload);
      setMessage(`User ${response.data.username} created successfully!`);
      // Clear form if needed
      setUsername('');
      setPassword('');
      setName('');
      setChat_id('');
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

                <option value="rieltor_media_buyer">Media buyer</option>
                <option value="rieltor_media_buyer_leader">Media buyer TeamLeader</option>

                <option value="cliner">Cliner</option>
                <option value="cliner_leader">Clener TeamLeader</option>

                <option value="design">Design</option>
                <option value="design_leader">Design TeamLeader</option>

                <option value="store">Store</option>
                <option value="store_leader">Store TeamLeader</option>

                <option value="repair_construction">Repair/Construction</option>
                <option value="repair_construction_leader">Repair/Construction TeamLeader</option>
            </select>
         </div>
         <div>
            <label>Chat_id Tg:</label>
            <input 
              type="text" 
              value={chat_id} 
              onChange={(e)=>setChat_id(e.target.value)} 
            />
         </div>
         <button type="submit">Create User</button>
      </form>
      {message && <p>{message}</p>}
    </div>
  );
};
export default CreateUser;
