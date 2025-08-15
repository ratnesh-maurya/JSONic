"use client";
import { useEffect } from "react";
import { motion, stagger, useAnimate } from "framer-motion";
import { cn } from "@/lib/utils";

export const TextGenerateEffect = ({
    words,
    className,
}: {
    words: string;
    className?: string;
}) => {
    const [scope, animate] = useAnimate();
    const wordsArray = words.split("");

    useEffect(() => {
        animate(
            "span",
            {
                opacity: 1,
            },
            {
                duration: 2,
                delay: stagger(0.2),
            }
        );
    }, [animate]);

    const renderWords = () => {
        return (
            <motion.div ref={scope}>
                {wordsArray.map((char, idx) => {
                    return (
                        <motion.span
                            key={char + idx}
                            className="text-white opacity-0"
                        >
                            {char}
                        </motion.span>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={cn("font-bold", className)}>
            <div className="mt-4">
                <div className="text-white text-2xl leading-snug tracking-wide">
                    {renderWords()}
                </div>
            </div>
        </div>
    );
};
