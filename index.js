#!/usr/bin/env node

import yaml from "js-yaml";
import { access, constants, readFileSync, writeFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import { extname } from "node:path";

function colorize(message, type)
{
    let color = "\x1B[33m";
    switch (type) {
        case "error":
            color = "\x1B[31m";
            break;
        case "success":
            color = "\x1B[32m";
            break;
    }

    return `${color}${message}\x1B[0m\n`;
}

if (process.argv.length !== 3) {
    process.stderr.write(colorize("Script waiting one and only one argument", "error"));
    process.exit(1);
}

const main = async () => {
    const projectDirectory = process.argv[2].replace(/\/$/, "");
    access(projectDirectory, constants.F_OK, err => {
        if (!err) {
            return;
        }

        process.stderr.write(colorize(`${projectDirectory} does not exist ${err}`, "error"));
    });

    try {
        const files = await readdir(projectDirectory, {
            encoding: "utf8",
            withFileTypes: true,
        });

        files.forEach(file => {
            if (!file.isFile()) {
                return;
            }

            const filename = projectDirectory + "/" + file.name;

            const extension = extname(filename);
            if ([".yaml", ".yml"].indexOf(extension) === -1) {
                process.stdout.write(colorize(`${filename} SKIPPED`));
                return;
            }

            try {
                const doc = yaml.load(readFileSync(filename, "utf8"));
                let yamlSorted = yaml.dump(doc, {
                    indent: 4,
                    sortKeys: true,
                    schema: yaml.JSON_SCHEMA,
                });

                yamlSorted = yamlSorted.replace(/^([^\s+])/gm, `\n$1`);
                yamlSorted = yamlSorted.replace(/^\n{2,}/gm, `\n`);

                writeFileSync(filename, yamlSorted.trim() + "\n");
            } catch (e) {
                const errorMessage = e instanceof Error ? e.message : e;
                process.stderr.write(colorize(`${filename} ERROR : \n${errorMessage}`, "error"));

                return;
            }

            process.stdout.write(colorize(`${filename} processed`, "success"))
        });
    } catch (e) {
        console.log(e);
    }
};

main();
