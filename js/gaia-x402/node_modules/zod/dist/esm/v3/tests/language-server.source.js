import * as z from "zod/v3";
export const filePath = __filename;
// z.object()
export const Test = z.object({
    f1: z.number(),
});
export const instanceOfTest = {
    f1: 1,
};
// z.object().merge()
export const TestMerge = z
    .object({
    f2: z.string().optional(),
})
    .merge(Test);
export const instanceOfTestMerge = {
    f1: 1,
    f2: "string",
};
// z.union()
export const TestUnion = z.union([
    z.object({
        f2: z.string().optional(),
    }),
    Test,
]);
export const instanceOfTestUnion = {
    f1: 1,
    f2: "string",
};
// z.object().partial()
export const TestPartial = Test.partial();
export const instanceOfTestPartial = {
    f1: 1,
};
// z.object().pick()
export const TestPick = TestMerge.pick({ f1: true });
export const instanceOfTestPick = {
    f1: 1,
};
// z.object().omit()
export const TestOmit = TestMerge.omit({ f2: true });
export const instanceOfTestOmit = {
    f1: 1,
};
