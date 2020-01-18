import { isTSTypeAliasDeclaration, isExportNamedDeclaration, isExpressionStatement, Node, File, isImportDeclaration, isEmptyStatement, Comment } from "@babel/types";
import generate from "@babel/generator";
import { parse } from "@babel/parser";
import * as prettier from "prettier/standalone";
import * as TypescriptParser from "prettier/parser-typescript";

export function CodeToMarkdown(code: string)
{
    return new SourceView(code).ToMarkdown();
}

interface IParagraph
{
    text: string;
    type: string;
    start: number;
}

class SourceView
{
    m_File: File;
    m_Document: Array<IParagraph>;
    m_CommentSet: Set<number>;

    constructor(code: string)
    {
        const with_semi = this.CodeWithSemi(code);
        this.m_File = parse(with_semi, { sourceType: "module", plugins: ["typescript", "jsx", "optionalChaining"] });
        this.m_Document = [];
        this.m_CommentSet = new Set<number>();
    }

    /**
     * add semi after interface declaration to avoid parse error:
     * eg.
     *      interface foo{}
     *      (add ; before it)<Foo> + function...
     */
    CodeWithSemi(raw: string)
    {
        const code = prettier.format(raw, {
            parser: "typescript",
            semi: false,
            plugins: [TypescriptParser] // babel bug: https://github.com/babel/babel/issues/8837
        });
        return code;
    }

    ToMarkdown(): string
    {
        //
        const body = this.m_File.program.body;
        body.forEach(each => this.NodeToMarkdown(each));

        //
        this.m_Document.sort((a, b) => a.start - b.start);
        const markdown = this.m_Document.map(paragraph =>
        {
            if (paragraph.type === "code")
            {
                return ["```typescript", paragraph.text, "```"].join("\r\n");
            }
            return paragraph.text;
        }).join("\r\n\r\n");
        return markdown;
    }

    AddToDocument(text: string, type: string, start: number)
    {
        if (this.m_CommentSet.has(start))
        {
            return;
        }

        this.m_CommentSet.add(start);
        this.m_Document.push({
            text: text.trim(),
            type,
            start
        });
    }

    NodeToMarkdown(node: Node)
    {
        //
        let leading = node.leadingComments;
        let trailing = node.trailingComments;

        //
        this.AddCommentsToDocument(leading);

        //
        node.leadingComments = [];
        node.trailingComments = [];

        if (!isImportDeclaration(node) && !isEmptyStatement(node))
        {
            /**
            * trailing comments were moved to expression after add semi by babel
            */
            if (isExpressionStatement(node) && !trailing)
            {
                trailing = node.expression.trailingComments;
                node.expression.trailingComments = [];
            }
            else if (isExportNamedDeclaration(node) && isTSTypeAliasDeclaration(node.declaration) && !trailing)
            {
                trailing = node.declaration.typeAnnotation.trailingComments;
                node.declaration.typeAnnotation.trailingComments = [];
            }

            const code = this.NodeToString(node);
            this.AddToDocument(code, "code", node.start);
        }

        //
        this.AddCommentsToDocument(trailing);
    }

    AddCommentsToDocument(comments: ReadonlyArray<Comment>)
    {
        comments?.forEach(each => this.AddToDocument(each.value, "markdown", each.start));
    }

    NodeToString(node: Node)
    {
        // minify it to handle new line around comment
        const raw = generate(node, {
            shouldPrintComment: comment => comment === "@ts-ignore" ? false : true,
            minified: true
            // add new line around comment
        }).code.replace(/\*\//g, "*/\r\n").
            replace(/\/\*/g, "\r\n\r\n/*").
            replace(/\/\//g, "\r\n\r\n//");

        const code = prettier.format(raw, {
            parser: "typescript",
            printWidth: 200,
            tabWidth: 4,
            plugins: [TypescriptParser]
        });
        return code;
    }
}