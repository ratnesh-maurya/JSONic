"use client";

export const Footer = () => {
    return (
        <footer className="bg-gray-900/50 border-t border-gray-800 py-12">
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex flex-col md:flex-row items-center justify-between">
                    <div className="text-center md:text-left mb-4 md:mb-0">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">
                            JSONic
                        </h3>
                        <p className="text-gray-400 mt-2">
                            Lightweight and powerful JSON utility
                        </p>
                    </div>

                    <div className="flex flex-col items-center md:items-end space-y-2">
                        <p className="text-gray-400 text-sm">
                            Made with ❤️ by{" "}
                            <a
                                href="https://www.ratnesh-maurya.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 transition-colors font-medium cursor-pointer"
                            >
                                Ratnesh Maurya
                            </a>
                        </p>
                        <div className="flex space-x-4">
                            <a
                                href="https://github.com/ratnesh-maurya"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                GitHub
                            </a>
                            <a
                                href="https://x.com/ratnesh_maurya_"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Twitter
                            </a>
                            <a
                                href="https://www.ratnesh-maurya.com/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Portfolio
                            </a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-gray-800 mt-8 pt-8 text-center">
                    <p className="text-gray-500 text-sm">
                        © {new Date().getFullYear()} JSONic. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};
