const express = require("express");
const mysql = require("mysql2");

const app = express();
const PORT = 3000;

const dbConfig = {
    host: "localhost",
    user: "root",
    password: "",
    database: "student_db"
};

let db;

app.use(express.json());
app.use(express.static(__dirname));

function initializeDatabase() {
    const adminConnection = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: ""
    });

    adminConnection.connect((err) => {
        if (err) {
            console.error("MySQL connection failed:", err);
            process.exit(1);
        }

        adminConnection.query("CREATE DATABASE IF NOT EXISTS student_db", (err) => {
            if (err) {
                console.error("Database creation failed:", err);
                adminConnection.end();
                process.exit(1);
            }

            adminConnection.query("USE student_db", (err) => {
                if (err) {
                    console.error("Database selection failed:", err);
                    adminConnection.end();
                    process.exit(1);
                }

                adminConnection.query(`
                    CREATE TABLE IF NOT EXISTS movies (
                        id INT AUTO_INCREMENT PRIMARY KEY,
                        title VARCHAR(150) NOT NULL,
                        genre VARCHAR(100) NOT NULL,
                        release_year INT NOT NULL
                    )
                `, (err) => {
                    if (err) {
                        console.error("Table creation failed:", err);
                        adminConnection.end();
                        process.exit(1);
                    }

                    adminConnection.end(() => {
                        db = mysql.createConnection(dbConfig);

                        db.connect((err) => {
                            if (err) {
                                console.error("Database connection failed:", err);
                                process.exit(1);
                            }

                            console.log("Connected to MySQL");
                            app.listen(PORT, () => {
                                console.log(`Server running at http://localhost:${PORT}`);
                            });
                        });
                    });
                });
            });
        });
    });
}

// ========================================
// GET - Retrieve Movies
// ========================================

app.get("/api/movies", (req, res) => {
    const sql = "SELECT * FROM movies ORDER BY id ASC";

    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        res.json(results);
    });
});

// ========================================
// POST - Insert Movie
// ========================================

app.post("/api/movies", (req, res) => {
    const { title, genre, release_year } = req.body;

    if (!title || !genre || !release_year) {
        return res.status(400).json({ message: "Title, genre, and release year are required" });
    }

    const sql = `
        INSERT INTO movies (title, genre, release_year)
        VALUES (?, ?, ?)
    `;

    db.query(sql, [title, genre, release_year], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        res.status(201).json({
            message: "Movie added successfully",
            id: result.insertId
        });
    });
});

// ========================================
// PUT - Update Movie
// ========================================

app.put("/api/movies/:id", (req, res) => {
    const { id } = req.params;
    const { title, genre, release_year } = req.body;

    if (!title || !genre || !release_year) {
        return res.status(400).json({ message: "Title, genre, and release year are required" });
    }

    const sql = `
        UPDATE movies
        SET title = ?, genre = ?, release_year = ?
        WHERE id = ?
    `;

    db.query(sql, [title, genre, release_year, id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }

        res.json({ message: "Movie updated successfully" });
    });
});

// ========================================
// DELETE - Remove Movie
// ========================================

app.delete("/api/movies/:id", (req, res) => {
    const { id } = req.params;

    const sql = "DELETE FROM movies WHERE id = ?";

    db.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).json({ message: "Database error" });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: "Movie not found" });
        }

        res.json({ message: "Movie deleted successfully" });
    });
});

initializeDatabase();