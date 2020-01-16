```typescript
export type ITraverseMethodCallback = (methods: Array<ClassMethod>, class_name: string) => void;
```

# Implementation

##  DSL

```typescript
<ExportClassCode /> +
    function constructor(this: ExportClassCode, node: ExportNamedDeclaration, path?: NodePath<ExportNamedDeclaration>) {
        this.m_Code = node;
        this.m_Path = path;
    };
```