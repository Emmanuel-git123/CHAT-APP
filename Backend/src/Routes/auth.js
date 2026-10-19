const express=require('express');
const bcrypt = require("bcrypt");
const pool = require("../../config/db");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.post('/register',async(req,res)=>{
    try {
        const { username, email, password } = req.body;
        const hashed_password = await bcrypt.hash(password, 12);
        const result = await pool.query(
            `INSERT INTO users (username, email, password_hash)
            VALUES ($1, $2, $3)
            RETURNING id, username, email, created_at`,
            [username, email, hashed_password]
        );
        res.status(201).json({message:"Account Created Successfully",user:result.rows[0]});
    } catch (error) {
        if (error.code === "23505") {
            return res.status(409).json({
                message: "Username or email already exists"
            });
        }
        console.error(error);
        res.status(500).json({ message: "Registration failed" });
    }
})
router.post('/login',async(req,res)=>{
    try {
        const { email, password } = req.body;
        const result = await pool.query(
            `SELECT id, username, email, password_hash
            FROM users
            WHERE LOWER(email) = LOWER($1)`,
            [email]
        );
        const user=result.rows[0];
        if(!user){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const check = await bcrypt.compare(password, user.password_hash);
        if(!check){
            return res.status(401).json({message: "Invalid email or password"});
        }
        const token=jwt.sign({ userId: user.id },process.env.JWT_SECRET,{ expiresIn: "1h" });

        res.status(200).json({message:"Login Successful",token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email
            }
        }
    );
    } catch (error) {
        console.error("Login failed:", error.message);
        res.status(500).json({ message: "Login failed" });
    }
})

module.exports = router;