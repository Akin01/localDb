# LocalDB

LocalDB is a lightweight database abstraction layer that provides a repository
interface for performing CRUD (Create, Read, Update, Delete) operations using
the browser's LocalStorage API as a database.

## Features

- Simple repository interface
- Persistent storage using LocalStorage
- CRUD operations support
- Easy integration with web applications

## Installation

```bash
deno add jsr:@akin01/localdb
```

## Usage

```typescript
import { Database } from "@akin01/localdb";

// create a user schema
type User = {
	name: string;
	age: number;
	hobby: string;
	position: string;
};

// Initialize a repository
const userRepository = new Database<User, string>("users");

// Create a user
userRepository.inserOne({
	name: "John Doe",
	age: 30,
	hobby: "reading",
	position: "developer",
});

// Get a user
const user = userRepository.findOne({ name: "John Doe" });

// Update a user
userRepository.updateOne(
	{ name: "John Doe" },
	{ position: "Software Engineer" },
);

// Delete a user
userRepository.delete({ name: "John Doe" });
```

## License

MIT License

## Contributing

Feel free to submit issues and pull requests.
