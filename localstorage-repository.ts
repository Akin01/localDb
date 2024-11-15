/**
 * Error thrown when a filter operation cannot be found or is invalid.
 * @extends {Error}
 * 
 * @example
 * ```typescript
 * throw new FilterNotFoundError("Invalid filter criteria");
 * ```
 */
export class FilterNotFoundError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "FilterNotFoundError";
	}
}

/**
 * Error thrown when a record is expected but none is found.
 * @extends Error
 * 
 * @class EmptyRecordError
 * @throws {EmptyRecordError} When attempting to access a record that doesn't exist
 * 
 * @example
 * throw new EmptyRecordError("No record found with id: 123");
 */
export class EmptyRecordError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "EmptyRecordError";
	}
}

/**
 * Represents the type of ID generator to be used.
 * @enum {string}
 * @property {string} Increment - Uses an auto-incrementing number as the ID.
 * @property {string} UUID - Uses a Universally Unique Identifier (UUID/GUID) as the ID.
 */
export enum IdGeneratorType {
	Increment = "increment",
	UUID = "uuid",
}

/**
 * Represents an identifier interface for database entities.
 * 
 * @template G - The type of the identifier field.
 * @property _id - The unique identifier for the database entity.
 */
export interface DatabaseId<G> {
	_id: G;
}

/**
 * Interface for a generic database implementation
 * @template T The type of data stored in the database
 */
export interface IDatabase<T> {
	/**
	 * Retrieves all records matching the optional filter
	 * @param filter - Optional partial object to filter records
	 * @returns Array of matching records
	 */
	findAll: (filter?: Partial<T>) => T[];
	
	/**
	 * Finds a single record matching the filter
	 * @param filter - Partial object to filter records
	 * @returns Matching record or undefined if not found
	 */
	findOne: (filter: Partial<T>) => T | undefined;

	/**
	 * Inserts a new record into the database
	 * @param data - Data to insert (excluding _id field)
	 * @returns The inserted record with generated _id
	 */
	insertOne: (data: Omit<T, "_id">) => T;

	/**
	 * Inserts multiple records into the database
	 * @param data - Array of data to insert (excluding _id field)
	 * @returns Array of inserted records with generated _ids
	 */
	bulkInsert: (data: Omit<T, "_id">[]) => T[];

	/**
	 * Deletes records matching the filter
	 * @param filter - Partial object to filter records for deletion
	 * @returns Array of deleted records
	 */
	delete: (filter: Partial<T>) => T[];

	/**
	 * Updates a single record matching the filter
	 * @param filter - Partial object to filter record
	 * @param data - Data to update (excluding _id field)
	 * @returns Updated record or undefined if not found
	 */
	updateOne: (
		filter: Partial<T>,
		data: Omit<Partial<T>, "_id">,
	) => T | undefined;

	/**
	 * Updates all records matching the filter
	 * @param filter - Partial object to filter records
	 * @param data - Data to update (excluding _id field)
	 * @returns Array of updated records
	 */
	updateAll: (filter: Partial<T>, data: Omit<Partial<T>, "_id">) => T[];
}

/**
 * A generic class that implements a local storage-based database system.
 *
 * @template T - The type of the entity being stored
 * @template G - The type of the database ID (string for UUID, number for increment)
 *
 * @example
 * ```typescript
 * // Create a database for users with UUID as ID
 * interface User {
 *   name: string;
 *   email: string;
 * }
 * const userDb = new Database<User, string>('users');
 *
 * // Create a database with incremental IDs
 * interface Product {
 *   name: string;
 *   price: number;
 * }
 * const productDb = new Database<Product, number>('products', IdGeneratorType.Increment);
 * ```
 *
 * @remarks
 * - All items in the database will automatically have an `_id` field added
 * - Supports two types of ID generation: UUID (default) and Increment
 * - Data persists in localStorage under the provided dbKey
 *
 * @throws {FilterNotFoundError} When operations are attempted with empty filters
 * @throws {EmptyRecordError} When operations are attempted with empty data
 */
export class Database<T, G> implements IDatabase<T & DatabaseId<G>> {
	private dbKey: string;
	private db: string | null;
	private initIncrementId: number = 0;
	private idGeneratorType: IdGeneratorType = IdGeneratorType.UUID;

	constructor(
		dbKey: string,
		idGeneratorType: IdGeneratorType = IdGeneratorType.UUID,
	) {
		this.dbKey = dbKey;
		this.db = localStorage.getItem(this.dbKey);
		this.idGeneratorType = idGeneratorType;

		if (!this.db) {
			localStorage.setItem(this.dbKey, JSON.stringify([]));
		}
	}

	/**
	 * Retrieves all items from the database that match the given filter criteria.
	 *
	 * @template T - The type of the stored items
	 * @template G - The type of the database ID
	 *
	 * @param {Partial<T & DatabaseId<G>>} [filter] - Optional filter criteria to match against items
	 * @returns {(T & DatabaseId<G>)[]} An array of items that match the filter criteria. If no filter is provided, returns all items
	 *
	 * @example
	 * interface User {
	 *   name: string;
	 *   email: string;
	 * }
	 * const userRepo = new Database<User, string>("users");
	 *
	 * // Get all items
	 * const users = userRepo.findAll();
	 *
	 * // Get items matching specific criteria
	 * const filteredItems = ruserRepo.findAll({ name: "john Doe" });
	 */
	findAll(filter?: Partial<T & DatabaseId<G>>): (T & DatabaseId<G>)[] {
		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];

		if (!filter) {
			return items;
		}

		const filteredItems = items.filter((e) => {
			return this.isObjectMatch(filter, e);
		});

		return filteredItems;
	}

	/**
	 * Finds and returns a single item from the database that matches the given filter criteria.
	 *
	 * @param filter - A partial object containing the search criteria. Must contain at least one property to match against.
	 * @returns The first matching item from the database, or undefined if no match is found.
	 * @throws {FilterNotFoundError} When the filter parameter is empty or undefined.
	 *
	 * @example
	 * ```typescript
	 * // Assuming a User type with { id: string, name: string, age: number }
	 * const userRepo = new Database<User, string>("users");
	 *
	 * // Find a user by name
	 * const user = userRepo.findOne({ name: "John Doe" });
	 *
	 * // Find a user by multiple criteria
	 * const specificUser = userRepo.findOne({ name: "John Doe", age: 30 });
	 * ```
	 */
	findOne(
		filter: Partial<T & DatabaseId<G>>,
	): (T & DatabaseId<G>) | undefined {
		if (!filter) {
			throw new FilterNotFoundError(
				"Empty filter not allowed, please provide filter criteria to get the data.",
			);
		}

		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];
		const item = items.find((e) => {
			return this.isObjectMatch(filter, e);
		});

		return item;
	}

	/**
	 * Inserts a new record into the local storage database.
	 *
	 * @template T - The type of the data object
	 * @template G - The type of the ID field
	 * @param data - The data to insert, excluding the _id field
	 * @returns The inserted record including the generated _id
	 * @throws {EmptyRecordError} When no data is provided
	 *
	 * @example
	 * ```typescript
	 * interface User {
	 *   name: string;
	 *   age: number;
	 * }
	 *
	 * const repository = new Database<User, string>("users");
	 * const newUser = repository.insertOne({
	 *   name: "John Doe",
	 *   age: 30
	 * });
	 * // Result: { name: "John Doe", age: 30, _id: "generated-id" }
	 * ```
	 */
	insertOne(data: Omit<T & DatabaseId<G>, "_id">): T & DatabaseId<G> {
		if (!data) {
			throw new EmptyRecordError(
				"Please provide data to insert!",
			);
		}

		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];
		const newItem = {
			...data,
			_id: this.generateId(),
		} as T & DatabaseId<G>;

		items.push(newItem);
		this.refreshLocalStorage(items);

		return newItem;
	}

	/**
	 * Inserts multiple records into the database simultaneously
	 * @param data - An array of objects to be inserted, excluding the '_id' field
	 * @returns An array of the inserted records with generated '_id' fields
	 * @throws {EmptyRecordError} When the input array is empty or null
	 *
	 * @example
	 * ```typescript
	 * // Insert multiple users
	 * const newUsers = repository.bulkInsert([
	 *   { name: "John", age: 25 },
	 *   { name: "Jane", age: 30 }
	 * ]);
	 * ```
	 */
	bulkInsert(data: Omit<T & DatabaseId<G>, "_id">[]): (T & DatabaseId<G>)[] {
		if (!data || !data.length) {
			throw new EmptyRecordError(
				"Please provide data to insert!",
			);
		}

		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];
		const itemsInserted = data.map((item) => {
			const newItem = {
				...item,
				_id: this.generateId(),
			} as T & DatabaseId<G>;
			items.push(newItem);
			return newItem;
		});

		this.refreshLocalStorage(items);

		return itemsInserted;
	}

	/**
	 * Deletes items from local storage that match the given filter criteria
	 * 
	 * @param filter - Partial object containing key-value pairs to match against stored items
	 * @returns Array of deleted items that matched the filter criteria
	 * @throws {FilterNotFoundError} When filter parameter is empty/undefined
	 * 
	 * @example
	 * ```typescript
	 * // Delete all items where name is "John"
	 * const deletedItems = repository.delete({ name: "John" });
	 * 
	 * // Delete item with specific ID
	 * const deleted = repository.delete({ _id: "123abc" });
	 * 
	 * // Delete items matching multiple criteria
	 * const deletedMultiple = repository.delete({ age: 25, city: "New York" });
	 * ```
	 */
	delete(filter: Partial<T & DatabaseId<G>>): (T & DatabaseId<G>)[] {
		if (!filter) {
			throw new FilterNotFoundError(
				"Empty filter not allowed, please provide filter criteria to delete the data.",
			);
		}

		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];
		const itemsDeleted: (T & DatabaseId<G>)[] = [];

		for (const item of items) {
			if (this.isObjectMatch(filter, item)) {
				const itemIndex = items.findIndex((e) => e._id === item._id);
				if (itemIndex !== -1) {
					items.splice(itemIndex, 1);
					itemsDeleted.push(item);
				}
			}
		}

		this.refreshLocalStorage(items);

		return itemsDeleted;
	}

	/**
	 * Updates a single record in the local storage database that matches the filter criteria.
	 * 
	 * @param filter - Partial object containing the search criteria to find the record to update
	 * @param data - Partial object containing the fields to update (excluding _id)
	 * @returns The updated record if found, undefined otherwise
	 * @throws {FilterNotFoundError} When filter parameter is empty
	 * @throws {EmptyRecordError} When data parameter is empty
	 * 
	 * @example
	 * ```typescript
	 * // Assuming a User interface with {name: string, age: number, _id: string}
	 * const repo = new LocalStorageRepository<User, string>();
	 * 
	 * // Update user's age where name is "John"
	 * const updatedUser = repo.updateOne(
	 *   { name: "John" },
	 *   { age: 31 }
	 * );
	 * // Returns updated user object if found, undefined if not found
	 * ```
	 */
	updateOne(
		filter: Partial<T & DatabaseId<G>>,
		data: Omit<Partial<T & DatabaseId<G>>, "_id">,
	): (T & DatabaseId<G>) | undefined {
		if (!filter) {
			throw new FilterNotFoundError(
				"Empty filter not allowed, please provide filter criteria to update the data.",
			);
		}

		if (!data) {
			throw new EmptyRecordError(
				"Please provide data to update!",
			);
		}

		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];
		const itemIndex = items.findIndex((e) => {
			return this.isObjectMatch(filter, e);
		});

		if (itemIndex === -1) {
			return;
		}

		items[itemIndex] = {
			...items[itemIndex],
			...(data as T & DatabaseId<G>),
		};

		this.refreshLocalStorage(items);

		return items[itemIndex];
	}

	/**
	 * Updates multiple records in the local storage database that match the given filter criteria.
	 * 
	 * @param filter - Partial object containing the criteria to match records for update
	 * @param data - Partial object containing the fields to update (excluding _id field)
	 * @returns Array of updated records that matched the filter criteria
	 * @throws {FilterNotFoundError} When filter parameter is empty/undefined
	 * @throws {EmptyRecordError} When data parameter is empty/undefined
	 * 
	 * @example
	 * ```typescript
	 * // Update all users with role 'admin' to have isActive = true
	 * const repository = new LocalStorageRepository<User, string>();
	 * const updatedUsers = repository.updateAll(
	 *   { role: 'admin' },
	 *   { isActive: true }
	 * );
	 * // Returns array of updated user records
	 * ```
	 */
	updateAll(
		filter: Partial<T & DatabaseId<G>>,
		data: Omit<Partial<T & DatabaseId<G>>, "_id">,
	): (T & DatabaseId<G>)[] {
		if (!filter) {
			throw new FilterNotFoundError(
				"Empty filter not allowed, please provide filter criteria to update the data.",
			);
		}

		if (!data) {
			throw new EmptyRecordError(
				"Please provide data to update!",
			);
		}

		const items = JSON.parse(this.db as string) as (T & DatabaseId<G>)[];
		const itemsUpdated: (T & DatabaseId<G>)[] = [];

		for (const item of items) {
			if (this.isObjectMatch(filter, item)) {
				const itemIndex = items.findIndex((e) => e._id === item._id);
				if (itemIndex !== -1) {
					items[itemIndex] = {
						...items[itemIndex],
						...(data as T),
					};
					itemsUpdated.push(items[itemIndex]);
				}
			}
		}

		this.refreshLocalStorage(items);
		return itemsUpdated;
	}

	/**
	 * Initializes the local storage with the provided data array.
	 * Each item in the array will be assigned a unique identifier.
	 * 
	 * @param data - An array of objects without _id property to be stored
	 * @throws {EmptyRecordError} When the data array is empty or undefined
	 * 
	 * @example
	 * ```typescript
	 * interface User {
	 *   name: string;
	 *   age: number;
	 * }
	 * 
	 * const repository = new Database<User, "string">("users");
	 * repository.seed([
	 *   { name: "John", age: 30 },
	 *   { name: "Jane", age: 25 }
	 * ]);
	 * ```
	 */
	seed(data: Omit<T, "_id">[]) {
		if (!data || !data.length) {
			throw new EmptyRecordError(
				"Please provide data to initialize!",
			);
		}

		const items = data.map((e) => ({
			...e,
			_id: this.generateId(),
		})) as T[];
		this.refreshLocalStorage(items);
	}

	private refreshLocalStorage(data: T[]) {
		localStorage.setItem(this.dbKey, JSON.stringify(data));
		this.db = localStorage.getItem(this.dbKey);
	}

	private isObjectMatch(filter: Partial<T>, data: T) {
		return Object.keys(filter).every((
			fKey,
		) => ((filter as Record<string, unknown>)[fKey] ===
			(data as Record<string, unknown>)[fKey])
		);
	}

	private incrementId(): void {
		this.initIncrementId++;
	}

	private generateId() {
		switch (this.idGeneratorType) {
			case IdGeneratorType.Increment:
				this.incrementId();
				return this.initIncrementId;
			case IdGeneratorType.UUID:
				return crypto.randomUUID();
			default:
				return crypto.randomUUID();
		}
	}
}
