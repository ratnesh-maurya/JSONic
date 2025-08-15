"use client";

export const StructuredData = () => {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "WebApplication",
                "@id": "https://jsonic.ratnesh-maurya.com/#webapp",
                "name": "JSONic",
                "description": "A powerful and lightweight utility designed to simplify working with JSON data. Format, validate, compare, and analyze JSON with our intelligent tools.",
                "url": "https://jsonic.ratnesh-maurya.com",
                "applicationCategory": "DeveloperApplication",
                "operatingSystem": "Web Browser",
                "browserRequirements": "Requires JavaScript",
                "offers": {
                    "@type": "Offer",
                    "price": "0",
                    "priceCurrency": "USD",
                    "availability": "https://schema.org/InStock"
                },
                "creator": {
                    "@type": "Person",
                    "name": "Ratnesh Maurya",
                    "url": "https://www.ratnesh-maurya.com/",
                    "sameAs": [
                        "https://github.com/ratnesh-maurya",
                        "https://x.com/ratnesh_maurya_"
                    ]
                },
                "featureList": [
                    "JSON Formatting and Pretty Printing",
                    "JSON Validation with Error Reporting",
                    "JSON Comparison and Diff Analysis",
                    "Interactive JSON Tree View",
                    "JSON Minification and Compression",
                    "JSONPath Query Execution",
                    "JSON to TypeScript Type Generation",
                    "Real-time JSON Processing"
                ],
                "screenshot": "https://jsonic.ratnesh-maurya.com/favicon.svg"
            },
            {
                "@type": "WebSite",
                "@id": "https://jsonic.ratnesh-maurya.com/#website",
                "url": "https://jsonic.ratnesh-maurya.com",
                "name": "JSONic",
                "description": "Lightweight JSON Utility for Developers",
                "publisher": {
                    "@type": "Person",
                    "name": "Ratnesh Maurya",
                    "url": "https://www.ratnesh-maurya.com/"
                },
                "potentialAction": {
                    "@type": "SearchAction",
                    "target": {
                        "@type": "EntryPoint",
                        "urlTemplate": "https://jsonic.ratnesh-maurya.com/?q={search_term_string}"
                    },
                    "query-input": "required name=search_term_string"
                }
            },
            {
                "@type": "Organization",
                "@id": "https://jsonic.ratnesh-maurya.com/#organization",
                "name": "JSONic",
                "url": "https://jsonic.ratnesh-maurya.com",
                "logo": {
                    "@type": "ImageObject",
                    "url": "https://jsonic.ratnesh-maurya.com/favicon.svg",
                    "width": 1200,
                    "height": 630
                },
                "sameAs": [
                    "https://github.com/ratnesh-maurya/JSONic"
                ],
                "founder": {
                    "@type": "Person",
                    "name": "Ratnesh Maurya",
                    "url": "https://www.ratnesh-maurya.com/"
                }
            },
            {
                "@type": "SoftwareApplication",
                "@id": "https://jsonic.ratnesh-maurya.com/#software",
                "name": "JSONic",
                "description": "A comprehensive JSON utility tool for formatting, validation, comparison, and analysis",
                "applicationCategory": "DeveloperApplication",
                "operatingSystem": "Web Browser",
                "softwareVersion": "1.0.0",
                "datePublished": "2024-12-19",
                "author": {
                    "@type": "Person",
                    "name": "Ratnesh Maurya",
                    "url": "https://www.ratnesh-maurya.com/"
                },
                "programmingLanguage": [
                    "TypeScript",
                    "JavaScript",
                    "React",
                    "Next.js"
                ],
                "requirements": "Modern web browser with JavaScript enabled",
                "isAccessibleForFree": true,
                "license": "https://opensource.org/licenses/MIT"
            }
        ]
    };

    return (
        <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData, null, 2) }}
        />
    );
};
