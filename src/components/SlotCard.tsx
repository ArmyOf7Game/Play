import React from 'react';
import './SlotCard.css';

interface SlotCardProps {
    filled: boolean;
    username?: string;
    address?: string;
    onClick?: () => void;
    children?: React.ReactNode;
    className?: string;
    customImage?: string;
    rank: 'captain' | 'caporal' | 'soldier';
}

export const SlotCard: React.FC<SlotCardProps> = ({ filled, username, address, children, onClick, className, customImage, rank }) => {
    return (
        <div className={`slot-card ${className || ''}`} onClick={onClick}>
            <div className="slot-content">
                <img
                    src={customImage || (filled ? `${import.meta.env.BASE_URL}slotcard.png` : `${import.meta.env.BASE_URL}empty_slotcard.png`)}
                    alt="Slot Frame"
                    className="slot-frame"
                />
                {filled && (
                    <div className="profile-container">
                        <img className="profile-circle" src={`https://robohash.org/set_set5/bgset_bg2/${address}?size=100x100`} />
                        <p className="Username">{username}</p>
                        {/* Add this line for debugging */}
                        <p style={{ fontSize: '8px' }}>{`${import.meta.env.BASE_URL}ranks/${rank}_rnk.svg`}</p>
                        <img
                            src={`${import.meta.env.BASE_URL}ranks/${rank}_rnk.svg`}
                            alt={`${rank} rank`}
                            className={`${rank}-rank`}
                        />
                    </div>
                )}
                {children}
            </div>
        </div>
    );
};


