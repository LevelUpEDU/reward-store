-- Migration to add password fields to student and instructor tables
-- Run this SQL script to update your existing database

-- Add password column to student table
ALTER TABLE student ADD COLUMN password VARCHAR NOT NULL DEFAULT '';

-- Add password column to instructor table  
ALTER TABLE instructor ADD COLUMN password VARCHAR NOT NULL DEFAULT '';


