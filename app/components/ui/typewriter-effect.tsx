"use client";
import { cn } from "@/lib/utils";
import { motion, stagger, useAnimate } from "framer-motion";
import { useEffect } from "react";

export const TypewriterEffect = ({
    words,
    className,
    cursorClassName,
}: {
    words: {
        text: string;
        className?: string;
    }[];
    className?: string;
    cursorClassName?: string;
}) => {
    const [scope, animate] = useAnimate();
    const wordsArray = words.map((word, idx) => {
        return {
            ...word,
            id: idx,
        };
    });

    useEffect(() => {
        animate(
            "span",
            {
                opacity: 1,
            },
            {
                duration: 0.3,
                delay: stagger(0.1),
            }
        );
    }, [animate]);

    const renderWords = () => {
        return (
            <motion.div ref={scope}>
                {wordsArray.map((word, idx) => {
                    return (
                        <div key={`word-${idx}`} className="inline-block">
                            {word.text.split("").map((char, index) => (
                                <motion.span
                                    initial={{}}
                                    key={`char-${index}`}
                                    className={cn(
                                        `text-white opacity-0`,
                                        word.className
                                    )}
                                >
                                    {char}
                                </motion.span>
                            ))}
                            &nbsp;
                        </div>
                    );
                })}
            </motion.div>
        );
    };

    return (
        <div className={cn("text-base sm:text-xl", className)}>
            {renderWords()}
            <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0,
                    repeat: Infinity,
                    repeatType: "reverse",
                }}
                className={cn(
                    "inline-block rounded-sm w-[4px] h-4 sm:h-6 bg-blue-500",
                    cursorClassName
                )}
            />
        </div>
    );
};
