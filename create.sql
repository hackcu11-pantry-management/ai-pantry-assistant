CREATE DATABASE pantryDatabase;

USE pantry;

DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS pantry_entries;

CREATE TABLE users(
    userID SERIAL PRIMARY KEY,
    userLastName VARCHAR(50) NOT NULL,
    userFirstName VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL,
);

CREATE TABLE products (
    productUPC SERIAL PRIMARY KEY,
    productName VARCHAR(50) NOT NULL,
    productDescription VARCHAR(100)
);

CREATE TABLE pantry_entries (
    orderID SERIAL PRIMARY KEY,
    userID INT NOT NULL,
    productUPC INT NOT NULL,
    quantity FLOAT,
    quantityType VARCHAR(25),
    date_purchased DATE,
    expiration_date DATE,
    FOREIGN KEY (userID) REFERENCES users(userID),
    FOREIGN KEY (productUPC) REFERENCES products(productUPC)
);
