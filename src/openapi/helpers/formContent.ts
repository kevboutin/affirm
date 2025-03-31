import type { ZodSchema } from "./types.js";

/**
 * Applies URL-encoded form content.
 *
 * @param {Object} schema The schema.
 * @param {string} description The description.
 * @returns {Object} The form content.
 */
const formContent = <T extends ZodSchema>(schema: T, description: string) => {
    return {
        content: {
            "application/x-www-form-urlencoded": {
                schema,
            },
        },
        description,
    };
};

export default formContent;
