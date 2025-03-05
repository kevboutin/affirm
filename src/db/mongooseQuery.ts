import mongoose from "mongoose";

type ValueType = string | number | boolean;

interface QueryCriteria {
    [key: string]: any;
}

interface RangeValues {
    start?: string | number | Date;
    end?: string | number | Date;
}

interface ListParams {
    limit?: number | null;
    offset?: number | null;
    orderBy?: string | null;
}

/**
 * @class MongooseQuery
 */
class MongooseQuery {
    private _criteria: QueryCriteria[];
    public limit: number | undefined;
    public skip: number | undefined;
    public sort: { [key: string]: number } | undefined;
    public readonly isOr: boolean;

    constructor(
        limit: number | null,
        skip: number | null,
        orderBy: string | null,
        isOr: boolean = false,
    ) {
        this._criteria = [];
        this.limit = (limit && Number(limit)) ?? undefined;
        this.skip = (skip && Number(skip)) ?? undefined;
        this.sort = this._buildSort(orderBy);
        this.isOr = isOr;
    }

    /**
     * Creates an instance for querying a group of documents as a result.
     *
     * @param {Object} param
     * @param {number} [param.limit] The database limit on results.
     * @param {number} [param.offset] The number of results to skip.
     * @param {number} [param.orderBy] The sort expression.
     * @returns {MongooseQuery} A new instance.
     */
    static forList({
        limit = null,
        offset = null,
        orderBy = null,
    }: ListParams): MongooseQuery {
        return new MongooseQuery(limit, offset, orderBy, false);
    }

    /**
     * Creates an instance for querying a group of documents as a result for autocompletion.
     *
     * @param {Object} param
     * @param {number} [param.limit] The database limit on results.
     * @param {number} [param.offset] The number of results to skip.
     * @param {number} [param.orderBy] The sort expression.
     * @returns {MongooseQuery} A new instance.
     */
    static forAutocomplete({
        limit = null,
        offset = null,
        orderBy = null,
    }: ListParams): MongooseQuery {
        return new MongooseQuery(limit, offset, orderBy, true);
    }

    /**
     * Appends an $eq statement to the query.
     *
     * @param {string} property The property name.
     * @param {ValueType} value The value.
     */
    appendEqual(property: string, value: ValueType): void {
        this._criteria.push({
            [property]: value,
        });
    }

    /**
     * Appends an $ne statement to the query.
     *
     * @param {string} property The property name.
     * @param {ValueType} value The value.
     */
    appendNotEqual(property: string, value: ValueType): void {
        this._criteria.push({
            [property]: { $ne: value },
        });
    }

    /**
     * Appends an $eq statement to the query with a null value.
     *
     * @param {string} property The property name.
     */
    appendEqualNull(property: string): void {
        this._criteria.push({
            [property]: { $eq: null },
        });
    }

    /**
     * Appends an $ne statement to the query with a null value.
     *
     * @param {string} property The property name.
     */
    appendNotEqualNull(property: string): void {
        this._criteria.push({
            [property]: { $ne: null },
        });
    }

    /**
     * Appends a correctly formatted identifier to the query.
     *
     * @param {string} property The property name.
     * @param {string} value The value.
     */
    appendId(property: string, value: string): void {
        let id: mongoose.Types.ObjectId;

        if (!mongoose.Types.ObjectId.isValid(value)) {
            id = mongoose.Types.ObjectId.createFromTime(+new Date());
        } else {
            id = mongoose.Types.ObjectId.createFromHexString(value);
        }

        this._criteria.push({
            [property]: id,
        });
    }

    /**
     * Appends an $in statement to the query.
     *
     * @param {string} property The property name.
     * @param {Array<ValueType>} values The values.
     */
    appendIn(property: string, values: Array<ValueType>): void {
        this._criteria.push({
            [property]: { $in: values },
        });
    }

    /**
     * Appends a regular expression statement to the query.
     *
     * @param {string} property The property name.
     * @param {string} value The property value.
     */
    appendILike(property: string, value: string): void {
        this._criteria.push({
            [property]: new RegExp(value, "i"),
        });
    }

    /**
     * Append a range clause to the query.
     *
     * @param {string} column The property name.
     * @param {RangeValues} values The property values.
     * @param {number|string|Date} [values.start] The start of the range.
     * @param {number|string|Date} [values.end] The end of the range.
     * @param {boolean} [usingDates] True if the values are Date objects. Defaults to false.
     */
    appendRange(
        column: string,
        value: RangeValues,
        usingDates: boolean = false,
    ): void {
        const { start, end } = value;

        if (usingDates) {
            if (start) {
                this._criteria.push({
                    [column]: {
                        $gte: new Date(start),
                    },
                });
            }

            if (end) {
                this._criteria.push({
                    [column]: {
                        $lte: new Date(end),
                    },
                });
            }
        } else {
            if (start) {
                this._criteria.push({
                    [column]: {
                        $gte: start,
                    },
                });
            }

            if (end) {
                this._criteria.push({
                    [column]: {
                        $lte: end,
                    },
                });
            }
        }
    }

    /**
     * Appends a regular expression statement to the query.
     *
     * @param {string} arrayProperty The property name of the Array of subdocuments.
     * @param {string} property The property name.
     * @param {string|number|boolean} value The value.
     */
    appendElemMatch(
        arrayProperty: string,
        property: string,
        value: string | number | boolean,
    ): void {
        this._criteria.push({
            [arrayProperty]: { $elemMatch: { [property]: value } },
        });
    }

    /**
     * Reset the query.
     */
    reset(): void {
        this._criteria = [];
    }

    /**
     * Build a properly formatted sort for a query.
     *
     * @param {string} orderBy The sort expression.
     * @returns {Object<[string]: number>|undefined} The formatted sort expression.
     */
    private _buildSort(
        orderBy: string | null,
    ): { [key: string]: number } | undefined {
        if (!orderBy) {
            return undefined;
        }

        let orderByStr = orderBy.startsWith("_")
            ? orderBy.substring(1)
            : orderBy;
        let [property, order] = orderByStr.split("_");

        if (property === "id") {
            property = "_id";
        }

        return {
            [property]: order === "ASC" ? 1 : -1,
        };
    }

    /**
     * Get the query criteria.
     */
    get criteria():
        | { $and?: QueryCriteria[]; $or?: QueryCriteria[] }
        | undefined {
        if (!this._criteria.length) {
            return undefined;
        }

        return this.isOr ? { $or: this._criteria } : { $and: this._criteria };
    }
}

export default MongooseQuery;
