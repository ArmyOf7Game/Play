import React, { useEffect, useRef, ReactNode } from 'react';

interface HudPositionerProps {
    children: ReactNode;
}

const HudPositioner: React.FC<HudPositionerProps> = ({ children }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!containerRef.current) return;


        const hudElements = containerRef.current.querySelectorAll('[data-hud-position]');

        const updatePositions = () => {
            if (!containerRef.current) return;

            const containerRect = containerRef.current.getBoundingClientRect();
            const { width, height } = containerRect;

            hudElements.forEach((element) => {

                const el = element as HTMLElement;
                const position = el.getAttribute('data-hud-position')?.split(',') || [];

                if (position.length < 2) return;

                const xPercent = parseFloat(position[0]) / 100;
                const yPercent = parseFloat(position[1]) / 100;
                const widthPercent = parseFloat(position[2] || '10') / 100;

   
                const x = xPercent * width;
                const y = yPercent * height;
                const elementWidth = widthPercent * width;

                el.style.position = 'absolute';
                el.style.left = `${x}px`;
                el.style.top = `${y}px`;
                el.style.width = `${elementWidth}px`;
                el.style.zIndex = '10';
                el.style.pointerEvents = 'auto'; 
            });
        };

  
        window.addEventListener('resize', updatePositions);

    
        updatePositions();

      
        setTimeout(updatePositions, 100);

        return () => window.removeEventListener('resize', updatePositions);
    }, []);

    return (
        <div
            ref={containerRef}
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 5
            }}
        >
            {children}
        </div>
    );
};

export default HudPositioner;
