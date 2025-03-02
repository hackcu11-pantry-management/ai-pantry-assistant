
DROP TABLE IF EXISTS usersProducts;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS products;


CREATE TABLE users (
    userID SERIAL PRIMARY KEY,
    userLastName VARCHAR(50) NOT NULL,
    userFirstName VARCHAR(50) NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(100) NOT NULL
);

CREATE TABLE products (
    productUPC BIGINT PRIMARY KEY,
    productName VARCHAR(255) NOT NULL,
    productDescription VARCHAR(550),
    productBrand VARCHAR (255),
    productModel VARCHAR (255),
    productColor VARCHAR (255),
    productSize VARCHAR (255),
    productDimension VARCHAR (255),
    productWeight VARCHAR (255),
    productCategory TEXT,
    productLowestPrice FLOAT,
    productHighestPrice FLOAT,
    productCurrency VARCHAR (10),
    productImages TEXT[]
);

CREATE TABLE usersProducts (
    pantryID SERIAL PRIMARY KEY,
    userID INT NOT NULL,
    productUPC BIGINT NOT NULL,
    quantity FLOAT,
    quantityType VARCHAR(25),
    date_purchased DATE,
    expiration_date DATE,
    FOREIGN KEY (userID) REFERENCES users(userID),
    FOREIGN KEY (productUPC) REFERENCES products(productUPC)
);

GRANT ALL PRIVILEGES ON TABLE products TO postgres;
GRANT ALL PRIVILEGES ON TABLE users TO postgres;
GRANT ALL PRIVILEGES ON TABLE usersProducts TO postgres;

-- Also grant privileges on the sequences (for SERIAL columns)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres;
