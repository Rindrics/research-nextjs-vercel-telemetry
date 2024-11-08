import { jsonSchema } from "ai";

type GeneratedObject = {
  answer: string;
};

export const schema = jsonSchema<GeneratedObject>(
    {
        type: "object",
        properties: {
        answer: {
            type: "string",
        },
        },
        required: ["answer"],
    },
)

export type PartialGeneratedObject = Partial<GeneratedObject>;
