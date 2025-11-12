import {setupTestDb} from './dbSetup'
import type {PostgresJsDatabase} from 'drizzle-orm/postgres-js'
import type * as schema from '@/db/schema'
import {
    createCourse,
    getAllCourses,
    getStudentCoursesWithInstructor,
    getCourseById,
} from '@/db/queries/course'
import {createStudent} from '@/db/queries/student'
import {createInstructor} from '@/db/queries/instructor'
import {registerStudent} from '@/db/queries/registration'

describe('Course Queries', () => {
    let testDb: PostgresJsDatabase<typeof schema>

    beforeAll(async () => {
        testDb = await setupTestDb()
    })

    beforeEach(async () => {
        // Clean up test data before each test
        await testDb.delete(require('@/db/schema').registration)
        await testDb.delete(require('@/db/schema').course)
        await testDb.delete(require('@/db/schema').student)
        await testDb.delete(require('@/db/schema').instructor)
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

