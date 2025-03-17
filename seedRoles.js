/**
 * Seeds the roles collection.
 *
 * This must be run after the database is created and the build has been completed.
 */
import "dotenv/config";
import mongoose from "mongoose";
import Role from "./dist/src/db/models/role.js";

/**
 * Defines the role schema.
 *
 * @typedef {Object} Role
 * @property {string} name - The name of the role.
 * @property {string} description - The description of the role.
 */
const roles = [
    { name: "admin", description: "Administrator" },
    { name: "editor", description: "Editor" },
    { name: "viewer", description: "Viewer" },
];

/**
 * Seeds the roles collection.
 */
async function seedRoles() {
    try {
        // Construct the MongoDB connection string using environment variables.
        const dbUrl = process.env.DB_URL;
        const dbName = process.env.DB_NAME;
        const connectionString = `${dbUrl}${dbName}`;

        // Connect to MongoDB using the constructed connection string.
        await mongoose.connect(connectionString, {
            useNewUrlParser: true,
        });

        console.log("Connected to MongoDB for seeding roles.");

        // Insert the roles into the collection.
        await Role.insertMany(roles);
        console.log("Roles have been seeded successfully.");
    } catch (error) {
        console.error("Error seeding roles:", error);
        process.exit(1);
    } finally {
        // Close the connection.
        await mongoose.connection.close();
        console.log("Connection closed.");
    }
}

// Run the seed function.
seedRoles();
