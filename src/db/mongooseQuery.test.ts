import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import MongooseQuery from "./mongooseQuery";

describe("MongooseQuery", () => {
    let query: MongooseQuery;

    beforeEach(() => {
        query = new MongooseQuery(10, 0, "name_ASC");
    });

    describe("constructor and static methods", () => {
        it("should create instance with correct defaults", () => {
            const query = new MongooseQuery(null, null, null);
            expect(query.limit).toBeUndefined();
            expect(query.skip).toBeUndefined();
            expect(query.sort).toBeUndefined();
            expect(query.isOr).toBe(false);
        });

        it("should create instance for list", () => {
            const query = MongooseQuery.forList({
                limit: 5,
                offset: 10,
                orderBy: "name_DESC",
            });
            expect(query.limit).toBe(5);
            expect(query.skip).toBe(10);
            expect(query.sort).toEqual({ name: -1 });
            expect(query.isOr).toBe(false);
        });

        it("should create instance for autocomplete", () => {
            const query = MongooseQuery.forAutocomplete({ limit: 5 });
            expect(query.limit).toBe(5);
            expect(query.isOr).toBe(true);
        });
    });

    describe("query methods", () => {
        it("should append equal condition", () => {
            query.appendEqual("name", "John");
            expect(query.criteria).toEqual({
                $and: [{ name: "John" }],
            });
        });

        it("should append not equal condition", () => {
            query.appendNotEqual("age", 25);
            expect(query.criteria).toEqual({
                $and: [{ age: { $ne: 25 } }],
            });
        });

        it("should append null conditions", () => {
            query.appendEqualNull("deletedAt");
            query.appendNotEqualNull("updatedAt");
            expect(query.criteria).toEqual({
                $and: [
                    { deletedAt: { $eq: null } },
                    { updatedAt: { $ne: null } },
                ],
            });
        });

        it("should append identifier condition with valid ObjectId", () => {
            const validId = "507f1f77bcf86cd799439011";
            query.appendId("_id", validId);
            expect(
                (query.criteria as { $and: any[] }).$and[0]._id,
            ).toBeInstanceOf(mongoose.Types.ObjectId);
            expect(
                (query.criteria as { $and: any[] }).$and[0]._id.toString(),
            ).toBe(validId);
        });

        it("should handle not valid ObjectId", () => {
            query.appendId("_id", "notvalid-id");
            expect(
                (query.criteria as { $and: any[] }).$and[0]._id,
            ).toBeInstanceOf(mongoose.Types.ObjectId);
        });

        it("should append in condition", () => {
            query.appendIn("status", ["active", "pending"]);
            expect(query.criteria).toEqual({
                $and: [{ status: { $in: ["active", "pending"] } }],
            });
        });

        it("should append ilike condition", () => {
            query.appendILike("name", "john");
            expect(
                (query.criteria as { $and: any[] }).$and[0].name,
            ).toBeInstanceOf(RegExp);
            expect((query.criteria as { $and: any[] }).$and[0].name.flags).toBe(
                "i",
            );
        });

        it("should append range condition", () => {
            query.appendRange("age", { start: 20, end: 30 });
            expect(query.criteria).toEqual({
                $and: [{ age: { $gte: 20 } }, { age: { $lte: 30 } }],
            });
        });

        it("should append elemMatch condition", () => {
            query.appendElemMatch("items", "category", "books");
            expect(query.criteria).toEqual({
                $and: [{ items: { $elemMatch: { category: "books" } } }],
            });
        });
    });

    describe("sort handling", () => {
        it("should handle ASC sort", () => {
            const query = new MongooseQuery(10, 0, "name_ASC");
            expect(query.sort).toEqual({ name: 1 });
        });

        it("should handle DESC sort", () => {
            const query = new MongooseQuery(10, 0, "name_DESC");
            expect(query.sort).toEqual({ name: -1 });
        });

        it("should handle id field specifically", () => {
            const query = new MongooseQuery(10, 0, "id_ASC");
            expect(query.sort).toEqual({ _id: 1 });
        });

        it("should handle leading underscore", () => {
            const query = new MongooseQuery(10, 0, "_name_DESC");
            expect(query.sort).toEqual({ name: -1 });
        });
    });

    describe("reset and criteria", () => {
        it("should reset criteria", () => {
            query.appendEqual("name", "John");
            expect(query.criteria).toBeDefined();
            query.reset();
            expect(query.criteria).toBeUndefined();
        });

        it("should use $or when isOr is true", () => {
            const orQuery = new MongooseQuery(10, 0, null, true);
            orQuery.appendEqual("name", "John");
            orQuery.appendEqual("age", 25);
            expect(orQuery.criteria).toHaveProperty("$or");
            expect((orQuery.criteria as { $or: any[] }).$or).toHaveLength(2);
        });

        it("should return undefined when criteria is empty", () => {
            const emptyQuery = new MongooseQuery(10, 0, null);
            expect(emptyQuery.criteria).toBeUndefined();
        });

        it("should combine multiple criteria with $and", () => {
            query.appendEqual("name", "John");
            query.appendNotEqual("age", 25);
            query.appendIn("status", ["active"]);
            expect(query.criteria).toEqual({
                $and: [
                    { name: "John" },
                    { age: { $ne: 25 } },
                    { status: { $in: ["active"] } },
                ],
            });
        });
    });

    describe("appendRange edge cases", () => {
        it("should append range with only start value", () => {
            query.appendRange("age", { start: 18 });
            expect(query.criteria).toEqual({
                $and: [{ age: { $gte: 18 } }],
            });
        });

        it("should append range with only end value", () => {
            query.appendRange("age", { end: 65 });
            expect(query.criteria).toEqual({
                $and: [{ age: { $lte: 65 } }],
            });
        });

        it("should append range with usingDates=true and Date objects", () => {
            const startDate = new Date("2023-01-01");
            const endDate = new Date("2023-12-31");
            query.appendRange(
                "createdAt",
                { start: startDate, end: endDate },
                true,
            );
            expect(query.criteria).toEqual({
                $and: [
                    { createdAt: { $gte: new Date(startDate) } },
                    { createdAt: { $lte: new Date(endDate) } },
                ],
            });
        });

        it("should append range with usingDates=true and string dates", () => {
            query.appendRange(
                "createdAt",
                { start: "2023-01-01", end: "2023-12-31" },
                true,
            );
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0].createdAt.$gte).toBeInstanceOf(Date);
            expect(criteria.$and[1].createdAt.$lte).toBeInstanceOf(Date);
        });

        it("should append range with usingDates=true and only start date", () => {
            query.appendRange("createdAt", { start: "2023-01-01" }, true);
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and).toHaveLength(1);
            expect(criteria.$and[0].createdAt.$gte).toBeInstanceOf(Date);
        });

        it("should append range with usingDates=true and only end date", () => {
            query.appendRange("createdAt", { end: "2023-12-31" }, true);
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and).toHaveLength(1);
            expect(criteria.$and[0].createdAt.$lte).toBeInstanceOf(Date);
        });

        it("should append range with usingDates=false and string dates", () => {
            query.appendRange("version", { start: "1.0", end: "2.0" }, false);
            expect(query.criteria).toEqual({
                $and: [
                    { version: { $gte: "1.0" } },
                    { version: { $lte: "2.0" } },
                ],
            });
        });

        it("should append range with number values", () => {
            query.appendRange("score", { start: 1, end: 100 });
            expect(query.criteria).toEqual({
                $and: [{ score: { $gte: 1 } }, { score: { $lte: 100 } }],
            });
        });

        it("should not append start when start is 0 (falsy)", () => {
            query.appendRange("score", { start: 0, end: 100 });
            expect(query.criteria).toEqual({
                $and: [{ score: { $lte: 100 } }],
            });
        });

        it("should append range with empty range values", () => {
            query.appendRange("age", {});
            expect(query.criteria).toBeUndefined();
        });
    });

    describe("constructor edge cases", () => {
        it("should convert string numbers to numbers for limit and skip", () => {
            const query = new MongooseQuery("10" as any, "5" as any, null);
            expect(query.limit).toBe(10);
            expect(query.skip).toBe(5);
        });

        it("should handle zero values for limit and skip", () => {
            const query = new MongooseQuery(0, 0, null);
            expect(query.limit).toBe(0);
            expect(query.skip).toBe(0);
        });

        it("should handle negative values for limit and skip", () => {
            const query = new MongooseQuery(-5, -10, null);
            expect(query.limit).toBe(-5);
            expect(query.skip).toBe(-10);
        });

        it("should handle falsy values correctly", () => {
            const query = new MongooseQuery(0, null, null);
            expect(query.limit).toBe(0);
            expect(query.skip).toBeUndefined();
        });
    });

    describe("sort edge cases", () => {
        it("should handle orderBy without underscore (defaults to DESC)", () => {
            const query = new MongooseQuery(10, 0, "name");
            expect(query.sort).toEqual({ name: -1 });
        });

        it("should handle orderBy with invalid order (defaults to DESC)", () => {
            const query = new MongooseQuery(10, 0, "name_INVALID");
            expect(query.sort).toEqual({ name: -1 });
        });

        it("should handle orderBy with only underscore prefix", () => {
            const query = new MongooseQuery(10, 0, "_ASC");
            // After removing leading underscore, "ASC" is split by "_" which gives ["ASC"]
            // So property = "ASC" and order = undefined (defaults to -1)
            expect(query.sort).toEqual({ ASC: -1 });
        });

        it("should handle _id field with double leading underscore", () => {
            const query = new MongooseQuery(10, 0, "__id_ASC");
            // After removing leading underscore, "_id_ASC" is split by "_" which gives ["", "id", "ASC"]
            // So property = "" and order = "id" (which becomes -1 since it's not "ASC")
            expect(query.sort).toEqual({ "": -1 });
        });
    });

    describe("appendIn edge cases", () => {
        it("should append in condition with empty array", () => {
            query.appendIn("status", []);
            expect(query.criteria).toEqual({
                $and: [{ status: { $in: [] } }],
            });
        });

        it("should append in condition with single value", () => {
            query.appendIn("status", ["active"]);
            expect(query.criteria).toEqual({
                $and: [{ status: { $in: ["active"] } }],
            });
        });

        it("should append in condition with numbers", () => {
            query.appendIn("age", [18, 25, 30]);
            expect(query.criteria).toEqual({
                $and: [{ age: { $in: [18, 25, 30] } }],
            });
        });

        it("should append in condition with booleans", () => {
            query.appendIn("isActive", [true, false]);
            expect(query.criteria).toEqual({
                $and: [{ isActive: { $in: [true, false] } }],
            });
        });
    });

    describe("appendILike edge cases", () => {
        it("should handle special regex characters", () => {
            query.appendILike("name", "test.*value");
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0].name).toBeInstanceOf(RegExp);
            expect(criteria.$and[0].name.source).toBe("test.*value");
        });

        it("should handle empty string", () => {
            query.appendILike("name", "");
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0].name).toBeInstanceOf(RegExp);
            // Empty string in RegExp constructor creates a regex that matches anything
            expect(criteria.$and[0].name.source).toBe("(?:)");
        });

        it("should handle case insensitive matching", () => {
            query.appendILike("name", "JOHN");
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0].name.flags).toBe("i");
            expect(criteria.$and[0].name.test("john")).toBe(true);
            expect(criteria.$and[0].name.test("JOHN")).toBe(true);
        });
    });

    describe("appendElemMatch edge cases", () => {
        it("should append elemMatch with number value", () => {
            query.appendElemMatch("scores", "value", 100);
            expect(query.criteria).toEqual({
                $and: [{ scores: { $elemMatch: { value: 100 } } }],
            });
        });

        it("should append elemMatch with boolean value", () => {
            query.appendElemMatch("flags", "isActive", true);
            expect(query.criteria).toEqual({
                $and: [{ flags: { $elemMatch: { isActive: true } } }],
            });
        });

        it("should append elemMatch with string value", () => {
            query.appendElemMatch("tags", "name", "important");
            expect(query.criteria).toEqual({
                $and: [{ tags: { $elemMatch: { name: "important" } } }],
            });
        });
    });

    describe("appendEqual and appendNotEqual edge cases", () => {
        it("should append equal with boolean value", () => {
            query.appendEqual("isActive", true);
            expect(query.criteria).toEqual({
                $and: [{ isActive: true }],
            });
        });

        it("should append equal with number value", () => {
            query.appendEqual("age", 25);
            expect(query.criteria).toEqual({
                $and: [{ age: 25 }],
            });
        });

        it("should append not equal with boolean value", () => {
            query.appendNotEqual("isDeleted", false);
            expect(query.criteria).toEqual({
                $and: [{ isDeleted: { $ne: false } }],
            });
        });

        it("should append not equal with number value", () => {
            query.appendNotEqual("count", 0);
            expect(query.criteria).toEqual({
                $and: [{ count: { $ne: 0 } }],
            });
        });

        it("should append not equal with empty string", () => {
            query.appendNotEqual("name", "");
            expect(query.criteria).toEqual({
                $and: [{ name: { $ne: "" } }],
            });
        });
    });

    describe("appendId edge cases", () => {
        it("should handle empty string as invalid ObjectId", () => {
            query.appendId("_id", "");
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0]._id).toBeInstanceOf(
                mongoose.Types.ObjectId,
            );
        });

        it("should handle short string as invalid ObjectId", () => {
            query.appendId("_id", "123");
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0]._id).toBeInstanceOf(
                mongoose.Types.ObjectId,
            );
        });

        it("should handle different property names", () => {
            query.appendId("userId", "507f1f77bcf86cd799439011");
            const criteria = query.criteria as { $and: any[] };
            expect(criteria.$and[0].userId).toBeInstanceOf(
                mongoose.Types.ObjectId,
            );
            expect(criteria.$and[0].userId.toString()).toBe(
                "507f1f77bcf86cd799439011",
            );
        });
    });

    describe("forList and forAutocomplete edge cases", () => {
        it("should handle forList with all null values", () => {
            const query = MongooseQuery.forList({
                limit: null,
                offset: null,
                orderBy: null,
            });
            expect(query.limit).toBeUndefined();
            expect(query.skip).toBeUndefined();
            expect(query.sort).toBeUndefined();
            expect(query.isOr).toBe(false);
        });

        it("should handle forAutocomplete with all null values", () => {
            const query = MongooseQuery.forAutocomplete({
                limit: null,
                offset: null,
                orderBy: null,
            });
            expect(query.limit).toBeUndefined();
            expect(query.skip).toBeUndefined();
            expect(query.sort).toBeUndefined();
            expect(query.isOr).toBe(true);
        });

        it("should handle forList with orderBy", () => {
            const query = MongooseQuery.forList({
                limit: 10,
                offset: 0,
                orderBy: "createdAt_DESC",
            });
            expect(query.sort).toEqual({ createdAt: -1 });
        });

        it("should handle forAutocomplete with orderBy", () => {
            const query = MongooseQuery.forAutocomplete({
                limit: 10,
                offset: 0,
                orderBy: "name_ASC",
            });
            expect(query.sort).toEqual({ name: 1 });
            expect(query.isOr).toBe(true);
        });
    });
});
