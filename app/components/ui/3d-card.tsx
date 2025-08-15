"use client";
import { cn } from "@/lib/utils";
import React, {
    createContext,
    useState,
    useContext,
    useRef,
    useEffect,
} from "react";

const MouseEnterContext = createContext<{
    mouseX: number;
    mouseY: number;
    setMouseX: React.Dispatch<React.SetStateAction<number>>;
    setMouseY: React.Dispatch<React.SetStateAction<number>>;
}>({
    mouseX: 0,
    mouseY: 0,
    setMouseX: () => { },
    setMouseY: () => { },
});

export const CardContainer = ({
    children,
    className,
    containerClassName,
}: {
    children: React.ReactNode;
    className?: string;
    containerClassName?: string;
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [mouseX, setMouseX] = useState(0);
    const [mouseY, setMouseY] = useState(0);

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        setMouseX(e.clientX - rect.left);
        setMouseY(e.clientY - rect.top);
    };

    return (
        <MouseEnterContext.Provider value={{ mouseX, mouseY, setMouseX, setMouseY }}>
            <div
                className={cn("relative group/card", containerClassName)}
                onMouseMove={handleMouseMove}
                ref={containerRef}
            >
                <div className={cn("relative", className)}>{children}</div>
            </div>
        </MouseEnterContext.Provider>
    );
};

export const CardBody = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return <div className={cn("relative", className)}>{children}</div>;
};

export const CardItem = ({
    as: Tag = "div",
    children,
    className,
    translateX = 0,
    translateY = 0,
    translateZ = 0,
    rotateX = 0,
    rotateY = 0,
    rotateZ = 0,
    ...rest
}: {
    as?: React.ElementType;
    children: React.ReactNode;
    className?: string;
    translateX?: number | string;
    translateY?: number | string;
    translateZ?: number | string;
    rotateX?: number | string;
    rotateY?: number | string;
    rotateZ?: number | string;
    [key: string]: unknown;
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const { mouseX, mouseY } = useContext(MouseEnterContext);

    useEffect(() => {
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const rotateXValue = (mouseY - centerY) / 10;
        const rotateYValue = (mouseX - centerX) / 10;

        ref.current.style.transform = `perspective(1000px) rotateX(${rotateXValue}deg) rotateY(${rotateYValue}deg) translateX(${translateX}px) translateY(${translateY}px) translateZ(${translateZ}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg)`;
    }, [mouseX, mouseY, translateX, translateY, translateZ, rotateX, rotateY, rotateZ]);

    return (
        <Tag
            ref={ref}
            className={cn("transition-transform duration-200 ease-linear", className)}
            {...rest}
        >
            {children}
        </Tag>
    );
};
