import React, { useState, useEffect } from 'react';
import { listsAPI } from '../services/api';

const Lists = () => {
  const [distributions, setDistributions] = useState([]);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [batchDetails, setBatchDetails] = useState(null);
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchDistributions();
  }, []);

  const fetchDistributions = async () => {
    try {
      const response = await listsAPI.getDistributions();
      setDistributions(response.data.distributions);
    } catch (error) {
      console.error('Error fetching distributions:', error);
    }
  };

  const fetchBatchDetails = async (batchId) => {
    try {
      const response = await listsAPI.getBatchDetails(batchId);
      setBatchDetails(response.data);
      setSelectedBatch(batchId);
    } catch (error) {
      console.error('Error fetching batch details:', error);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert('Please select a file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      await listsAPI.uploadCSV(formData);
      alert('File uploaded and distributed successfully!');
      setFile(null);
      // Reset file input
      e.target.reset();
      fetchDistributions();
    } catch (error) {
      alert(error.response?.data?.message || 'Error uploading file');
    } finally {
      setUploading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  return (
    <div>
      <div className="header">
        <h1>List Distribution</h1>
      </div>

      {/* File Upload Section */}
      <div className="card">
        <h3>Upload CSV File</h3>
        <form onSubmit={handleFileUpload}>
          <div className="file-upload">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              style={{ marginBottom: '1rem' }}
            />
            <p>Supported formats: CSV, XLSX, XLS</p>
            <p>Required columns: FirstName, Phone, Notes</p>
          </div>
          <button type="submit" className="btn" disabled={uploading || !file}>
            {uploading ? 'Uploading...' : 'Upload & Distribute'}
          </button>
        </form>
      </div>

      {/* Distributions List */}
      <div className="card">
        <h3>Distribution History</h3>
        {distributions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>File Name</th>
                <th>Total Records</th>
                <th>Uploaded By</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {distributions.map(dist => (
                <tr key={dist._id}>
                  <td>{dist.distributionBatch}</td>
                  <td>{dist.originalName}</td>
                  <td>{dist.totalRecords}</td>
                  <td>{dist.uploadedBy.name}</td>
                  <td>{new Date(dist.createdAt).toLocaleDateString()}</td>
                  <td>
                    <button 
                      className="btn"
                      onClick={() => fetchBatchDetails(dist.distributionBatch)}
                      style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }}
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p>No distributions found.</p>
        )}
      </div>

      {/* Batch Details */}
      {batchDetails && (
        <div className="card">
          <h3>Distribution Details: {batchDetails.batchId}</h3>
          <div style={{ marginBottom: '1rem' }}>
            <strong>Total Items: {batchDetails.totalItems}</strong>
          </div>
          
          {batchDetails.groupedByAgent.map(group => (
            <div key={group.agent._id} style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #ddd', borderRadius: '5px' }}>
              <h4>Agent: {group.agent.name} ({group.agent.email})</h4>
              <p><strong>Assigned Items: {group.items.length}</strong></p>
              
              <table className="table">
                <thead>
                  <tr>
                    <th>First Name</th>
                    <th>Phone</th>
                    <th>Notes</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {group.items.map(item => (
                    <tr key={item._id}>
                      <td>{item.firstName}</td>
                      <td>{item.phone}</td>
                      <td>{item.notes}</td>
                      <td>
                        <span style={{ 
                          padding: '0.25rem 0.5rem', 
                          borderRadius: '3px',
                          backgroundColor: item.status === 'pending' ? '#fff3cd' : '#d1edff',
                          color: item.status === 'pending' ? '#856404' : '#155724'
                        }}>
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Lists;