function OptionalChaining()
{
    const foo = { a: 1 } as any;
    const bar = foo?.a?.b;
}