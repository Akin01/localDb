import {
    assertArrayIncludes,
    assertEquals,
    assertExists,
    assertFalse,
    assertGreater,
	assertNotEquals,
} from "@std/assert";
import { Database } from "./mod.ts";

type Book = {
    title: string;
    author: string;
};

const Books: Book[] = [
    {
        title: "The Great Gatsby",
        author: "F. Scott Fitzgerald",
    },
    {
        title: "Moby",
        author: "Herman Melville",
    },
    {
        title: "War and Peace",
        author: "Leo Tolstoy",
    },
    {
        title: "The Catcher in the Rye",
        author: "J.D. Salinger",
    },
    {
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
    },
];

const bookDb = new Database<Book, string>("books");

Deno.test("Seed data", () => {
    bookDb.seed(Books);
    const books = bookDb.findAll();
    const bookWithoutId = books.map(({ _id, ...e }) => ({ ...e }));
    assertEquals(bookWithoutId, Books);
});

Deno.test("Find all without filter", () => {
    const books = bookDb.findAll();
    assertEquals(books.length, 5);
});

Deno.test("Find all with filter", () => {
    const books = bookDb.findAll({
        title: "The Great Gatsby",
    });

    assertEquals(books.length, 1);
    assertEquals(books[0].title, "The Great Gatsby");
});

Deno.test("Find one data", () => {
    const book = bookDb.findOne({
        title: "The Catcher in the Rye",
    });
    assertExists(book);
    assertEquals(book.title, "The Catcher in the Rye");
});

Deno.test("Insert one data", () => {
    bookDb.insertOne({
        title: "1984",
        author: "George Orwell",
    });

    const book = bookDb.findOne({ title: "1984" });
    assertExists(book);
    assertEquals(book.title, "1984");
});

Deno.test("Bulk insert data", () => {
    bookDb.bulkInsert([
        {
            author: "J.R.R. Tolkien",
            title: "The Hobbit",
        },
        {
            author: "H.G. Wells",
            title: "The War of the Worlds",
        },
        {
            author: "Jules Verne",
            title: "Twenty Thousand Leagues Under the Sea",
        },
    ]);

    const books = bookDb.findAll();
    assertGreater(books.length, 6);

    const book1 = bookDb.findOne({ author: "J.R.R. Tolkien" });
    assertExists(book1);
    assertArrayIncludes(books, [book1]);

    const book2 = bookDb.findOne({ title: "The War of the Worlds" });
    assertExists(book2);
    assertArrayIncludes(books, [book2]);

    const book3 = bookDb.findOne({
        title: "Twenty Thousand Leagues Under the Sea",
    });
    assertExists(book3);
    assertArrayIncludes(books, [book3]);
});

Deno.test("Update one data", () => {
    const book = bookDb.findOne({ title: "The Catcher in the Rye" });
    assertExists(book);

    bookDb.updateOne({ title: "The Catcher in the Rye" }, {
        title: "The Catcher in the Rye (Updated)",
    });

    const newBook = bookDb.findOne({ title: "The Catcher in the Rye (Updated)" });
    assertExists(newBook);
    assertNotEquals(book.title, newBook.title)
});

Deno.test("Update all data", () => {
    bookDb.updateAll({ author: "J.R.R. Tolkien" }, {
        title: "The Lord of the Rings",
    });

    const books = bookDb.findAll();
    const book = bookDb.findOne({ title: "The Lord of the Rings" });
    assertExists(book);
    assertArrayIncludes(books, [book]);
});

Deno.test("Delete data", () => {
    const book = bookDb.findOne({ title: "The Catcher in the Rye (Updated)" });
    assertExists(book);

    bookDb.delete({ title: "The Catcher in the Rye (Updated)" });
    assertFalse(!!bookDb.findOne({ title: "The Catcher in the Rye (Updated)" }));
});