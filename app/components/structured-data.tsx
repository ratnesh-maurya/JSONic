"use client";

export const StructuredData = () => {
    const structuredData = {
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "Person",
                "@id": "https://ratnesh-maurya.com/#person",
                "name": "Ratnesh Maurya",
                "url": "https://ratnesh-maurya.com",
                "sameAs": [
                    "https://ratnesh-maurya.com",
                    "https://blog.ratnesh-maurya.com",
                    "https://github.com/ratnesh-maurya",
                    "https://x.com/ratnesh_maurya_"
                ],
                "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": "https://ratnesh-maurya.com"
                },
                "worksFor": {
                    "@type": "Organization",
                    "name": "Ratnesh Maurya"
                },
                "knowsAbout": ["TypeScript", "Go", "React", "Next.js", "JSON", "Web Development"],
                "hasCredential": {
                    "@type": "CreativeWork",
                    "name": "Technical Blog",
                    "url": "https://blog.ratnesh-maurya.com"
                }
            },
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
                "author": {
                    "@id": "https://ratnesh-maurya.com/#person"
                },
                "creator": {
                    "@id": "https://ratnesh-maurya.com/#person"
                },
                "featureList": [
                    "JSON Formatting and Pretty Printing",
                    "JSON Validation with Error Reporting",
                    "JSON Comparison and Diff Analysis",
                    "Interactive JSON Tree View",
                    "JSON Type Distribution Chart",
                    "JSON Minification and Compression",
                    "JSONPath Query Execution",
                    "JSON to TypeScript Type Generation",
                    "JSON to Go Struct Generation",
                    "Real-time JSON Processing"
                ],
                "screenshot": "https://jsonic.ratnesh-maurya.com/og.png",
                "relatedLink": [
                    "https://ratnesh-maurya.com",
                    "https://blog.ratnesh-maurya.com"
                ]
            },
            {
                "@type": "WebSite",
                "@id": "https://jsonic.ratnesh-maurya.com/#website",
                "url": "https://jsonic.ratnesh-maurya.com",
                "name": "JSONic",
                "description": "Lightweight JSON Utility for Developers",
                "publisher": {
                    "@id": "https://ratnesh-maurya.com/#person"
                },
                "author": {
                    "@id": "https://ratnesh-maurya.com/#person"
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
                    "url": "https://jsonic.ratnesh-maurya.com/favicon/android-icon-192x192.png",
                    "width": 192,
                    "height": 192
                },
                "sameAs": [
                    "https://github.com/ratnesh-maurya/JSONic"
                ],
                "founder": {
                    "@id": "https://ratnesh-maurya.com/#person"
                }
            },
            {
                "@type": "ItemList",
                "name": "JSONic Tools",
                "description": "Collection of JSON utility tools by Ratnesh Maurya",
                "numberOfItems": 7,
                "itemListElement": [
                    { "@type": "ListItem", "position": 1, "name": "JSON Tree View", "url": "https://jsonic.ratnesh-maurya.com/#tree-view" },
                    { "@type": "ListItem", "position": 2, "name": "JSON Comparer", "url": "https://jsonic.ratnesh-maurya.com/#comparer" },
                    { "@type": "ListItem", "position": 3, "name": "JSON Validator", "url": "https://jsonic.ratnesh-maurya.com/#validator" },
                    { "@type": "ListItem", "position": 4, "name": "JSON Formatter", "url": "https://jsonic.ratnesh-maurya.com/#formatter" },
                    { "@type": "ListItem", "position": 5, "name": "JSON Compressor", "url": "https://jsonic.ratnesh-maurya.com/#compressor" },
                    { "@type": "ListItem", "position": 6, "name": "JSONPath Query", "url": "https://jsonic.ratnesh-maurya.com/#jsonpath" },
                    { "@type": "ListItem", "position": 7, "name": "JSON to Go/TypeScript Types", "url": "https://jsonic.ratnesh-maurya.com/#types" }
                ]
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
                    "@id": "https://ratnesh-maurya.com/#person"
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
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Ratnesh Maurya – Portfolio",
                        "item": "https://ratnesh-maurya.com"
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Blog",
                        "item": "https://blog.ratnesh-maurya.com"
                    },
                    {
                        "@type": "ListItem",
                        "position": 3,
                        "name": "JSONic",
                        "item": "https://jsonic.ratnesh-maurya.com"
                    }
                ]
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
