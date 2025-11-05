-- LevelUpEDU Database Schema
-- Complete PostgreSQL SQL for all tables

-- ==============================================
-- ENUMS
-- ==============================================

-- Reward type enum
CREATE TYPE reward_type AS ENUM ('unspecified');

-- Redemption status enum
CREATE TYPE redemption_status AS ENUM ('pending', 'fulfilled', 'cancelled');

-- Submission status enum
CREATE TYPE submission_status AS ENUM ('pending', 'approved', 'rejected');

-- ==============================================
-- USER MANAGEMENT TABLES
-- ==============================================

-- Students table
CREATE TABLE student (
    email VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    last_signin TIMESTAMP
);

-- Instructors table
CREATE TABLE instructor (
    email VARCHAR PRIMARY KEY,
    name VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    last_signin TIMESTAMP
);

-- Courses table
CREATE TABLE course (
    id SERIAL PRIMARY KEY,
    course_code VARCHAR(6) NOT NULL UNIQUE,
    title VARCHAR(63) NOT NULL,
    description TEXT,
    instructor_email VARCHAR NOT NULL REFERENCES instructor(email)
);

-- Registration table (many-to-many between students and courses)
CREATE TABLE registration (
    student_id VARCHAR NOT NULL REFERENCES student(email),
    course_id INTEGER NOT NULL REFERENCES course(id),
    PRIMARY KEY (student_id, course_id)
);

-- ==============================================
-- QUESTS & REWARDS TABLES
-- ==============================================

-- Quests table
CREATE TABLE quest (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES course(id),
    created_by VARCHAR NOT NULL REFERENCES instructor(email),
    title VARCHAR(63) NOT NULL,
    points INTEGER NOT NULL,
    created_date TIMESTAMP NOT NULL,
    expiration_date TIMESTAMP
);

-- Submissions table
CREATE TABLE submission (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR NOT NULL REFERENCES student(email),
    quest_id INTEGER NOT NULL REFERENCES quest(id),
    submission_date TIMESTAMP NOT NULL,
    status submission_status NOT NULL DEFAULT 'pending',
    verified_by VARCHAR REFERENCES instructor(email),
    verified_date TIMESTAMP
);

-- Rewards table
CREATE TABLE reward (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES course(id),
    created_date TIMESTAMP NOT NULL,
    name VARCHAR(63) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    quantity_limit INTEGER,
    reward_type reward_type NOT NULL DEFAULT 'unspecified',
    active BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT cost_not_negative CHECK (cost >= 0),
    CONSTRAINT quantity_limit_positive CHECK (quantity_limit IS NULL OR quantity_limit > 0)
);

-- Redemptions table
CREATE TABLE redemption (
    id SERIAL PRIMARY KEY UNIQUE,
    student_id VARCHAR NOT NULL REFERENCES student(email),
    reward_id INTEGER NOT NULL REFERENCES reward(id),
    redemption_date TIMESTAMP NOT NULL,
    status redemption_status NOT NULL DEFAULT 'pending',
    fulfillment_date TIMESTAMP,
    instructor_notes TEXT,
    student_notes TEXT
);

-- Transactions table
CREATE TABLE transaction (
    id SERIAL PRIMARY KEY,
    student_id VARCHAR NOT NULL REFERENCES student(email),
    points INTEGER NOT NULL,
    transaction_date TIMESTAMP NOT NULL,
    submission_id INTEGER REFERENCES submission(id),
    redemption_id INTEGER REFERENCES redemption(id),
    CONSTRAINT transaction_source_not_null CHECK (
        (submission_id IS NOT NULL AND redemption_id IS NULL) OR
        (submission_id IS NULL AND redemption_id IS NOT NULL)
    )
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Indexes for foreign keys
CREATE INDEX idx_course_instructor_email ON course(instructor_email);
CREATE INDEX idx_registration_student_id ON registration(student_id);
CREATE INDEX idx_registration_course_id ON registration(course_id);
CREATE INDEX idx_quest_course_id ON quest(course_id);
CREATE INDEX idx_quest_created_by ON quest(created_by);
CREATE INDEX idx_submission_student_id ON submission(student_id);
CREATE INDEX idx_submission_quest_id ON submission(quest_id);
CREATE INDEX idx_submission_verified_by ON submission(verified_by);
CREATE INDEX idx_reward_course_id ON reward(course_id);
CREATE INDEX idx_redemption_student_id ON redemption(student_id);
CREATE INDEX idx_redemption_reward_id ON redemption(reward_id);
CREATE INDEX idx_transaction_student_id ON transaction(student_id);
CREATE INDEX idx_transaction_submission_id ON transaction(submission_id);
CREATE INDEX idx_transaction_redemption_id ON transaction(redemption_id);

-- Indexes for common queries
CREATE INDEX idx_submission_status ON submission(status);
CREATE INDEX idx_redemption_status ON redemption(status);
CREATE INDEX idx_quest_expiration_date ON quest(expiration_date);
CREATE INDEX idx_course_course_code ON course(course_code);

-- ==============================================
-- FUNCTIONS
-- ==============================================

-- Function to generate course codes (equivalent to generateCourseCode in utils.ts)
CREATE OR REPLACE FUNCTION generate_course_code()
RETURNS VARCHAR(6) AS $$
DECLARE
    chars VARCHAR := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    code VARCHAR(6) := '';
    i INTEGER;
BEGIN
    FOR i IN 1..6 LOOP
        code := code || substr(chars, floor(random() * length(chars) + 1)::INTEGER, 1);
    END LOOP;
    RETURN code;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS
-- ==============================================

-- Trigger to automatically generate course_code for new courses
CREATE OR REPLACE FUNCTION set_course_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.course_code IS NULL OR NEW.course_code = '' THEN
        NEW.course_code := generate_course_code();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_course_code
    BEFORE INSERT ON course
    FOR EACH ROW
    EXECUTE FUNCTION set_course_code();

-- ==============================================
-- SAMPLE DATA (OPTIONAL)
-- ==============================================

-- Insert sample instructor
INSERT INTO instructor (email, name, password) VALUES 
('instructor@levelup.edu', 'Dr. Smith', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J5Q5Q5Q5Q');

-- Insert sample student
INSERT INTO student (email, name, password) VALUES 
('student@levelup.edu', 'John Doe', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J5Q5Q5Q5Q');

-- Insert sample course
INSERT INTO course (title, description, instructor_email) VALUES 
('Introduction to Programming', 'Learn the basics of programming with interactive challenges', 'instructor@levelup.edu');

-- ==============================================
-- VIEWS FOR COMMON QUERIES
-- ==============================================

-- View for student progress
CREATE VIEW student_progress AS
SELECT 
    s.email,
    s.name,
    c.title as course_title,
    COALESCE(SUM(t.points), 0) as total_points,
    COUNT(DISTINCT sub.id) as submissions_count,
    COUNT(DISTINCT r.id) as redemptions_count
FROM student s
LEFT JOIN registration reg ON s.email = reg.student_id
LEFT JOIN course c ON reg.course_id = c.id
LEFT JOIN transaction t ON s.email = t.student_id
LEFT JOIN submission sub ON s.email = sub.student_id
LEFT JOIN redemption r ON s.email = r.student_id
GROUP BY s.email, s.name, c.title;

-- View for instructor dashboard
CREATE VIEW instructor_stats AS
SELECT 
    i.email,
    i.name,
    COUNT(DISTINCT c.id) as courses_count,
    COUNT(DISTINCT reg.student_id) as students_count,
    COUNT(DISTINCT q.id) as quests_count,
    COUNT(DISTINCT r.id) as rewards_count
FROM instructor i
LEFT JOIN course c ON i.email = c.instructor_email
LEFT JOIN registration reg ON c.id = reg.course_id
LEFT JOIN quest q ON c.id = q.course_id
LEFT JOIN reward r ON c.id = r.course_id
GROUP BY i.email, i.name;

-- ==============================================
-- COMMENTS
-- ==============================================

COMMENT ON TABLE student IS 'Students registered in the platform';
COMMENT ON TABLE instructor IS 'Instructors who create and manage courses';
COMMENT ON TABLE course IS 'Courses created by instructors';
COMMENT ON TABLE registration IS 'Many-to-many relationship between students and courses';
COMMENT ON TABLE quest IS 'Challenges/assignments within courses';
COMMENT ON TABLE submission IS 'Student submissions for quests';
COMMENT ON TABLE reward IS 'Rewards that students can redeem with points';
COMMENT ON TABLE redemption IS 'Student redemptions of rewards';
COMMENT ON TABLE transaction IS 'Point transactions (earned from submissions or spent on redemptions)';

COMMENT ON COLUMN student.password IS 'Hashed password using bcrypt';
COMMENT ON COLUMN instructor.password IS 'Hashed password using bcrypt';
COMMENT ON COLUMN course.course_code IS 'Unique 6-character code for course identification';
COMMENT ON COLUMN quest.points IS 'Points awarded for completing this quest';
COMMENT ON COLUMN reward.cost IS 'Points required to redeem this reward';
COMMENT ON COLUMN transaction.points IS 'Positive for earnings, negative for redemptions';
