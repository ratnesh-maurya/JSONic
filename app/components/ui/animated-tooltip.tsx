"use client";


import { motion } from "framer-motion";
import { useState } from "react";

export const AnimatedTooltip = ({
    items,
    children,
}: {
    items: {
        id: number;
        name: string;
        designation: string;
        image: string;
    }[];
    children: React.ReactNode;
}) => {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    return (
        <div className="flex flex-row items-center justify-center mb-10 w-full">
            {items.map((item) => (
                <div
                    className="relative group block"
                    key={item.name}
                    onMouseEnter={() => setHoveredIndex(item.id)}
                    onMouseLeave={() => setHoveredIndex(null)}
                >
                    <motion.div
                        initial={false}
                        animate={{
                            scale: hoveredIndex === item.id ? 1 : 0.85,
                        }}
                        transition={{
                            duration: 0.3,
                        }}
                        className="relative"
                    >
                        {children}
                    </motion.div>
                    <AnimatePresence>
                        {hoveredIndex === item.id && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.3 }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                    scale: 1,
                                }}
                                exit={{
                                    opacity: 0,
                                    y: 10,
                                    scale: 0.3,
                                }}
                                transition={{
                                    duration: 0.3,
                                }}
                                className="absolute -top-16 -left-1/2 transform -translate-x-1/2 flex text-xs text-white flex-col items-center justify-center rounded-md bg-black z-50 shadow-xl px-4 py-2"
                            >
                                <div className="font-bold text-white relative z-10 text-xs">
                                    {item.name}
                                </div>
                                <div className="text-white text-xs">{item.designation}</div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            ))}
        </div>
    );
};

const AnimatePresence = ({ children }: { children: React.ReactNode }) => {
    return <>{children}</>;
};
