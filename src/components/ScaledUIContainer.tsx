import React, { useRef, useEffect, useState, ReactNode } from 'react';

interface ScaledUIContainerProps {
    children: ReactNode;
    designWidth?: number;
    designHeight?: number;
}

const ScaledUIContainer: React.FC<ScaledUIContainerProps> = ({
    children,
    designWidth = 1080,
    designHeight = 1080
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState<number>(1);

    useEffect(() => {
        const updateScale = () => {
            if (containerRef.current) {
                const parent = containerRef.current.parentElement;
                if (!parent) return;

                const availableWidth = parent.clientWidth;
                const availableHeight = parent.clientHeight;

                const scaleX = availableWidth / designWidth;
                const scaleY = availableHeight / designHeight;
                const newScale = Math.min(scaleX, scaleY);

                setScale(newScale);
            }
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, [designWidth, designHeight]);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                width: designWidth,
                height: designHeight,
                transform: `scale(${scale})`,
                transformOrigin: 'top left',
                pointerEvents: 'auto',
                zIndex: 10, 
                top: 0,     
                left: 0     
            }}
        >
            {children}
        </div>
    );
};

export default ScaledUIContainer;
