import { readFileSync, writeFileSync } from "fs";
import { CodeToMarkdown } from "../src/source-view";

describe("source view", () =>
{
    test("code and markdown", () =>
    {
        SnapshotTest("code-and-markdown");
    })

    test("exclude import", () =>
    {
        SnapshotTest("exclude-import");
    })

    test("exclude empty statement", () =>
    {
        SnapshotTest("exclude-empty-statement");
    })

    test("remove @ts-ignore", () =>
    {
        SnapshotTest("remove-tsignore");
    })

    test("handle comment", () =>
    {
        SnapshotTest("comment-order");
    })
})

/**
 * utility
 */

function SnapshotTest(name: string)
{

    const code = ReadInput(name);
    const markdown = CodeToMarkdown(code);
    WriteOutput(name, markdown);
    expect(markdown).toMatchSnapshot();
}

function WriteOutput(name: string, markdown: string)
{
    writeFileSync(`${__dirname}/common/output/${name}.md`, markdown);
}

function ReadInput(name: string)
{
    return readFileSync(`${__dirname}/common/input/${name}.tsx`, "utf8")
}