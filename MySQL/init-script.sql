CREATE TABLE IF NOT EXISTS users (
    username VARCHAR(50) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL PRIMARY KEY,
    password_hash VARCHAR(60) NOT NULL,
    ethereum_address VARCHAR(60) NOT NULL,
    birthday DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS campaigns (
    id INT NOT NULL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(1000) NOT NULL
);
