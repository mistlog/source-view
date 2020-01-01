import { isExpressionStatement, Node, File, isImportDeclaration, isEmptyStatement, Comment } from "@babel/types";
import generate from "@babel/generator";
import { parse } from "@babel/parser";
import * as sha256 from "sha256";
import * as prettier from "prettier";

export function CodeToMarkdown(code: string)
{
    return new SourceView(code).ToMarkdown();
}

interface IParagraph
{
    text: string;
    type: string;
}

class SourceView
{
    m_File: File;
    m_Document: Array<IParagraph>;
    m_ParagraphSet: Set<string>;

    constructor(code: string)
    {
        const with_semi = this.CodeWithSemi(code);
        this.m_File = parse(with_semi, { sourceType: "module", plugins: ["typescript", "jsx"] });
        this.m_Document = [];
        this.m_ParagraphSet = new Set<string>();
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
            semi: false
        });

        return code;
    }

    ToMarkdown(): string
    {
        const body = this.m_File.program.body;
        body.forEach(each => this.NodeToMarkdown(each));
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

    AddToDocument(text: string, type: string)
    {
        const hash = sha256(text);
        if (this.m_ParagraphSet.has(hash))
        {
            return;
        }

        this.m_ParagraphSet.add(hash);
        this.m_Document.push({
            text: text.trim(),
            type
        });
    }

    NodeToMarkdown(node: Node)
    {
        //
        const leading = node.leadingComments;
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
            
            const code = this.NodeToString(node);
            this.AddToDocument(code, "code");
        }

        //
        this.AddCommentsToDocument(trailing);
    }

    AddCommentsToDocument(comments: ReadonlyArray<Comment>)
    {
        comments && comments.
            map(each => each.value).
            forEach(each => this.AddToDocument(each, "markdown"));
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
            tabWidth: 4
        });
        return code;
    }
}