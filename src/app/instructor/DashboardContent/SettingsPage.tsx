// src/app/instructor/DashboardContent/SettingsPage.tsx
import React from 'react'

const SettingsPage = () => (
    <div className="page-content">
        <h1 className="page-title">Settings</h1>
        <div className="settings-section">
            <h2>Profile Settings</h2>
            <div className="settings-form">
                <div className="form-group">
                    <label>Full Name</label>
                    <input type="text" defaultValue="Dr. Iman" />
                </div>
                <div className="form-group">
                    <label>Email</label>
                    <input type="email" defaultValue="iman@levelupedu.com" />
                </div>
                <div className="form-group">
                    <label>Department</label>
                    <input
                        type="text"
                        defaultValue="Computer Information Technology"
                    />
                </div>
                <button className="save-btn">Save</button>
            </div>
        </div>
    </div>
)

export default SettingsPage
