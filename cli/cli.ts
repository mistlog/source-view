#!/usr/bin/env node
import * as program from "commander";
import { resolve, join } from "path";
import { lstatSync } from "fs";
import { GenerateDocument, GenerateDocumentWatch } from "./utility";
import { readJsonSync } from "fs-extra";

const package_json = readJsonSync(resolve(__dirname, "../../package.json"));
program.version(package_json.version)
program.option("-w, --watch", "generate document in watch mode");
program.parse(process.argv);

const args = program.args;

if (args.length === 0)
{
    program.help();
}
else
{
    const working_directory = process.cwd();
    const [target] = args;
    if (target)
    {
        const path = resolve(working_directory, target);
        const output_path = join(working_directory, "source-view");
        if (lstatSync(path).isDirectory())
        {
            program.watch ? GenerateDocumentWatch(path, output_path) : GenerateDocument(path, output_path);
        }
    }
}