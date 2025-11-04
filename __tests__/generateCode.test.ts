import {generateCourseCode} from '@/db/utils'

// tests a unique code is generated
describe('Course Code Generation', () => {
    test('should generate a 6 digit course code', async () => {
        const code = generateCourseCode()

        expect(code.length).toBe(6)
        expect(typeof code).toBe('string')
    })
})

