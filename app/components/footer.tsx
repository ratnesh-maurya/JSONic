"use client";

export const Footer = () => {
    return (
        <footer className="bg-white/40 border-t border-gray-200/60 py-12 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            JSONic
                        </h3>
                        <p className="text-gray-600 mt-2 text-sm">
                            Lightweight and powerful JSON utility
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end space-y-2">
                        <p className="text-gray-600 text-sm">
                            Made with ❤️ by{" "}
                            <a
                                href="https://www.ratnesh-maurya.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-indigo-600 hover:text-indigo-700 transition-colors font-medium cursor-pointer"
                            >
                                Ratnesh Maurya
                            </a>
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://github.com/ratnesh-maurya"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer text-sm"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://x.com/ratnesh_maurya_"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer text-sm"
                            >
                                Twitter
                            </a>
                            <a
                                href="https://www.ratnesh-maurya.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-600 hover:text-gray-900 transition-colors cursor-pointer text-sm"
                            >
                                Portfolio
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-200/60 mt-8 pt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} JSONic. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
