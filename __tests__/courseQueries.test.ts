import {setupTestDb} from './dbSetup'
import type {NodePgDatabase} from 'drizzle-orm/node-postgres'
import type * as schema from '@/db/schema'

// Mock the db module before importing query functions
jest.mock('../src/db/index', () => {
    let mockDb: any
    return {
        get db() {
            return mockDb
        },
        set db(value: any) {
            mockDb = value
        },
        __esModule: true,
    }
})

import {
    createCourse,
    getAllCourses,
    getStudentCoursesWithInstructor,
    getCourseById,
} from '@/db/queries/course'
import {createStudent} from '@/db/queries/student'
import {createInstructor} from '@/db/queries/instructor'
import {registerStudent} from '@/db/queries/registration'
import * as dbModule from '@/db'

describe.skip('Course Queries', () => {
    let testDb: NodePgDatabase<typeof schema>

    beforeAll(async () => {
        testDb = await setupTestDb()
        // Replace the db with testDb
        ;(dbModule as any).db = testDb
    })

    beforeEach(async () => {
        // Clean up test data before each test using pg-promise directly
        const pgPromise = (testDb as any).pgPromise
        await pgPromise.query('DELETE FROM registration')
        await pgPromise.query('DELETE FROM course')
        await pgPromise.query('DELETE FROM student')
        await pgPromise.query('DELETE FROM instructor')
    })

    test('getAllCourses should return courses with instructor names', async () => {
        // Create test instructor
        const instructorEmail = 'instructor@test.com'
        await createInstructor(instructorEmail, 'Test Instructor')

        // Create test courses
        await createCourse({
            email: instructorEmail,
            title: 'Test Course 1',
            description: 'Description 1',
        })
        await createCourse({
            email: instructorEmail,
            title: 'Test Course 2',
            description: 'Description 2',
        })

        const courses = await getAllCourses()

        expect(courses.length).toBeGreaterThanOrEqual(2)
        expect(courses[0]).toHaveProperty('instructorName')
        expect(courses[0].instructorName).toBe('Test Instructor')
        expect(courses[0]).toHaveProperty('title')
        expect(courses[0]).toHaveProperty('courseCode')
    })

    test('getStudentCoursesWithInstructor should return student courses with instructor names', async () => {
        // Create test instructor
        const instructorEmail = 'instructor@test.com'
        await createInstructor(instructorEmail, 'Test Instructor')

        // Create test student
        const studentEmail = 'student@test.com'
        await createStudent(studentEmail, 'Test Student')

        // Create test course
        const course = await createCourse({
            email: instructorEmail,
            title: 'Test Course',
            description: 'Test Description',
        })

        // Register student for course
        await registerStudent(studentEmail, course.id)

        const studentCourses = await getStudentCoursesWithInstructor(studentEmail)

        expect(studentCourses.length).toBe(1)
        expect(studentCourses[0].title).toBe('Test Course')
        expect(studentCourses[0].instructorName).toBe('Test Instructor')
        expect(studentCourses[0]).toHaveProperty('courseCode')
    })

    test('getCourseById should return a course', async () => {
        const instructorEmail = 'instructor@test.com'
        await createInstructor(instructorEmail, 'Test Instructor')

        const course = await createCourse({
            email: instructorEmail,
            title: 'Test Course',
            description: 'Test Description',
        })

        const foundCourse = await getCourseById(course.id)

        expect(foundCourse).not.toBeNull()
        expect(foundCourse?.title).toBe('Test Course')
        expect(foundCourse?.courseCode).toBeDefined()
    })
})

