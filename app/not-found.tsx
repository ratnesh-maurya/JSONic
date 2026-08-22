import Link from "next/link";
import { TOOLS } from "@/lib/tools";

export default function NotFound() {
    return (
        <div className="mx-auto max-w-2xl px-4 py-20 text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">That page does not exist</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                The tool you were after may have moved. Every JSONic tool now lives at its own address:
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
                {TOOLS.map((tool) => (
                    <Link
                        key={tool.id}
                        href={`/${tool.slug}`}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-700 hover:border-indigo-400 hover:text-indigo-700 dark:border-gray-800 dark:text-gray-300 dark:hover:text-indigo-300"
                    >
                        {tool.icon} {tool.name}
                    </Link>
                ))}
            </div>
        </div>
    );
}
