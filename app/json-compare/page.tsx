import type { Metadata } from "next";
import { ToolPage } from "@/app/components/shell/tool-page";
import { CompareWorkbench } from "@/app/components/tools/compare-workbench";
import { toolMetadata } from "@/lib/seo";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("json-compare")!;

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
    return (
        <ToolPage tool={tool}>
            <CompareWorkbench />
        </ToolPage>
    );
}
