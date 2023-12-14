CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL PRIMARY KEY,
    password_hash VARCHAR(60) NOT NULL,
    birthday DATE NOT NULL,
    metamask_address VARCHAR(42) NOT NULL
);
