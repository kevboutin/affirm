import type { ZodSchema } from "./types.ts";

/**
 * Applies JSON content.
 *
 * @param {Object} schema The schema.
 * @param {string} description The description.
 * @returns
 */
const jsonContent = <T extends ZodSchema>(schema: T, description: string) => {
    return {
        content: {
            "application/json": {
                schema,
            },
        },
        description,
    };
};

export default jsonContent;
