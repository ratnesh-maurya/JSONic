import type { Metadata } from "next";
import { ToolPage } from "@/app/components/shell/tool-page";
import { Workbench } from "@/app/components/tools/workbench";
import { toolMetadata } from "@/lib/seo";
import { toolBySlug } from "@/lib/tools";

const tool = toolBySlug("json-to-xml")!;

export const metadata: Metadata = toolMetadata(tool);

export default function Page() {
    return (
        <ToolPage tool={tool}>
            <Workbench mode="xml" />
        </ToolPage>
    );
}
