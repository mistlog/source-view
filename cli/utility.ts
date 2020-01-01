import { readFileSync } from "fs";
import * as traverse from "filewalker";
import { CodeToMarkdown } from "../src/source-view";
import { outputFileSync, removeSync } from "fs-extra";
import { relative, join } from "path";
import * as watch from "node-watch";

export function GenerateDocument(source: string, target: string)
{
    removeSync(target);
    traverse(source).on("file", (relative: string, stats: object, absolute: string) =>
    {
        if (absolute.endsWith(".tsx"))
        {
            const code = readFileSync(absolute, "utf8");
            const markdown = CodeToMarkdown(code);
            const output = relative.replace(".tsx", ".md")
            outputFileSync(join(target, output), markdown);
        }
    }).walk();
}

export function GenerateDocumentWatch(source: string, target: string)
{
    GenerateDocument(source, target);

    //@ts-ignore
    watch(source, { recursive: true }, (event, path: string) =>
    {
        if (path.endsWith(".tsx"))
        {
            try
            {
                const code = readFileSync(path, "utf8");
                const markdown = CodeToMarkdown(code);
                const relative_path = relative(source, path);
                const target_path = join(target, relative_path).replace(".tsx", ".md");
                outputFileSync(target_path, markdown, "utf8");
                console.log(event, target_path);
            }
            catch (error)
            {
                console.log(error.message);
            }
        }
    });
}