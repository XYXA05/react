// src/CreateUser.js
import React, { useState } from 'react';

const CreateUser = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    type: 'realtor',
    profile_picture1: '',
    profile_picture2: '',
    quote: '',
    team_leader_id: ''
  });
  const [errors, setErrors] = useState({});

  const validate = () => {
    const errors = {};
    if (!formData.username || formData.username.length < 4) {
      errors.username = 'Username must be at least 4 characters';
    }
    if (!formData.password || formData.password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    return errors;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length !== 0) {
      setErrors(validationErrors);
      return;
    }
    try {
      const res = await fetch('http://127.0.0.1:8000/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        console.log('User created successfully');
        setFormData({
          username: '',
          password: '',
          name: '',
          type: 'realtor',
          profile_picture1: '',
          profile_picture2: '',
          quote: '',
          team_leader_id: ''
        });
      } else {
        console.error('Error creating user');
      }
    } catch (error) {
      console.error('Error creating user', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="container">
      <h2 className="animated-heading">Create User</h2>
      <form onSubmit={onSubmit}>
        <div>
          <label htmlFor="username">Username</label>
          <input id="username" name="username" value={formData.username} onChange={handleChange} required />
          {errors.username && <div style={{ color: 'red' }}>{errors.username}</div>}
        </div>
        <div>
          <label htmlFor="password">Password</label>
          <input id="password" type="password" name="password" value={formData.password} onChange={handleChange} required autoComplete="current-password" />
          {errors.password && <div style={{ color: 'red' }}>{errors.password}</div>}
        </div>
        <div>
          <label htmlFor="name">Name</label>
          <input id="name" name="name" value={formData.name} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="type">Type</label>
          <input id="type" name="type" value={formData.type} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="profile_picture1">Profile Picture 1</label>
          <input id="profile_picture1" name="profile_picture1" value={formData.profile_picture1} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="profile_picture2">Profile Picture 2</label>
          <input id="profile_picture2" name="profile_picture2" value={formData.profile_picture2} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="quote">Quote</label>
          <input id="quote" name="quote" value={formData.quote} onChange={handleChange} />
        </div>
        <div>
          <label htmlFor="team_leader_id">Team Leader ID</label>
          <input id="team_leader_id" type="number" name="team_leader_id" value={formData.team_leader_id} onChange={handleChange} />
        </div>
        <button type="submit" disabled={Object.keys(errors).length > 0}>Create User</button>
      </form>
    </div>
  );
};

export default CreateUser;
