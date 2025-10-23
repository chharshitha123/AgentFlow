import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <div className="header">
        <h1>Dashboard</h1>
      </div>
      
      <div className="card">
        <h2>Welcome to MERN Assignment</h2>
        <p>This is the admin dashboard for managing agents and distributing lists.</p>
        
        <div style={{ marginTop: '2rem' }}>
          <h3>Features:</h3>
          <ul style={{ marginLeft: '1.5rem', marginTop: '0.5rem' }}>
            <li>Agent Management</li>
            <li>CSV Upload & Distribution</li>
            <li>List Management</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;