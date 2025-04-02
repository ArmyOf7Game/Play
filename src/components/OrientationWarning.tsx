import React from 'react';
import './OrientationWarning.css';

const OrientationWarning: React.FC = () => {
    return (
        <div className="orientation-warning">
            <div className="orientation-content">
                <div className="phone-icon">
                    <div className="phone-outline"></div>
                    <div className="rotate-arrow"></div>
                </div>
                <h2>Please Rotate Your Device</h2>
                <p>This game is designed for portrait mode only</p>
            </div>
        </div>
    );
};

export default OrientationWarning;